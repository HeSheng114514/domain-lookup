'use strict';

/**
 * 打包成免安装的桌面程序 —— node tools/build-desktop.js
 *
 * 产物:dist/域名查询-win32-x64/域名查询.exe
 * 整个文件夹可以直接拷到任何 Windows 机器上双击运行,不需要装 Node.js。
 *
 * 可选参数:
 *   --arch=x64,arm64   目标架构(默认 x64)
 *   --appdir           只生成目录,不压缩
 */

const fs = require('fs');
const path = require('path');
const { packager } = require('@electron/packager');

const ROOT = path.join(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

const APP_NAME = pkg.productName || '域名查询';
const OUT_DIR = path.join(ROOT, 'dist');

/** 打包时不需要带上的目录/文件 */
const IGNORE = [
  /^\/dist($|\/)/,
  /^\/\.git($|\/)/,
  /^\/tests($|\/)/,
  /^\/tools($|\/)/,
  /^\/启动\.bat$/,
  /^\/\.npmrc$/,
  // 应用运行时只用 Node 内置模块,连 electron 都由运行时提供,
  // 所以一个 node_modules 文件都不需要带上。
  // (packager 自带的 prune 清不干净 devDependency 的残留目录,这里直接整个排除)
  /^\/node_modules($|\/)/,
];

/**
 * 打包收尾:精简语言包 + 附带许可证和说明。
 *
 * 注意:必须挂在 afterComplete 上 —— 只有它的 buildPath 才是最终输出目录。
 * afterCopy 拿到的 buildPath 是 resources/app,那里根本没有 locales。
 */
async function finalizeOutput(...args) {
  const first = args[0];
  const buildPath = typeof first === 'string' ? first : (first && first.buildPath);
  if (!buildPath) return;

  // ---- 精简 Electron 自带的多语言文件,只留简中和英文 ----
  const localesDir = path.join(buildPath, 'locales');
  if (fs.existsSync(localesDir)) {
    const keep = new Set(['zh-CN.pak', 'en-US.pak']);
    let removed = 0;
    let saved = 0;
    for (const f of fs.readdirSync(localesDir)) {
      if (keep.has(f)) continue;
      const p = path.join(localesDir, f);
      try {
        saved += fs.statSync(p).size;
        fs.unlinkSync(p);
        removed += 1;
      } catch { /* ignore */ }
    }
    if (removed) {
      console.log(`  精简语言包: 删除 ${removed} 个文件,省下 ${(saved / 1048576).toFixed(1)} MB`);
    }
  }

  // ---- 附带 GPL 许可证与说明 ----
  // GPL-3.0 要求随二进制一起分发许可证文本,这里把 LICENSE 放进包里。
  try {
    fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(buildPath, 'LICENSE'));
    fs.writeFileSync(path.join(buildPath, '说明.txt'), `域名查询工具 · 桌面版
================================================

版本:     ${pkg.version}
许可:     GPL-3.0-or-later
源码:     https://github.com/HeSheng114514/domain-lookup

怎么用
------
双击「${APP_NAME}.exe」即可,不需要安装任何东西 ——
Node.js 运行时和界面都已经打包在这个文件夹里。

第一次启动可能稍慢(几秒),之后就快了。

功能
----
  · WHOIS 查询:直连全球注册局(TCP 43),自动跟随转介到注册商
  · RDAP 查询:结构化的现代注册数据协议
  · DNS 记录:A / AAAA / CNAME / MX / NS / TXT / SOA / CAA / SRV / PTR
  · 可用性检测:WHOIS + DNS + RDAP 三源交叉验证
  · 批量查询:一次最多 200 个域名,结果实时返回
  · 导出:JSON / CSV / TXT,也可以打印成 PDF
  · 中文域名自动转 punycode

快捷键
------
  Ctrl+N        新建查询
  Ctrl+F        聚焦查询框
  Ctrl+S        导出为 TXT
  Ctrl+D        切换深色/浅色主题
  Ctrl+P        打印 / 另存为 PDF
  F1            使用说明

网络说明
--------
程序会在本机 127.0.0.1 上开一个随机端口的服务,界面从这个本地
服务加载。该服务只监听回环地址,局域网和公网都访问不到。
所有查询都由本机直接发往注册局的 WHOIS(43 端口)和 RDAP(443 端口),
不经过任何第三方网站或接口。

卸载
----
整个文件夹删掉即可,不会在系统里留下别的东西
(窗口位置等设置保存在 %APPDATA%\\域名查询 下,可一并删除)。

许可证
------
本程序以 GNU General Public License v3.0 或更新版本发布。
完整许可证文本见同目录下的 LICENSE 文件。
本程序不提供任何担保,详见许可证。
`);
    console.log('  已附带 LICENSE 与 说明.txt');
  } catch (err) {
    console.log(`  附带许可证失败(不影响程序运行): ${err.message}`);
  }
}

/** 递归计算目录大小 */
function dirSize(dir) {
  let total = 0;
  const walk = (d) => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { try { total += fs.statSync(p).size; } catch { /* ignore */ } }
    }
  };
  walk(dir);
  return total;
}

(async () => {
  const args = process.argv.slice(2);
  const archArg = args.find((a) => a.startsWith('--arch='));
  const arch = archArg ? archArg.slice(7) : 'x64';

  // ---- 前置检查 ----
  const iconPath = path.join(ROOT, 'build', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.error('缺少图标 build/icon.ico,请先运行: node tools/make-icon.js');
    process.exit(1);
  }
  const electronDir = path.join(ROOT, 'node_modules', 'electron');
  if (!fs.existsSync(path.join(electronDir, 'path.txt'))) {
    console.error('Electron 二进制还没下载好。请先运行: node node_modules/electron/install.js');
    process.exit(1);
  }

  console.log('');
  console.log(`  正在打包 ${APP_NAME} (win32-${arch})…`);
  console.log('');

  const t0 = Date.now();

  const appPaths = await packager({
    dir: ROOT,
    name: APP_NAME,
    executableName: APP_NAME,
    platform: 'win32',
    arch,
    out: OUT_DIR,
    icon: iconPath,
    overwrite: true,
    asar: true,
    prune: true,
    ignore: IGNORE,
    appVersion: pkg.version,
    buildVersion: pkg.version,
    electronVersion: require(path.join(electronDir, 'package.json')).version,
    quiet: true,
    win32metadata: {
      CompanyName: 'HeSheng',
      FileDescription: pkg.description,
      ProductName: APP_NAME,
      InternalName: APP_NAME,
      OriginalFilename: `${APP_NAME}.exe`,
      LegalCopyright: 'Copyright (C) 2026 HeSheng. GNU GPL v3.0 or later.',
      'requested-execution-level': 'asInvoker',
    },
    afterComplete: [finalizeOutput],
  });

  const outPath = appPaths[0];
  const exePath = path.join(outPath, `${APP_NAME}.exe`);
  const size = dirSize(outPath);

  console.log('');
  console.log('  打包完成');
  console.log('  ──────────────────────────────────────────────');
  console.log(`  输出目录:  ${outPath}`);
  console.log(`  可执行文件: ${exePath}`);
  console.log(`  总大小:    ${(size / 1048576).toFixed(1)} MB`);
  console.log(`  耗时:      ${((Date.now() - t0) / 1000).toFixed(1)} 秒`);
  console.log('');
  console.log('  这个文件夹可以直接拷到别的 Windows 电脑上双击运行,');
  console.log('  不需要安装 Node.js。想创建桌面快捷方式可以运行:');
  console.log('    node tools/make-shortcut.js');
  console.log('');
})().catch((err) => {
  console.error('\n打包失败:', err && err.message ? err.message : err);
  if (process.env.DSH_DEBUG && err && err.stack) console.error(err.stack);
  process.exit(1);
});
