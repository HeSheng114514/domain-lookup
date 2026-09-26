'use strict';

/**
 * 免安装单文件版的入口。同一份代码打成两种 exe:
 *
 *   MODE = 'web'  域名查询-web.exe    起服务后用系统默认浏览器打开(普通标签页)
 *   MODE = 'app'  域名查询.exe        起服务后用 Edge/Chrome 的 --app 模式打开
 *                                     —— 无标签栏、无地址栏的独立窗口,用系统自带的浏览器内核
 *
 * 'app' 模式是"不打包 Chromium 的桌面版":体积从 320 MB 降到 90 MB,
 * 代价是需要目标机器装过 Edge 或 Chrome(Windows 10/11 默认都有 Edge)。
 *
 * 打包方式:esbuild 把整个项目打成一个 JS 文件,再用 Node 的 SEA 功能
 * 注入到 node.exe 里 —— 目标机器不需要装 Node.js。
 *
 * 环境变量:
 *   PORT         指定端口(默认 8420,被占用时自动往后找)
 *   DL_NO_OPEN   设为 1 则不自动打开
 *   DL_HOST      监听地址(默认 127.0.0.1;设为 0.0.0.0 可让局域网访问)
 *   DL_BROWSER   指定浏览器可执行文件路径
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { createServer } = require('../server.js');
const { isSeaBuild } = require('../lib/assets');

/** 构建时由 esbuild 的 define 注入;直接跑源码时按 'web' 处理 */
const MODE = typeof __DL_MODE__ !== 'undefined' ? __DL_MODE__ : 'web';

const BASE_PORT = Number(process.env.PORT || 8420);
const HOST = process.env.DL_HOST || '127.0.0.1';
const AUTO_OPEN = process.env.DL_NO_OPEN !== '1';
const MAX_PORT_TRIES = 20;

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c('1');
const dim = c('2');
const cyan = c('36');
const green = c('32');
const yellow = c('33');

/* -------------------- 启动浏览器 -------------------- */

/** 找系统里的 Edge / Chrome(按优先级) */
function findChromium() {
  if (process.env.DL_BROWSER && fs.existsSync(process.env.DL_BROWSER)) {
    return process.env.DL_BROWSER;
  }
  if (process.platform !== 'win32') return null;

  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA || '';

  const candidates = [
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    local && path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);

  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  return null;
}

function spawnDetached(cmd, args) {
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

/** 用系统默认程序打开 URL(不等待,不占用管道) */
function openBrowser(url) {
  if (process.platform === 'win32') {
    // start 的第一个参数是窗口标题,必须留一个空字符串占位
    return spawnDetached('cmd', ['/c', 'start', '', url]);
  }
  if (process.platform === 'darwin') return spawnDetached('open', [url]);
  return spawnDetached('xdg-open', [url]);
}

/**
 * 用 Edge/Chrome 的 --app 模式打开 —— 得到没有标签栏和地址栏的独立窗口,
 * 在任务栏里是单独的一项,和用户平时浏览的窗口互不干扰。
 * @returns {{ok:boolean, browser?:string}}
 */
function openAppWindow(url) {
  const browser = findChromium();
  if (!browser) return { ok: false };

  const args = [
    `--app=${url}`,
    '--window-size=1280,860',
    '--no-first-run',
    '--no-default-browser-check',
    // 独立的用户数据目录:一来让窗口有自己的身份,二来不碰用户平时的浏览数据。
    // 放在临时目录里,不会污染用户配置。
    `--user-data-dir=${path.join(require('os').tmpdir(), 'domain-lookup-app-window')}`,
  ];
  const ok = spawnDetached(browser, args);
  return { ok, browser: path.basename(browser) };
}

function banner(port) {
  const shown = HOST === '0.0.0.0' ? '<本机 IP>' : HOST;
  const url = `http://${shown === '<本机 IP>' ? '127.0.0.1' : HOST}:${port}`;
  const lines = [
    '',
    `  ${bold('域名查询工具')} ${dim(MODE === 'app' ? '· 桌面版(轻量)' : '· 网页端')}`,
    `  ${dim('────────────────────────────────────────────')}`,
    `  访问地址:  ${cyan(url)}`,
    `  监听地址:  ${HOST}:${port}`,
    `  打开方式:  ${MODE === 'app' ? '系统浏览器的独立应用窗口' : '系统默认浏览器'}`,
    `  运行方式:  ${isSeaBuild ? '单文件免安装版(内嵌 Node.js)' : 'Node.js 源码模式'}`,
    `  Node 版本: ${process.version}`,
    '',
    `  ${dim('按 Ctrl+C 停止服务')}`,
    '',
  ];
  console.log(lines.join('\n'));
}

/** 端口被占用时自动往后找一个空闲的 */
function listen(server, port, attemptsLeft) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('listening', onListening);
      if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        console.log(`  ${yellow('!')} 端口 ${port} 被占用,改用 ${port + 1}`);
        resolve(listen(server, port + 1, attemptsLeft - 1));
      } else {
        reject(err);
      }
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, HOST);
  });
}

(async () => {
  const server = createServer();

  let port;
  try {
    port = await listen(server, BASE_PORT, MAX_PORT_TRIES);
  } catch (err) {
    console.error('');
    console.error(`  ${c('31')('启动失败:')} ${err.message}`);
    if (err.code === 'EACCES') {
      console.error('  该端口被系统保留,换一个端口再试,例如:');
      console.error(`    set PORT=9000 && 域名查询-web.exe`);
    }
    console.error('');
    process.exitCode = 1;
    return;
  }

  banner(port);

  if (AUTO_OPEN) {
    const url = `http://127.0.0.1:${port}/`;
    let opened = false;

    if (MODE === 'app') {
      const r = openAppWindow(url);
      opened = r.ok;
      if (r.ok) {
        console.log(`  ${dim(`已用 ${r.browser} 打开独立窗口`)}`);
      } else {
        console.log(`  ${yellow('!')} 没找到 Edge 或 Chrome,改用系统默认浏览器`);
      }
    }
    if (!opened) opened = openBrowser(url);

    if (!opened) {
      console.log(`  ${dim('没能自动打开浏览器,请手动访问上面的地址')}`);
    }
  }

  // 优雅退出
  const shutdown = () => {
    console.log(`\n  ${green('✓')} 服务已停止\n`);
    server.close(() => process.exit(0));
    // 兜底:1 秒内没关干净就强退
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error(`\n  启动异常: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});

void isSeaBuild;
