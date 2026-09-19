'use strict';

/**
 * 验证网页端单文件 exe —— node tests/verify-web.js [exe路径]
 *
 * 会真的把 exe 启动起来,请求它的各个接口和静态资源,发一次真实的
 * WHOIS 查询,然后关掉。全部通过退出码 0。
 */

const path = require('path');
const { spawn } = require('child_process');

const EXE = process.argv[2] || path.join(__dirname, '..', 'dist', '域名查询-web', '域名查询-web.exe');
const PORT = 8400 + Math.floor(Math.random() * 100);

const checks = [];
function record(ok, name, extra) {
  checks.push({ ok, name });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  [${extra}]` : ''}`);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(timeout = 20000) {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (res.ok) return true;
    } catch { /* 还没起来 */ }
    if (Date.now() - start > timeout) return false;
    await delay(300);
  }
}

(async () => {
  const fs = require('fs');
  console.log('');
  console.log('  验证网页端单文件版');
  console.log('  ──────────────────────────────────────────────');

  if (!fs.existsSync(EXE)) {
    console.error(`  找不到 exe: ${EXE}`);
    process.exit(1);
  }
  record(true, 'exe 存在', `${(fs.statSync(EXE).size / 1048576).toFixed(1)} MB`);

  const child = spawn(EXE, [], {
    env: { ...process.env, DL_NO_OPEN: '1', PORT: String(PORT), NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let out = '';
  let err = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', (d) => { err += d.toString(); });

  const cleanup = () => { try { child.kill(); } catch { /* ignore */ } };
  process.on('exit', cleanup);

  try {
    const up = await waitForServer();
    record(up, '服务成功启动并响应 /api/health', `端口 ${PORT}`);
    if (!up) throw new Error('服务未启动');

    record(out.includes('域名查询工具'), '启动横幅输出正常');
    record(out.includes('单文件免安装版'), '识别为 SEA 构建(内嵌资源生效)');

    // ---- 静态资源:必须来自 exe 内嵌,磁盘上并没有 public 目录 ----
    const page = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
    record(page.includes('域名查询工具') && page.length > 4000, '首页可访问', `${page.length} 字符`);

    const css = await (await fetch(`http://127.0.0.1:${PORT}/style.css`)).text();
    record(css.length > 15000, '内嵌样式表 /style.css', `${css.length} 字符`);

    const app = await (await fetch(`http://127.0.0.1:${PORT}/app.js`)).text();
    record(app.length > 25000, '内嵌脚本 /app.js', `${app.length} 字符`);

    const help = await (await fetch(`http://127.0.0.1:${PORT}/help.html`)).text();
    record(help.includes('使用说明'), '内嵌使用说明 /help.html', `${help.length} 字符`);

    // ---- 接口 ----
    const meta = await (await fetch(`http://127.0.0.1:${PORT}/api/meta`)).json();
    record(meta.whoisTldCount > 0, '能力信息 /api/meta',
      `WHOIS ${meta.whoisTldCount} 个后缀 / RDAP ${meta.rdapTldCount} 个后缀`);

    // ---- 真实查询 ----
    const full = await (await fetch(`http://127.0.0.1:${PORT}/api/full?domain=example.com`)).json();
    record(full.ok === true, '真实 WHOIS 查询', full.summary ? full.summary.domain : '失败');
    record(!!(full.summary && full.summary.registrar && full.summary.registrar.name), '解析出注册商',
      full.summary && full.summary.registrar ? full.summary.registrar.name : '—');
    record(!!(full.whois && full.whois.servers && full.whois.servers.length), 'WHOIS 查询链路',
      full.whois ? (full.whois.servers || []).join(' → ') : '—');

    // ---- 中文域名 ----
    const idn = await (await fetch(`http://127.0.0.1:${PORT}/api/full?domain=${encodeURIComponent('中国互联网络信息中心.中国')}`)).json();
    record(!!(idn.query && idn.query.ascii && idn.query.ascii.startsWith('xn--')), '中文域名 punycode 转换',
      idn.query ? idn.query.ascii : '—');

    // ---- 可用性 ----
    const chk = await (await fetch(`http://127.0.0.1:${PORT}/api/check?domain=this-definitely-does-not-exist-9f8a7b6c5d.com`)).json();
    record(chk.available === true, '可用性检测', `${chk.confidence} 置信度`);

    record(err.trim() === '', '运行期间无错误输出', err.trim().slice(0, 80) || '无');
  } catch (e) {
    record(false, '验证过程异常', e.message);
  } finally {
    cleanup();
    await delay(800);
  }

  const failed = checks.filter((c) => !c.ok);
  console.log('');
  console.log(`  ──────────────────────────────────────────────`);
  console.log(`  结果:${checks.length - failed.length}/${checks.length} 项通过`);
  console.log('');
  process.exit(failed.length === 0 ? 0 : 1);
})();
