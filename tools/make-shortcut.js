'use strict';

/**
 * 创建桌面 / 开始菜单快捷方式 —— node tools/make-shortcut.js
 *
 * 会先在 dist/ 里找已打包好的 exe;找不到就退而用本机的 Electron(开发模式)。
 * 通过 WScript.Shell COM 创建 .lnk,不需要任何第三方库。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));
const APP_NAME = pkg.productName || '域名查询';
const ICON = path.join(ROOT, 'build', 'icon.ico');

/** 在 dist 下找打包好的 exe */
function findPackagedExe() {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) return null;
  for (const dir of fs.readdirSync(dist)) {
    const exe = path.join(dist, dir, `${APP_NAME}.exe`);
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

function runPs(script) {
  // 用 PowerShell 调 WScript.Shell 创建快捷方式
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-EncodedCommand', encoded,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function psQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/**
 * @param {string} iconLocation 图标来源。指向 exe 自身最稳妥 ——
 *   这样即使把 dist 文件夹整个拷到别的电脑,快捷方式图标也不会失效。
 */
function createShortcut(lnkPath, target, args, workingDir, description, iconLocation) {
  const script = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut(${psQuote(lnkPath)})
$sc.TargetPath = ${psQuote(target)}
$sc.Arguments = ${psQuote(args || '')}
$sc.WorkingDirectory = ${psQuote(workingDir)}
$sc.Description = ${psQuote(description)}
${iconLocation ? `$sc.IconLocation = ${psQuote(iconLocation)}` : ''}
$sc.Save()
Write-Output "OK"
`;
  runPs(script);
}

/* -------------------- 主流程 -------------------- */

const exe = findPackagedExe();
const desktop = path.join(process.env.USERPROFILE || '', 'Desktop');
const startMenu = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');

console.log('');
if (exe) {
  console.log(`  找到已打包程序: ${exe}`);
  const wd = path.dirname(exe);
  const targets = [];
  if (fs.existsSync(desktop)) targets.push([path.join(desktop, `${APP_NAME}.lnk`), '桌面']);
  if (fs.existsSync(startMenu)) targets.push([path.join(startMenu, `${APP_NAME}.lnk`), '开始菜单']);

  if (!targets.length) {
    console.log('  没找到桌面或开始菜单目录。');
    process.exit(1);
  }

  for (const [lnk, label] of targets) {
    try {
      // 图标直接用 exe 自己内嵌的那份(exe 之后跟一个逗号表示取第 0 个图标)
      createShortcut(lnk, exe, '', wd, `${APP_NAME} — WHOIS / RDAP / DNS 域名查询`, `${exe},0`);
      console.log(`  ✓ 已创建${label}快捷方式: ${lnk}`);
    } catch (err) {
      console.log(`  ✗ 创建${label}快捷方式失败: ${err.message}`);
    }
  }
  console.log('\n  现在可以直接从桌面双击启动了。\n');
} else {
  // 开发模式:指向 electron.exe + 项目目录
  const electronExe = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe');
  if (!fs.existsSync(electronExe)) {
    console.error('  还没打包,也没找到本机 Electron。');
    console.error('  请先运行: node tools/build-desktop.js');
    process.exit(1);
  }
  const lnk = path.join(desktop, `${APP_NAME}(开发版).lnk`);
  try {
    createShortcut(lnk, electronExe, `"${ROOT}"`, ROOT, `${APP_NAME} — 开发模式`, ICON);
    console.log(`  ✓ 已创建开发版快捷方式: ${lnk}`);
    console.log('  (正式发布请先运行 node tools/build-desktop.js 打包)\n');
  } catch (err) {
    console.error(`  创建快捷方式失败: ${err.message}`);
    process.exit(1);
  }
}
