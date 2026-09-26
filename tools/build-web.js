'use strict';

/**
 * 构建「单文件免安装版」 —— node tools/build-web.js
 *
 * 同一份代码打成两种 exe:
 *
 *   web 模式 → dist/域名查询-web/域名查询-web.exe
 *              起服务后用系统默认浏览器打开(普通标签页)
 *
 *   app 模式 → dist/域名查询-轻量版/域名查询.exe
 *              起服务后用 Edge/Chrome 的 --app 打开,得到无标签栏、无地址栏的
 *              独立窗口。这就是"不打包 Chromium 的桌面版":
 *              体积从 320 MB 降到 90 MB,代价是依赖目标机器装过 Edge/Chrome。
 *
 * 构建流程:
 *   1. esbuild 把整个项目(server.js + lib/ + sea/entry.js)打成单个 JS 文件,
 *      并用 define 把模式常量注入进去
 *   2. 生成 sea-config.json,把 public/ 下的静态资源列为内嵌资源
 *   3. node --experimental-sea-config 生成注入用的 blob
 *   4. 复制 node.exe 作为模板,剥离它的 Authenticode 签名
 *   5. postject 把 blob 注入进去
 *
 * 两种产物都不需要目标机器安装 Node.js。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

// Node SEA 约定的哨兵字节串,必须与 Node 内部一致
const SENTINEL_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

const pkg = require(path.join(ROOT, 'package.json'));

/** 要构建的两个变体 */
const VARIANTS = [
  {
    mode: 'web',
    dirName: '域名查询-web',
    exeName: '域名查询-web.exe',
    label: '网页端(系统默认浏览器)',
  },
  {
    mode: 'app',
    dirName: '域名查询-轻量版',
    exeName: '域名查询.exe',
    label: '桌面版(轻量,系统浏览器内核)',
  },
];

/* -------------------- 收集内嵌资源 -------------------- */

function collectAssets(dir, acc = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (entry.isDirectory()) collectAssets(full, acc);
    else if (entry.isFile()) acc[rel] = rel; // 键即相对路径,值也相对项目根目录
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
  fs.writeFileSync(file, buf.subarray(0, certFileOff)); // 证书表固定在文件末尾
  return { stripped: true, removed: certSize };
}

/* -------------------- 说明文件 -------------------- */

function readmeText(v) {
  const usage = v.mode === 'app'
    ? `双击「${v.exeName}」即可。程序会在本机起一个网页服务,
并用系统自带浏览器(Edge 或 Chrome)的"应用窗口"打开界面 ——
没有标签栏、没有地址栏,任务栏里是独立的一项,和一个原生桌面程序一样。

不需要安装 Node.js —— 运行时已经打包在这个 exe 里了。
只需要机器上装过 Microsoft Edge(Windows 10/11 默认自带)或 Chrome;
如果两者都没有,会自动回退到用默认浏览器打开。`
    : `双击「${v.exeName}」即可。程序会在本机起一个网页服务,
并自动用系统默认浏览器打开界面。

不需要安装 Node.js —— 运行时已经打包在这个 exe 里了。`;

  return `域名查询工具 · ${v.label}
================================================

版本:     ${pkg.version}
许可:     GPL-3.0-or-later
源码:     https://github.com/HeSheng114514/domain-lookup

怎么用
------
${usage}

默认端口 8420,如果被占用会自动往后找。
关掉那个黑色窗口就是停止服务。

常用环境变量
------------
  set PORT=9000        换一个端口
  set DL_NO_OPEN=1     启动时不自动打开浏览器
  set DL_HOST=0.0.0.0  允许局域网内其他设备访问(默认只监听本机)
  set DL_BROWSER=路径  指定用哪个浏览器打开

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
`;
}

/* -------------------- 构建单个变体 -------------------- */

async function buildVariant(v) {
  const esbuild = require('esbuild');

  const bundle = path.join(BUILD_DIR, `${v.mode}-bundle.cjs`);
  const seaConfigPath = path.join(BUILD_DIR, `${v.mode}-sea-config.json`);
  const seaBlob = path.join(BUILD_DIR, `${v.mode}-prep.blob`);
  const outDir = path.join(ROOT, 'dist', v.dirName);
  const exePath = path.join(outDir, v.exeName);

  console.log('');
  console.log(`  构建 ${v.label}`);
  console.log('  ──────────────────────────────────────────────');

  // ---- 1. 打包 JS ----
  process.stdout.write('  [1/5] esbuild 打包… ');
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'sea', 'entry.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: bundle,
    packages: 'bundle',
    logLevel: 'silent',
    // 把运行模式编译进去,运行时就不用判断了
    define: { __DL_MODE__: JSON.stringify(v.mode) },
    banner: { js: `/* 域名查询工具 ${v.label} · 由 tools/build-web.js 生成 */` },
  });
  if (result.warnings.length) {
    for (const w of result.warnings) console.log(`\n    警告: ${w.text}`);
  }
  console.log(`完成 (${(fs.statSync(bundle).size / 1024).toFixed(1)} KB)`);

  // ---- 2. 生成 sea-config ----
  process.stdout.write('  [2/5] 生成 sea-config… ');
  const assets = collectAssets(path.join(ROOT, 'public'));
  fs.writeFileSync(seaConfigPath, JSON.stringify({
    main: path.relative(ROOT, bundle).split(path.sep).join('/'),
    output: path.relative(ROOT, seaBlob).split(path.sep).join('/'),
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    assets,
  }, null, 2));
  console.log(`完成 (内嵌 ${Object.keys(assets).length} 个资源)`);

  // ---- 3. 生成 SEA blob ----
  process.stdout.write('  [3/5] 生成 SEA blob… ');
  try {
    execFileSync(process.execPath, ['--experimental-sea-config', path.relative(ROOT, seaConfigPath)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    console.log('失败');
    console.error(`\n    ${err.stderr ? err.stderr.toString() : err.message}`);
    throw err;
  }
  console.log(`完成 (${(fs.statSync(seaBlob).size / 1024).toFixed(1)} KB)`);

  // ---- 4. 复制运行时并剥离签名 ----
  process.stdout.write('  [4/5] 复制 Node 运行时… ');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(process.execPath, exePath);
  const tplSize = fs.statSync(exePath).size;
  const sig = stripAuthenticode(exePath);
  console.log(sig.stripped
    ? `完成 (模板 ${(tplSize / 1048576).toFixed(1)} MB,已剥离 ${(sig.removed / 1024).toFixed(0)} KB 签名)`
    : `完成 (模板 ${(tplSize / 1048576).toFixed(1)} MB,${sig.reason})`);

  // ---- 5. 注入 blob ----
  process.stdout.write('  [5/5] 注入 SEA blob… ');
  const { inject } = require('postject');
  await inject(exePath, 'NODE_SEA_BLOB', fs.readFileSync(seaBlob), {
    sentinelFuse: SENTINEL_FUSE,
  });
  console.log('完成');

  // ---- 附带许可证与说明 ----
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(outDir, 'LICENSE'));
  fs.writeFileSync(path.join(outDir, '说明.txt'), readmeText(v));

  const exeSize = fs.statSync(exePath).size;
  console.log('');
  console.log(`  输出: ${outDir}`);
  console.log(`  大小: ${(exeSize / 1048576).toFixed(1)} MB`);
  return { ...v, outDir, exePath, size: exeSize };
}

/* -------------------- 主流程 -------------------- */

(async () => {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const built = [];
  for (const v of VARIANTS) {
    built.push(await buildVariant(v));
  }

  console.log('');
  console.log('  ══════════════════════════════════════════════');
  console.log('  全部构建完成');
  for (const b of built) {
    console.log(`    ${b.label.padEnd(24)} ${b.dirName}`);
  }
  console.log('');
})().catch((err) => {
  console.error('\n  构建失败:', err && err.message ? err.message : err);
  if (err && err.stack && process.env.DSH_DEBUG) console.error(err.stack);
  process.exit(1);
});
