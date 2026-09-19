'use strict';

/**
 * 构建网页端「单文件免安装版」 —— node tools/build-web.js
 *
 * 流程:
 *   1. esbuild 把整个项目(server.js + lib/ + sea/entry.js)打成单个 JS 文件
 *   2. 生成 sea-config.json,把 public/ 下的静态资源列为内嵌资源
 *   3. node --experimental-sea-config 生成注入用的 blob
 *   4. 复制 node.exe 作为模板
 *   5. postject 把 blob 注入进去,得到 域名查询-web.exe
 *
 * 产物在 dist/域名查询-web/,目标机器不需要安装 Node.js。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const OUT_DIR = path.join(ROOT, 'dist', '域名查询-web');
const EXE_NAME = '域名查询-web.exe';

const BUNDLE = path.join(BUILD_DIR, 'web-bundle.cjs');
const SEA_CONFIG = path.join(BUILD_DIR, 'sea-config.json');
const SEA_BLOB = path.join(BUILD_DIR, 'sea-prep.blob');

// Node SEA 约定的哨兵字节串,必须与 Node 内部一致
const SENTINEL_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

const pkg = require(path.join(ROOT, 'package.json'));

/* -------------------- 收集内嵌资源 -------------------- */

function collectAssets(dir, base = dir, acc = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      collectAssets(full, base, acc);
    } else if (entry.isFile()) {
      acc[rel] = rel; // 键即相对路径,值同样是相对路径(相对项目根目录)
    }
  }
  return acc;
}

/* -------------------- 剥离 Authenticode 签名 -------------------- */

/**
 * node.exe 是带数字签名的,往里面注入 blob 会把签名弄坏。
 * 一个"损坏的签名"比"没有签名"更糟(看起来更可疑),
 * 所以先把 PE 里的安全目录清掉、把证书数据截掉,得到干净的无签名 exe。
 *
 * 不依赖任何工具,直接按 PE 格式操作:
 *   DOS 头 -> e_lfanew -> PE 签名 -> COFF 头 -> 可选头 -> 数据目录[4] = 安全目录
 */
function stripAuthenticode(file) {
  const buf = fs.readFileSync(file);

  if (buf.length < 0x40 || buf.readUInt16LE(0) !== 0x5a4d) {
    return { stripped: false, reason: '不是 PE 文件' };
  }
  const peOff = buf.readUInt32LE(0x3c);
  if (peOff + 24 > buf.length || buf.readUInt32LE(peOff) !== 0x00004550) {
    return { stripped: false, reason: 'PE 签名无效' };
  }

  const optOff = peOff + 24;
  const magic = buf.readUInt16LE(optOff);
  const is64 = magic === 0x20b;
  if (magic !== 0x10b && magic !== 0x20b) {
    return { stripped: false, reason: `未知 PE 类型 0x${magic.toString(16)}` };
  }

  const numDirs = buf.readUInt32LE(optOff + (is64 ? 108 : 92));
  if (numDirs < 5) return { stripped: false, reason: '没有安全目录' };

  const ddOff = optOff + (is64 ? 112 : 96);
  const secOff = ddOff + 4 * 8; // 数据目录第 4 项 = 安全目录
  if (secOff + 8 > buf.length) return { stripped: false, reason: '安全目录越界' };

  const certFileOff = buf.readUInt32LE(secOff);
  const certSize = buf.readUInt32LE(secOff + 4);
  if (!certFileOff || !certSize) return { stripped: false, reason: '本来就没有签名' };
  if (certFileOff >= buf.length) return { stripped: false, reason: '证书偏移越界' };

  buf.writeUInt32LE(0, secOff);
  buf.writeUInt32LE(0, secOff + 4);
  // 证书表固定在文件末尾,直接截掉
  fs.writeFileSync(file, buf.subarray(0, certFileOff));
  return { stripped: true, removed: certSize };
}

/* -------------------- 主流程 -------------------- */

(async () => {
  console.log('');
  console.log('  构建网页端单文件版');
  console.log('  ──────────────────────────────────────────────');

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // ---- 1. 打包 JS ----
  process.stdout.write('  [1/5] esbuild 打包… ');
  const esbuild = require('esbuild');
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'sea', 'entry.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: BUNDLE,
    // 打包后没有 node_modules,所有依赖都必须内联进来
    packages: 'bundle',
    logLevel: 'silent',
    banner: {
      js: `/* 域名查询工具 网页端单文件版 · 由 tools/build-web.js 生成 */`,
    },
  });
  if (result.warnings.length) {
    console.log('\n    警告:');
    for (const w of result.warnings) console.log(`      ${w.text}`);
  }
  const bundleSize = fs.statSync(BUNDLE).size;
  console.log(`完成 (${(bundleSize / 1024).toFixed(1)} KB)`);

  // ---- 2. 生成 sea-config ----
  process.stdout.write('  [2/5] 生成 sea-config.json… ');
  const assets = collectAssets(path.join(ROOT, 'public'));
  const seaConfig = {
    main: path.relative(ROOT, BUNDLE).split(path.sep).join('/'),
    output: path.relative(ROOT, SEA_BLOB).split(path.sep).join('/'),
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    assets,
  };
  fs.writeFileSync(SEA_CONFIG, JSON.stringify(seaConfig, null, 2));
  console.log(`完成 (内嵌 ${Object.keys(assets).length} 个资源: ${Object.keys(assets).join(', ')})`);

  // ---- 3. 生成 SEA blob ----
  process.stdout.write('  [3/5] 生成 SEA blob… ');
  try {
    execFileSync(process.execPath, ['--experimental-sea-config', path.relative(ROOT, SEA_CONFIG)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    console.log('失败');
    console.error(`\n    ${err.stderr ? err.stderr.toString() : err.message}`);
    process.exit(1);
  }
  const blobSize = fs.statSync(SEA_BLOB).size;
  console.log(`完成 (${(blobSize / 1024).toFixed(1)} KB)`);

  // ---- 4. 复制 node.exe 作为模板,并剥离其数字签名 ----
  process.stdout.write('  [4/5] 复制 Node 运行时… ');
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const exePath = path.join(OUT_DIR, EXE_NAME);
  fs.copyFileSync(process.execPath, exePath);
  const tplSize = fs.statSync(exePath).size;
  const sig = stripAuthenticode(exePath);
  if (sig.stripped) {
    console.log(`完成 (模板 ${(tplSize / 1048576).toFixed(1)} MB,已剥离 ${(sig.removed / 1024).toFixed(0)} KB 签名)`);
  } else {
    console.log(`完成 (模板 ${(tplSize / 1048576).toFixed(1)} MB,${sig.reason})`);
  }

  // ---- 5. 注入 blob ----
  process.stdout.write('  [5/5] 注入 SEA blob… ');
  try {
    const { inject } = require('postject');
    await inject(exePath, 'NODE_SEA_BLOB', fs.readFileSync(SEA_BLOB), {
      sentinelFuse: SENTINEL_FUSE,
    });
  } catch (err) {
    console.log('失败');
    console.error(`\n    ${err.message}`);
    process.exit(1);
  }
  console.log('完成');

  // ---- 附带许可证与说明 ----
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(OUT_DIR, 'LICENSE'));
  fs.writeFileSync(path.join(OUT_DIR, '说明.txt'), `域名查询工具 · 网页端(单文件免安装版)
================================================

版本:     ${pkg.version}
许可:     GPL-3.0-or-later
源码:     https://github.com/HeSheng114514/domain-lookup

怎么用
------
双击「${EXE_NAME}」即可。程序会在本机起一个网页服务,
并自动打开浏览器。关掉那个黑色窗口就是停止服务。

不需要安装 Node.js —— 运行时已经打包在这个 exe 里了。

默认端口 8420,如果被占用会自动往后找。

常用环境变量
------------
  set PORT=9000        换一个端口
  set DL_NO_OPEN=1     启动时不自动打开浏览器
  set DL_HOST=0.0.0.0  允许局域网内其他设备访问(默认只监听本机)

命令行版本
----------
同一个仓库里还有命令行版本,可以这样用:

  node cli.js example.com

网络说明
--------
服务只监听本机回环地址,局域网和公网都访问不到。
所有查询都由本机直接发往注册局的 WHOIS(43 端口)和 RDAP(443 端口),
不经过任何第三方网站或接口。

许可证
------
本程序以 GNU General Public License v3.0 或更新版本发布。
完整许可证文本见同目录下的 LICENSE 文件。
本程序不提供任何担保,详见许可证。
`);

  // ---- 汇总 ----
  const exeSize = fs.statSync(exePath).size;
  let dirSize = 0;
  for (const f of fs.readdirSync(OUT_DIR)) dirSize += fs.statSync(path.join(OUT_DIR, f)).size;

  console.log('');
  console.log('  构建完成');
  console.log('  ──────────────────────────────────────────────');
  console.log(`  输出目录:   ${OUT_DIR}`);
  console.log(`  可执行文件: ${exePath}`);
  console.log(`  大小:       ${(exeSize / 1048576).toFixed(1)} MB`);
  console.log(`  内嵌资源:   ${Object.keys(assets).length} 个`);
  console.log('');
  console.log('  已附带 LICENSE 与 说明.txt');
  console.log('');
})().catch((err) => {
  console.error('\n  构建失败:', err && err.message ? err.message : err);
  if (err && err.stack && process.env.DSH_DEBUG) console.error(err.stack);
  process.exit(1);
});
