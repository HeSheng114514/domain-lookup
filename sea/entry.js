'use strict';

/**
 * 网页端「单文件免安装版」的入口。
 *
 * 打包方式:esbuild 把整个项目打成一个 JS 文件,再用 Node 的 SEA 功能
 * 注入到 node.exe 里,得到 域名查询-web.exe —— 目标机器不需要装 Node.js。
 *
 * 运行行为:在本机回环地址起 HTTP 服务,自动打开系统默认浏览器,按 Ctrl+C 退出。
 *
 * 环境变量:
 *   PORT        指定端口(默认 8420,被占用时自动往后找)
 *   DL_NO_OPEN  设为 1 则不自动打开浏览器
 *   DL_HOST     监听地址(默认 127.0.0.1;设为 0.0.0.0 可让局域网访问)
 */

const { spawn } = require('child_process');
const path = require('path');

const { createServer } = require('../server.js');
const { isSeaBuild } = require('../lib/assets');

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

/** 用系统默认程序打开 URL(不等待,不占用管道) */
function openBrowser(url) {
  try {
    let cmd;
    let args;
    if (process.platform === 'win32') {
      // start 的第一个参数是窗口标题,必须留一个空字符串占位
      cmd = 'cmd';
      args = ['/c', 'start', '', url];
    } else if (process.platform === 'darwin') {
      cmd = 'open';
      args = [url];
    } else {
      cmd = 'xdg-open';
      args = [url];
    }
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function banner(port) {
  const shown = HOST === '0.0.0.0' ? '<本机 IP>' : HOST;
  const url = `http://${shown === '<本机 IP>' ? '127.0.0.1' : HOST}:${port}`;
  const lines = [
    '',
    `  ${bold('域名查询工具')} ${dim('· 网页端')}`,
    `  ${dim('────────────────────────────────────────────')}`,
    `  访问地址:  ${cyan(url)}`,
    `  监听地址:  ${HOST}:${port}`,
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
    const ok = openBrowser(`http://127.0.0.1:${port}/`);
    if (!ok) {
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

// sea 环境里 __dirname 是 exe 内部路径,这里只是留个引用避免打包器把 path 摇掉
void path;
void isSeaBuild;
