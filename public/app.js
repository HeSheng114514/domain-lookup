/* ===========================================================
   域名查询工具 — 前端逻辑(原生 JS,无依赖)
   =========================================================== */
'use strict';

const $ = (sel) => document.querySelector(sel);

const state = {
  current: null,      // 当前 /api/full 的响应
  meta: null,
  bulkRows: [],
  bulkSource: null,
};

/* -------------------- 工具函数 -------------------- */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDays(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs < 1) return '不到 1 天';
  if (abs < 365) return `${abs} 天`;
  const y = Math.floor(abs / 365);
  const d = abs % 365;
  return d ? `${y} 年 ${d} 天` : `${y} 年`;
}

function fmtBytes(n) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setAlert(type, html) {
  const box = $('#alertBox');
  box.className = `alert ${type}`;
  box.innerHTML = html;
  show(box);
}
function clearAlert() { hide($('#alertBox')); }

/* -------------------- 主题 -------------------- */

function initTheme() {
  const saved = localStorage.getItem('dl-theme');
  const theme = saved || 'dark';
  document.documentElement.dataset.theme = theme;
  $('#themeToggle').textContent = theme === 'dark' ? '🌙' : '☀️';
}

$('#themeToggle').addEventListener('click', () => {
  const now = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = now;
  localStorage.setItem('dl-theme', now);
  $('#themeToggle').textContent = now === 'dark' ? '🌙' : '☀️';
});

/* -------------------- 元信息 -------------------- */

async function loadMeta() {
  try {
    const res = await fetch('/api/meta');
    const m = await res.json();
    state.meta = m;
    $('#metaPill').textContent = `Node ${m.node} · WHOIS ${m.whoisTldCount} 个后缀 · RDAP ${m.rdapTldCount} 个后缀`;
    $('#metaPill').title =
      `运行平台:${m.platform}\n` +
      `DNS 服务器:${(m.dnsServers || []).join(', ')}\n` +
      `WHOIS 已知 TLD:${m.whoisTldCount}\n` +
      `RDAP bootstrap TLD:${m.rdapTldCount}\n` +
      `支持记录类型:${m.dnsTypes.join(', ')}`;
    $('#footMeta').textContent = `v${m.version} · ${m.platform} · DNS: ${(m.dnsServers || []).slice(0, 2).join(', ') || 'system'}`;
  } catch {
    $('#metaPill').textContent = '离线';
  }
}

/* -------------------- 标签页 -------------------- */

$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
  document.querySelectorAll('.tab-panel').forEach((p) =>
    p.classList.toggle('active', p.id === `panel-${btn.dataset.tab}`));
});

/* -------------------- 主查询 -------------------- */

const LOADING_STEPS = [
  '正在解析域名…',
  '正在连接注册局 WHOIS 服务器…',
  '正在跟随转介到注册商…',
  '正在查询 RDAP 结构化数据…',
  '正在解析 DNS 记录…',
  '正在汇总结果…',
];

let loadingTimer = null;

function startLoading(text) {
  $('#loadingTitle').textContent = text || '正在查询…';
  let i = 0;
  $('#loadingSub').textContent = LOADING_STEPS[0];
  show($('#loading'));
  clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_STEPS.length;
    $('#loadingSub').textContent = LOADING_STEPS[i];
  }, 1100);
}

function stopLoading() {
  clearInterval(loadingTimer);
  hide($('#loading'));
}

async function doSearch(domain) {
  const q = String(domain || '').trim();
  if (!q) { setAlert('warn', '请输入要查询的域名'); return; }

  $('#domainInput').value = q;
  $('#domainInput').dispatchEvent(new Event('input'));
  clearAlert();
  hide($('#resultArea'));
  startLoading();
  $('#searchBtn').disabled = true;

  const params = new URLSearchParams({ domain: q });
  if (!$('#optRdap').checked) params.set('rdap', '0');
  if (!$('#optDns').checked) params.set('dns', '0');

  try {
    const res = await fetch(`/api/full?${params}`);
    const data = await res.json();
    if (!data.ok) {
      setAlert('error', `<strong>查询失败</strong><br>${esc(data.error)}`);
      return;
    }
    state.current = data;
    renderAll(data);
    show($('#resultArea'));
    switchTab('overview');
    // 把结果写进地址栏,方便复制分享
    try { history.replaceState(null, '', `?domain=${encodeURIComponent(q)}`); } catch { /* ignore */ }
  } catch (err) {
    setAlert('error', `<strong>请求出错</strong><br>${esc(err.message)}`);
  } finally {
    stopLoading();
    $('#searchBtn').disabled = false;
  }
}

function switchTab(name) {
  const btn = document.querySelector(`.tab[data-tab="${name}"]`);
  if (btn) btn.click();
}

$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  doSearch($('#domainInput').value);
});

document.querySelectorAll('.chip[data-sample]').forEach((c) => {
  c.addEventListener('click', () => doSearch(c.dataset.sample));
});

$('#domainInput').addEventListener('input', (e) => {
  $('.input-wrap').classList.toggle('has-value', !!e.target.value);
});
$('#clearBtn').addEventListener('click', () => {
  $('#domainInput').value = '';
  $('.input-wrap').classList.remove('has-value');
  $('#domainInput').focus();
  clearAlert();
  hide($('#resultArea'));
});

/* -------------------- 渲染总入口 -------------------- */

function renderAll(data) {
  renderOverview(data);
  renderDns(data);
  renderWhois(data);
  renderRdap(data);
  renderRaw(data);
}

/* -------------------- 概览 -------------------- */

function availabilityBadge(s) {
  if (s.registered === true) return '<span class="badge ok">已注册</span>';
  if (s.registered === false) return '<span class="badge warn">未注册</span>';
  return '<span class="badge muted">状态未知</span>';
}

function renderOverview(data) {
  const s = data.summary;
  const w = data.whois;
  const box = $('#panel-overview');
  const parts = [];

  // ---- 头部 ----
  const unicodeDiff = s.unicode && s.unicode !== s.domain
    ? `<div class="domain-sub">中文/国际化域名:${esc(s.unicode)}</div>` : '';
  const subPart = s.sub ? `<div class="domain-sub">子域:${esc(s.sub)} · 可注册主体:${esc(s.registrable)}</div>` : '';

  parts.push(`
    <div class="result-head" style="padding:0 0 18px;border-bottom:1px solid var(--border);margin-bottom:20px">
      <div style="flex:1;min-width:220px">
        <div class="domain-name">${esc(s.domain)}</div>
        ${unicodeDiff}${subPart}
        <div class="domain-sub">.${esc(s.tld)}${s.tldUnicode ? ` (${esc(s.tldUnicode)})` : ''} · 查询耗时 ${data.elapsedMs} ms · 数据源:${esc((s.sources || []).join(' + ') || '无')}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${availabilityBadge(s)}
        ${s.dnssec === 'signed' ? '<span class="badge info">DNSSEC 已签名</span>' : ''}
        ${s.registrantRedacted ? '<span class="badge muted">注册人信息已脱敏</span>' : ''}
      </div>
    </div>`);

  // ---- 生命周期 ----
  const c = s.created ? new Date(s.created).getTime() : null;
  const e = s.expires ? new Date(s.expires).getTime() : null;
  if (c && e && e > c) {
    const now = Date.now();
    const pct = Math.max(0, Math.min(100, ((now - c) / (e - c)) * 100));
    const cls = s.daysLeft !== null && s.daysLeft < 0 ? 'expired' : (s.daysLeft !== null && s.daysLeft < 45 ? 'urgent' : '');
    parts.push(`
      <div class="section-title">生命周期</div>
      <div class="card wide">
        <div class="timeline">
          <div class="tl-dates">
            <div><span>注册时间</span><b>${esc(fmtDate(s.created))}</b></div>
            <div class="tl-end"><span>到期时间</span><b>${esc(fmtDate(s.expires))}</b></div>
          </div>
          <div class="tl-track"><div class="tl-fill ${cls}" style="width:${pct.toFixed(2)}%"></div></div>
          <div class="tl-legend">
            <span>已注册 <b>${esc(fmtDays(s.ageDays))}</b></span>
            <span>剩余 <b style="color:${s.daysLeft !== null && s.daysLeft < 45 ? 'var(--warn)' : 'var(--ok)'}">${esc(fmtDays(s.daysLeft))}</b></span>
            <span>周期 <b>${esc(fmtDays(Math.round((e - c) / 86400000)))}</b></span>
            ${s.updated ? `<span>最后更新 <b>${esc(fmtDate(s.updated))}</b></span>` : ''}
          </div>
        </div>
      </div>`);
  }

  // ---- 关键信息卡片 ----
  const cards = [];
  const addCard = (label, value, note, mono) => {
    if (!value) return;
    cards.push(`<div class="card">
      <div class="card-label">${esc(label)}</div>
      <div class="card-value ${mono ? 'mono' : ''}">${esc(value)}</div>
      ${note ? `<div class="card-note">${esc(note)}</div>` : ''}
    </div>`);
  };

  addCard('注册商', s.registrar.name, s.registrar.ianaId ? `IANA ID: ${s.registrar.ianaId}` : '');
  addCard('注册时间', fmtDate(s.created));
  addCard('到期时间', fmtDate(s.expires), s.daysLeft !== null ? `剩余 ${fmtDays(s.daysLeft)}` : '');
  addCard('最后更新', fmtDate(s.updated));
  addCard('域名后缀', `.${s.tld}`, s.tldUnicode ? `中文形式:.${s.tldUnicode} · 可注册主体:${s.registrable}` : `可注册主体:${s.registrable}`);
  addCard('DNSSEC', s.dnssec === 'signed' ? '已签名' : (s.dnssec === 'unsigned' ? '未签名' : ''), '');
  addCard('注册局域名 ID', s.registryDomainId, '', true);
  addCard('注册商 WHOIS', s.registrar.whoisServer, '', true);
  addCard('滥用举报邮箱', s.registrar.abuseEmail, '发现垃圾邮件/滥用可向此邮箱举报', true);
  addCard('注册商网址', s.registrar.url, '', true);

  if (cards.length) {
    parts.push(`<div class="section-title">关键信息</div><div class="grid">${cards.join('')}</div>`);
  }

  // ---- 注册人 ----
  const r = s.registrant || {};
  const hasRegistrant = r.name || r.email || r.country || r.org;
  if (hasRegistrant) {
    const rows = [];
    if (r.name) rows.push(['注册人', r.name]);
    if (r.org) rows.push(['组织', r.org]);
    if (r.email) rows.push(['邮箱', r.email]);
    if (r.country) rows.push(['国家/地区', r.country]);
    parts.push(`
      <div class="section-title">注册人信息</div>
      <div class="kv">${rows.map(([k, v]) =>
        `<div class="kv-row"><div class="kv-key">${esc(k)}</div><div class="kv-val">${esc(v)}</div></div>`).join('')}</div>`);
  } else if (s.registrantRedacted) {
    parts.push(`
      <div class="section-title">注册人信息</div>
      <div class="card wide"><div class="card-value dim">注册人信息已被注册局或隐私保护服务脱敏(符合 GDPR/ICANN 临时政策),WHOIS 与 RDAP 均不公开。</div></div>`);
  }

  // ---- 域名状态 ----
  if (s.statuses && s.statuses.length) {
    parts.push(`
      <div class="section-title">域名状态 (EPP Status)</div>
      <div class="status-list">${s.statuses.map((st) => `
        <div class="status-item ${esc(st.type || 'info')}">
          <div style="flex:1">
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:baseline">
              <span class="status-code">${esc(st.code)}</span>
              ${st.zh && st.zh !== st.code ? `<span class="status-zh">${esc(st.zh)}</span>` : ''}
            </div>
            ${st.desc ? `<div class="status-desc">${esc(st.desc)}</div>` : ''}
          </div>
        </div>`).join('')}</div>`);
  }

  // ---- 域名服务器 ----
  if (s.nameServers && s.nameServers.length) {
    parts.push(`
      <div class="section-title">域名服务器 (NS) · ${s.nameServers.length} 条</div>
      <div class="ns-list">${s.nameServers.map((ns, i) =>
        `<div class="ns-item"><span class="ns-index">${i + 1}</span><span>${esc(ns)}</span></div>`).join('')}</div>`);
  }

  // ---- 警告信息 ----
  const alerts = [];
  if (w && !w.ok) alerts.push(['warn', `WHOIS 查询失败:${esc(w.error)}`]);
  if (!s.created && !s.expires && s.registered !== false) {
    alerts.push(['info', '注册局未返回注册/到期时间,可能该后缀的 WHOIS 不公开这些字段,或需要查看 RDAP 数据。']);
  }
  if (s.daysLeft !== null && s.daysLeft < 0) {
    alerts.push(['error', `该域名已过期 ${fmtDays(s.daysLeft)},正处于赎回期或待删除状态。`]);
  } else if (s.daysLeft !== null && s.daysLeft < 30) {
    alerts.push(['warn', `该域名将在 ${s.daysLeft} 天后到期,请留意续费。`]);
  }
  if (data.dns && data.dns.ok === false) alerts.push(['info', `DNS 查询失败:${esc(data.dns.error)}`]);
  if (data.rdap && data.rdap.ok === false) alerts.push(['info', `RDAP 不可用:${esc(data.rdap.error)}(不影响 WHOIS 结果)`]);

  if (alerts.length) {
    parts.push('<div class="section-title">提示</div>');
    parts.push(alerts.map(([t, m]) => `<div class="alert ${t}" style="margin-bottom:8px">${m}</div>`).join(''));
  }

  box.innerHTML = parts.join('');
}

/* -------------------- DNS -------------------- */

const DNS_DESC = {
  A: 'IPv4 地址', AAAA: 'IPv6 地址', CNAME: '别名', MX: '邮件交换', NS: '权威域名服务器',
  TXT: '文本记录', SOA: '起始授权机构', CAA: '证书颁发机构授权', SRV: '服务记录', PTR: '反向解析',
};

function renderDns(data) {
  const box = $('#panel-dns');
  const d = data.dns;
  if (!d) { box.innerHTML = '<div class="dns-empty"><span class="big">⏭</span>本次查询未启用 DNS 查询(可在上方勾选)</div>'; return; }
  if (d.ok === false) {
    box.innerHTML = `<div class="alert error">DNS 查询失败:${esc(d.error)}</div>`;
    return;
  }

  const keys = Object.keys(d.records || {});
  const parts = [];

  parts.push(`<div class="section-title">DNS 记录 · ${keys.length} 种类型 · 耗时 ${d.elapsedMs} ms</div>`);

  if (!keys.length) {
    parts.push(`<div class="dns-empty">
      <span class="big">🔍</span>
      <div><strong>未查询到任何 DNS 记录</strong></div>
      <div style="margin-top:8px;font-size:12.5px">${d.nxdomain ? '该域名返回 NXDOMAIN,通常表示域名未注册或尚未配置解析。' : '域名可能已注册但未配置解析记录。'}</div>
    </div>`);
  } else {
    for (const type of keys) {
      const recs = d.records[type];
      parts.push(`<div class="dns-group">
        <div class="dns-head">
          <span class="dns-type">${esc(type)}</span>
          <span class="dns-count">${esc(DNS_DESC[type] || '')} · ${recs.length} 条</span>
        </div>
        <div class="dns-records">${recs.map((r) => {
          if (type === 'MX') return `<div class="dns-record"><span class="dns-prio">优先级 ${esc(r.priority)}</span><span>${r.exchange ? esc(r.exchange) : '<span style="color:var(--text-faint)">(Null MX — 该域名声明不接收邮件)</span>'}</span></div>`;
          if (type === 'SRV') return `<div class="dns-record"><span class="dns-prio">优先级 ${esc(r.priority)}</span><span>${esc(r.name)}:${esc(r.port)} (权重 ${esc(r.weight)})</span></div>`;
          if (type === 'SOA') return `<div class="dns-record"><span>主 NS: ${esc(r.nsname)} · 管理员: ${esc(r.hostmaster)} · 序列号: ${esc(r.serial)} · 刷新 ${esc(r.refresh)}s · 重试 ${esc(r.retry)}s · 过期 ${esc(r.expire)}s · 最小 TTL ${esc(r.minttl)}s</span></div>`;
          if (type === 'CAA') return `<div class="dns-record"><span>${esc(r)}</span></div>`;
          return `<div class="dns-record"><span>${esc(r)}</span></div>`;
        }).join('')}</div>
      </div>`);
    }
  }

  // CNAME 解析链
  if (d.chain && d.chain.chain && d.chain.chain.length) {
    parts.push('<div class="section-title">解析链路</div><div class="chain">');
    d.chain.chain.forEach((hop, i) => {
      if (i > 0) parts.push('<div class="chain-arrow">↓</div>');
      const bits = [];
      if (hop.a) bits.push(`A: ${hop.a.join(', ')}`);
      if (hop.aaaa) bits.push(`AAAA: ${hop.aaaa.join(', ')}`);
      if (hop.note) bits.push(`<span style="color:var(--text-faint)">${esc(hop.note)}</span>`);
      parts.push(`<div class="chain-hop"><strong>${esc(hop.name)}</strong>${hop.cname ? ` <span style="color:var(--accent-text)">CNAME → ${esc(hop.cname)}</span>` : ''}${bits.length ? `<br><span style="color:var(--text-dim)">${bits.join(' &nbsp;|&nbsp; ')}</span>` : ''}</div>`);
    });
    parts.push('</div>');
  }

  // 失败明细
  const failed = (d.details || []).filter((x) => !x.ok && !x.notFound);
  if (failed.length) {
    parts.push(`<div class="section-title">查询异常的类型</div><div class="kv">${failed.map((f) =>
      `<div class="kv-row"><div class="kv-key mono">${esc(f.type)}</div><div class="kv-val">${esc(f.error)}</div></div>`).join('')}</div>`);
  }

  box.innerHTML = parts.join('');
}

/* -------------------- WHOIS 原文 -------------------- */

function renderWhois(data) {
  const box = $('#panel-whois');
  const w = data.whois;
  if (!w || !w.ok) {
    box.innerHTML = `<div class="alert error"><strong>WHOIS 查询失败</strong><br>${esc(w ? w.error : '无数据')}</div>`;
    return;
  }

  const stepsHtml = (w.steps || []).map((s) => `
    <div class="step-item">
      <span class="step-dot ${s.ok ? '' : 'fail'}"></span>
      <span>
        <span class="step-role">${esc(s.role || '')}</span>
        <span class="step-server">${esc(s.server)}</span>
        ${s.ok ? `<span style="color:var(--text-faint)"> · ${fmtBytes(s.bytes)}</span>` : `<span style="color:var(--err)"> · ${esc(s.error || '失败')}</span>`}
      </span>
    </div>`).join('');

  box.innerHTML = `
    <div class="section-title">查询链路</div>
    <div class="source-row">${stepsHtml || '<span style="color:var(--text-faint)">无</span>'}</div>
    <div class="section-title">WHOIS 原始响应 <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-faint)">${fmtBytes((w.text || '').length)}</span></div>
    <div class="code-toolbar">
      <span class="code-meta">${esc((w.servers || []).join(' → '))}</span>
      <button class="ghost-btn" data-copy-text="whois">复制全文</button>
    </div>
    <pre class="code-block" id="whoisRaw">${esc(w.text || '(空响应)')}</pre>`;
}

/* -------------------- RDAP -------------------- */

function renderRdap(data) {
  const box = $('#panel-rdap');
  const r = data.rdap;
  if (!r) {
    box.innerHTML = '<div class="dns-empty"><span class="big">⏭</span>本次查询未启用 RDAP(可在上方勾选)</div>';
    return;
  }
  if (!r.ok) {
    box.innerHTML = `<div class="alert warn"><strong>RDAP 不可用</strong><br>${esc(r.error)}
      <div style="margin-top:8px;font-size:12.5px">RDAP 是 WHOIS 的现代替代协议,并非所有顶级域都支持。这不影响 WHOIS 查询结果。</div>
    </div>`;
    return;
  }

  if (r.found === false) {
    box.innerHTML = `<div class="alert info"><strong>注册局 RDAP 返回 404</strong><br>该域名在注册局数据库中不存在,通常表示可以注册。</div>`;
    return;
  }

  const p = r.parsed || {};
  const rows = [
    ['RDAP 服务地址', r.server, true],
    ['地址来源', r.serverSource === 'iana-bootstrap' ? 'IANA 官方 bootstrap' : '内置映射'],
    ['查询 URL', r.url, true],
    ['Handle', p.handle, true],
    ['注册时间', fmtDate(p.created)],
    ['更新时间', fmtDate(p.updated)],
    ['到期时间', fmtDate(p.expires)],
    ['DNSSEC', p.dnssec === 'signed' ? '已签名' : (p.dnssec === 'unsigned' ? '未签名' : '—')],
    ['状态码', (p.statuses || []).join(', ')],
    ['域名服务器', (p.nameServers || []).join(', '), true],
    ['注册商', p.registrar && p.registrar.name],
    ['注册商 IANA ID', p.registrar && p.registrar.ianaId],
    ['注册商邮箱', p.registrar && p.registrar.abuseEmail],
    ['注册人', p.registrant && p.registrant.name],
    ['注册人邮箱', p.registrant && p.registrant.email],
    ['注册人国家', p.registrant && p.registrant.country],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  box.innerHTML = `
    <div class="section-title">RDAP 结构化信息</div>
    <div class="kv">${rows.map(([k, v, mono]) =>
      `<div class="kv-row"><div class="kv-key">${esc(k)}</div><div class="kv-val ${mono ? 'mono' : ''}">${esc(v)}</div></div>`).join('')}</div>
    <div class="section-title">RDAP 原始 JSON</div>
    <div class="code-toolbar">
      <span class="code-meta">${fmtBytes(JSON.stringify(r.json || {}).length)}</span>
      <button class="ghost-btn" data-copy-text="rdap">复制 JSON</button>
    </div>
    <pre class="code-block" id="rdapRaw">${esc(JSON.stringify(r.json, null, 2))}</pre>`;
}

/* -------------------- 诊断信息 -------------------- */

function renderRaw(data) {
  box_set('#panel-raw', `
    <div class="section-title">查询诊断</div>
    <div class="kv">
      <div class="kv-row"><div class="kv-key">原始输入</div><div class="kv-val mono">${esc(data.query.input)}</div></div>
      <div class="kv-row"><div class="kv-key">规范化域名</div><div class="kv-val mono">${esc(data.query.ascii)}</div></div>
      <div class="kv-row"><div class="kv-key">Unicode 形式</div><div class="kv-val mono">${esc(data.query.unicode)}</div></div>
      <div class="kv-row"><div class="kv-key">顶级域 TLD</div><div class="kv-val mono">.${esc(data.query.tld)}</div></div>
      <div class="kv-row"><div class="kv-key">可注册主体</div><div class="kv-val mono">${esc(data.query.registrable)}</div></div>
      <div class="kv-row"><div class="kv-key">子域</div><div class="kv-val mono">${esc(data.query.sub || '(无)')}</div></div>
      <div class="kv-row"><div class="kv-key">总耗时</div><div class="kv-val">${esc(data.elapsedMs)} ms</div></div>
    </div>
    <div class="section-title">完整 JSON 响应</div>
    <div class="code-toolbar">
      <span class="code-meta">${fmtBytes(JSON.stringify(data).length)}</span>
      <button class="ghost-btn" data-copy-text="full">复制 JSON</button>
    </div>
    <pre class="code-block">${esc(JSON.stringify(data, null, 2))}</pre>`);
}

function box_set(sel, html) { $(sel).innerHTML = html; }

/* -------------------- 复制 / 导出 -------------------- */

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy-text]');
  if (!btn || !state.current) return;
  const kind = btn.dataset.copyText;
  let text = '';
  if (kind === 'whois') text = (state.current.whois && state.current.whois.text) || '';
  if (kind === 'rdap') text = JSON.stringify(state.current.rdap && state.current.rdap.json, null, 2);
  if (kind === 'full') text = JSON.stringify(state.current, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => { btn.textContent = old; }, 1400);
  } catch { setAlert('warn', '浏览器拒绝了剪贴板访问,请手动选择文本复制'); }
});

function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('#copyBtn').addEventListener('click', async () => {
  if (!state.current) return;
  const s = state.current.summary;
  const lines = [
    `域名: ${s.domain}`,
    `状态: ${s.registered === true ? '已注册' : s.registered === false ? '未注册' : '未知'}`,
    `注册商: ${s.registrar.name || '—'}`,
    `注册时间: ${fmtDate(s.created)}`,
    `到期时间: ${fmtDate(s.expires)}`,
    `剩余: ${fmtDays(s.daysLeft)}`,
    `域名服务器: ${(s.nameServers || []).join(', ') || '—'}`,
    `状态码: ${(s.statuses || []).map((x) => x.code).join(', ') || '—'}`,
  ];
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    $('#copyBtn').textContent = '✓ 已复制';
    setTimeout(() => { $('#copyBtn').textContent = '复制'; }, 1400);
  } catch { setAlert('warn', '剪贴板不可用'); }
});

$('#exportJson').addEventListener('click', () => {
  if (!state.current) return;
  download(`${state.current.summary.domain}.json`, JSON.stringify(state.current, null, 2), 'application/json');
});

$('#exportTxt').addEventListener('click', () => {
  if (!state.current) return;
  const d = state.current;
  const out = [
    `域名查询报告`,
    `生成时间: ${new Date().toLocaleString('zh-CN')}`,
    `${'='.repeat(60)}`,
    ``,
    `【基本信息】`,
    `域名        : ${d.summary.domain}`,
    `Unicode     : ${d.summary.unicode}`,
    `顶级域      : .${d.summary.tld}`,
    `状态        : ${d.summary.registered === true ? '已注册' : d.summary.registered === false ? '未注册' : '未知'}`,
    ``,
    `【注册信息】`,
    `注册商      : ${d.summary.registrar.name || '—'}`,
    `注册时间    : ${fmtDate(d.summary.created)}`,
    `到期时间    : ${fmtDate(d.summary.expires)}`,
    `最后更新    : ${fmtDate(d.summary.updated)}`,
    `剩余时间    : ${fmtDays(d.summary.daysLeft)}`,
    `DNSSEC      : ${d.summary.dnssec || '—'}`,
    ``,
    `【域名服务器】`,
    ...(d.summary.nameServers || []).map((n, i) => `  ${i + 1}. ${n}`),
    ``,
    `【域名状态】`,
    ...(d.summary.statuses || []).map((s) => `  ${s.code}  ${s.zh || ''}  ${s.desc || ''}`),
    ``,
    `【DNS 记录】`,
    ...Object.entries((d.dns && d.dns.records) || {}).flatMap(([t, recs]) =>
      [`  ${t}:`, ...recs.map((r) => `    ${typeof r === 'object' ? JSON.stringify(r) : r}`)]),
    ``,
    `${'='.repeat(60)}`,
    `WHOIS 原始响应 (${(d.whois && d.whois.servers || []).join(' -> ')})`,
    `${'='.repeat(60)}`,
    (d.whois && d.whois.text) || '(无)',
  ].join('\n');
  download(`${d.summary.domain}.txt`, out);
});

$('#exportCsv').addEventListener('click', () => {
  const rows = state.bulkRows.length ? state.bulkRows : (state.current ? [state.current] : []);
  if (!rows.length) { setAlert('warn', '没有可导出的数据'); return; }
  const header = ['域名', '状态', '注册商', '注册时间', '到期时间', '剩余天数', 'DNSSEC', '域名服务器', '状态码'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((r) => {
    const s = r.summary || r;
    return [
      s.domain, s.registered === true ? '已注册' : s.registered === false ? '未注册' : (r.available === true ? '可注册' : r.available === false ? '已注册' : '未知'),
      (s.registrar && s.registrar.name) || '', s.created || '', s.expires || '', s.daysLeft ?? '',
      s.dnssec || '', (s.nameServers || []).join(' '), (s.statuses || []).map((x) => x.code || x).join(' '),
    ].map(q).join(',');
  });
  download(`domain-report-${Date.now()}.csv`, '\uFEFF' + [header.map(q).join(','), ...body].join('\r\n'), 'text/csv;charset=utf-8');
});

/* -------------------- 批量查询 (SSE) -------------------- */

let bulkSource = null;

$('#bulkSample').addEventListener('click', () => {
  $('#bulkInput').value = ['example.com', 'github.com', 'mybrand-test-2026.com', 'cloudflare.net', 'baidu.com'].join('\n');
});

$('#bulkBtn').addEventListener('click', () => {
  const raw = $('#bulkInput').value.trim();
  if (!raw) { setAlert('warn', '请先在批量输入框中填写域名'); return; }

  if (bulkSource) { bulkSource.close(); bulkSource = null; }

  const domains = raw.split(/[\s,;]+/).filter(Boolean).slice(0, 200);
  const container = $('#bulkResults');
  state.bulkRows = [];
  container.innerHTML = '';
  show($('#bulkProgress'));
  $('#bulkFill').style.width = '0%';
  $('#bulkProgressText').textContent = `0 / ${domains.length}`;
  $('#bulkBtn').disabled = true;

  const params = new URLSearchParams({ domains: domains.join(','), c: $('#bulkConcurrency').value });
  const es = new EventSource(`/api/bulk?${params}`);
  bulkSource = es;

  const tbody = document.createElement('tbody');
  const table = document.createElement('table');
  table.className = 'bulk-table';
  table.innerHTML = `<thead><tr>
    <th>#</th><th>域名</th><th>可用性</th><th>置信度</th><th>注册商</th>
    <th>到期时间</th><th>剩余</th><th>DNS</th><th>依据</th>
  </tr></thead>`;

  es.addEventListener('start', (ev) => {
    const d = JSON.parse(ev.data);
    container.innerHTML = '';
    container.appendChild(table);
    table.appendChild(tbody);
    show($('#bulkProgress'));
    $('#bulkProgressText').textContent = `0 / ${d.total}`;
  });

  es.addEventListener('result', (ev) => {
    const d = JSON.parse(ev.data);
    state.bulkRows.push(d);
    tbody.appendChild(buildBulkRow(d));
    const pct = (d.done / domains.length) * 100;
    $('#bulkFill').style.width = `${pct}%`;
    $('#bulkProgressText').textContent = `${d.done} / ${domains.length}`;
  });

  es.addEventListener('done', () => {
    es.close(); bulkSource = null;
    $('#bulkBtn').disabled = false;
    $('#bulkFill').style.width = '100%';
    const avail = state.bulkRows.filter((r) => r.available === true).length;
    const taken = state.bulkRows.filter((r) => r.available === false).length;
    setAlert('ok', `批量检测完成:共 ${domains.length} 个域名,<strong>${avail} 个可注册</strong>,${taken} 个已被占用。可用 CSV 按钮导出结果。`);
  });

  es.onerror = () => {
    es.close(); bulkSource = null;
    $('#bulkBtn').disabled = false;
    if (state.bulkRows.length) setAlert('warn', '连接中断,已显示部分结果。');
    else setAlert('error', '批量查询连接失败。');
  };
});

function buildBulkRow(d) {
  const tr = document.createElement('tr');
  const s = d.summary || d;

  let availHtml;
  if (!d.ok) availHtml = '<span class="badge err">错误</span>';
  else if (d.available === true) availHtml = '<span class="badge ok">可注册</span>';
  else if (d.available === false) availHtml = '<span class="badge muted">已注册</span>';
  else availHtml = '<span class="badge warn">未知</span>';

  const conf = { high: '高', medium: '中', unknown: '—' }[d.confidence] || '—';
  const evidence = (d.evidence || []).map((e) => `${e.source}:${e.verdict}`).join(' · ');

  tr.innerHTML = `
    <td style="color:var(--text-faint)">${esc(d.index + 1)}</td>
    <td class="col-domain">${esc(d.ascii || d.input || d.domain)}</td>
    <td>${availHtml}</td>
    <td style="color:var(--text-dim)">${esc(conf)}</td>
    <td>${esc((s.registrar && s.registrar.name) || '—')}</td>
    <td class="mono">${esc(s.expires ? fmtDate(s.expires) : '—')}</td>
    <td class="mono">${esc(s.daysLeft !== null && s.daysLeft !== undefined ? fmtDays(s.daysLeft) : '—')}</td>
    <td>${d.dns && d.dns.hasAnyRecord ? '<span style="color:var(--ok)">有解析</span>' : '<span style="color:var(--text-faint)">无</span>'}</td>
    <td style="color:var(--text-faint);font-size:12px">${esc(d.error || evidence)}</td>`;
  return tr;
}

/* -------------------- 启动 -------------------- */

initTheme();
loadMeta();

// 支持 ?domain=example.com 直接查询(便于分享链接与自动化测试)
const bootParams = new URLSearchParams(location.search);
const bootDomain = bootParams.get('domain') || bootParams.get('q');

if (bootDomain) {
  $('#domainInput').value = bootDomain;
  $('.input-wrap').classList.add('has-value');
  doSearch(bootDomain);
} else {
  setAlert('info', '输入域名后按回车即可查询。查询直接经过 WHOIS 协议与 RDAP,不依赖任何第三方网页接口。');
  $('#domainInput').focus();
}
