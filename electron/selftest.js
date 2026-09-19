'use strict';

/**
 * 桌面版自检 —— 在真实的 Electron 运行时里跑一遍完整流程。
 *
 *   set DL_SELFTEST=1 && npm run desktop
 *
 * 验证内容:窗口能加载页面 → 内嵌 HTTP 服务可用 → 前端 JS 正常执行 →
 * 真实 WHOIS/RDAP/DNS 查询能拿到结果 → 结果正确渲染到界面上。
 * 全部通过退出码 0,否则为 1。
 *
 * 打包后的 exe 是 GUI 程序,控制台输出看不到,所以报告同时写一份到
 * 文件里(路径见 DL_SELFTEST_OUT,默认在系统临时目录)。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const checks = [];
const lines = [];

/** 同时输出到控制台和报告缓冲区 */
function out(text = '') {
  lines.push(text);
  console.log(text);
}

function record(ok, name, extra) {
  checks.push({ ok, name, extra });
  out(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  [${extra}]` : ''}`);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function reportPath() {
  return process.env.DL_SELFTEST_OUT
    || path.join(os.tmpdir(), 'domain-lookup-selftest.txt');
}

function writeReport(exitCode) {
  const failed = checks.filter((c) => !c.ok);
  const body = [
    ...lines,
    '',
    `===== 结果:${checks.length - failed.length}/${checks.length} 项通过 =====`,
    failed.length ? `退出码:${exitCode}` : '全部通过',
    '',
  ].join('\n');
  try {
    fs.writeFileSync(reportPath(), body, 'utf8');
  } catch { /* 写不了就算了 */ }
  return reportPath();
}

async function waitFor(fn, { timeout = 45000, interval = 300, label = '条件' } = {}) {
  const start = Date.now();
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const v = await fn();
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error(`等待${label}超时(${timeout}ms)`);
    // eslint-disable-next-line no-await-in-loop
    await delay(interval);
  }
}

async function runSelfTest(win, port) {
  out('');
  out('===== 桌面版自检 =====');
  out('');
  out(`  内嵌服务端口: ${port}`);
  out(`  报告文件:     ${reportPath()}`);

  const pageErrors = [];
  win.webContents.on('console-message', (event) => {
    const level = event && event.level;
    const message = event && event.message;
    if (level === 'error' || level === 3) pageErrors.push(String(message));
  });
  win.webContents.on('render-process-gone', (e, d) => pageErrors.push(`渲染进程崩溃: ${JSON.stringify(d)}`));

  try {
    // ---- 1. 页面加载 ----
    await waitFor(() => !win.webContents.isLoading(), { label: '页面加载完成', timeout: 30000 });
    await delay(500);

    const title = await win.webContents.executeJavaScript('document.title');
    record(!!title && title.includes('域名查询'), '窗口加载页面', title);

    const hasApp = await win.webContents.executeJavaScript(
      'typeof doSearch === "function" && !!document.getElementById("domainInput")',
    );
    record(hasApp, '前端脚本执行成功');

    // ---- 2. 内嵌服务可用 ----
    const health = await win.webContents.executeJavaScript(
      'fetch("/api/health").then(r=>r.json()).then(j=>j.ok).catch(e=>String(e))',
    );
    record(health === true, '内嵌 HTTP 服务 /api/health', String(health));

    const meta = await win.webContents.executeJavaScript(
      'fetch("/api/meta").then(r=>r.json()).catch(()=>null)',
    );
    record(!!meta && meta.whoisTldCount > 0,
      '能力信息 /api/meta',
      meta ? `WHOIS ${meta.whoisTldCount} 个后缀 / RDAP ${meta.rdapTldCount} 个后缀` : '无响应');

    // ---- 3. 真实查询 ----
    out('');
    out('  -- 发起真实查询 example.com --');

    const full = await win.webContents.executeJavaScript(
      'fetch("/api/full?domain=example.com").then(r=>r.json())',
    );
    const summary = (full && full.summary) || {};

    record(full && full.ok === true, '桌面版内真实 WHOIS 查询', summary.domain || '失败');
    record(!!(summary.registrar && summary.registrar.name), '解析出注册商', summary.registrar ? summary.registrar.name : '—');
    record(!!(summary.nameServers && summary.nameServers.length), '解析出域名服务器',
      `${(summary.nameServers || []).length} 条`);
    record(!!(full && full.whois && full.whois.servers && full.whois.servers.length), 'WHOIS 查询链路',
      full && full.whois ? (full.whois.servers || []).join(' → ') : '—');
    record(!!summary.expires, '解析出到期时间', summary.expires || '—');

    // ---- 4. 界面渲染(走真实界面流程) ----
    await win.webContents.executeJavaScript('doSearch("example.com")');
    await waitFor(async () => win.webContents.executeJavaScript(
      '!document.getElementById("resultArea").classList.contains("hidden")',
    ), { label: '结果区显示', timeout: 60000 });

    const overviewText = await win.webContents.executeJavaScript(
      'document.getElementById("panel-overview").innerText',
    );
    record(overviewText.includes('注册商'), '概览卡片已渲染');
    record(overviewText.includes('生命周期'), '生命周期时间轴已渲染', `${overviewText.length} 字符`);
    record(overviewText.includes('clientTransferProhibited') || overviewText.includes('禁止转移'),
      'EPP 状态及中文解释已渲染');

    const dnsText = await win.webContents.executeJavaScript(
      'document.getElementById("panel-dns").innerText',
    );
    record(dnsText.length > 30, 'DNS 面板已渲染', `${dnsText.length} 字符`);

    const whoisText = await win.webContents.executeJavaScript(
      'document.getElementById("panel-whois").innerText',
    );
    record(whoisText.includes('Domain Name') || whoisText.includes('EXAMPLE.COM'),
      'WHOIS 原文面板已渲染');

    const rdapText = await win.webContents.executeJavaScript(
      'document.getElementById("panel-rdap").innerText',
    );
    record(rdapText.length > 30, 'RDAP 面板已渲染', `${rdapText.length} 字符`);

    // ---- 5. 中文国际化域名 ----
    const idn = await win.webContents.executeJavaScript(
      'fetch("/api/full?domain=" + encodeURIComponent("中国互联网络信息中心.中国")).then(r=>r.json())',
    );
    record(!!(idn && idn.query && idn.query.ascii && idn.query.ascii.startsWith('xn--')),
      '中文域名 punycode 转换', idn && idn.query ? idn.query.ascii : '—');

    // ---- 6. 可用性检测 ----
    const check = await win.webContents.executeJavaScript(
      'fetch("/api/check?domain=this-definitely-does-not-exist-9f8a7b6c5d.com").then(r=>r.json())',
    );
    record(check && check.available === true, '可用性检测(不存在的域名判为可注册)',
      check ? `${check.confidence} 置信度, ${check.votes.registered}/${check.votes.available} 票` : '—');

    // ---- 7. 页面错误 ----
    record(pageErrors.length === 0, '渲染进程无 JS 报错',
      pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : '无');

    // ---- 8. 打包完整性 ----
    record(fs.existsSync(path.join(__dirname, '..', 'build', 'icon.ico')), '应用图标已打包');
    record(fs.existsSync(path.join(__dirname, '..', 'build', 'icon.png')), '关于窗口图标已打包');
    record(fs.existsSync(path.join(__dirname, '..', 'public', 'index.html')), '前端资源已打包');
    record(fs.existsSync(path.join(__dirname, '..', 'public', 'help.html')), '使用说明页已打包');
    record(fs.existsSync(path.join(__dirname, '..', 'lib', 'parse.js')), '核心库已打包');

    // 使用说明页能正常加载
    const helpOk = await win.webContents.executeJavaScript(
      'fetch("/help.html").then(r=>r.text()).then(t=>t.includes("使用说明")).catch(()=>false)',
    );
    record(helpOk === true, '使用说明页可访问 /help.html');
  } catch (err) {
    record(false, '自检过程异常', err.message);
  }

  const failed = checks.filter((c) => !c.ok);
  out('');
  out(`===== 结果:${checks.length - failed.length}/${checks.length} 项通过 =====`);
  if (failed.length) {
    out('');
    out('失败项:');
    for (const f of failed) out(`  - ${f.name}${f.extra ? `: ${f.extra}` : ''}`);
  }
  out('');

  const exitCode = failed.length === 0 ? 0 : 1;
  writeReport(exitCode);
  console.log(`报告已写入: ${reportPath()}`);
  return exitCode;
}

module.exports = { runSelfTest };
