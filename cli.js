#!/usr/bin/env node
'use strict';

/**
 * 域名查询工具 —— 命令行版
 *
 *   node cli.js example.com                 查 WHOIS + DNS 概览
 *   node cli.js example.com --json          输出 JSON
 *   node cli.js example.com --raw           只输出 WHOIS 原文
 *   node cli.js example.com --dns           只查 DNS
 *   node cli.js example.com --dns --type=MX
 *   node cli.js a.com b.net --check         批量可用性检测
 *   node cli.js --bulk domains.txt          从文件读域名批量检测
 *   node cli.js --tlds co                   搜索支持的 TLD
 */

const fs = require('fs');
const { normalizeDomain, splitInputList } = require('./lib/domain');
const { whoisLookup } = require('./lib/whois');
const { parseWhois } = require('./lib/parse');
const { rdapLookup } = require('./lib/rdap');
const { dnsLookup, resolveChain, TYPES } = require('./lib/dns');
const { checkAvailability, bulkAvailability } = require('./lib/availability');
const { mergeInfo } = require('./lib/merge');
const { TLDS } = require('./lib/tld-servers');

/* -------------------- 颜色 -------------------- */
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c('1');
const dim = c('2');
const red = c('31');
const green = c('32');
const yellow = c('33');
const blue = c('36');
const magenta = c('35');

/* -------------------- 参数解析 -------------------- */
function parseArgs(argv) {
  const opts = { domains: [], check: false, json: false, raw: false, dnsOnly: false, types: null, servers: null, chain: false, bulkFile: null, tlds: null, concurrency: 4, noRdap: false, noDns: false, quiet: false };
  for (const a of argv) {
    if (a === '--json' || a === '-j') opts.json = true;
    else if (a === '--raw' || a === '-r') opts.raw = true;
    else if (a === '--dns' || a === '-d') opts.dnsOnly = true;
    else if (a === '--chain') opts.chain = true;
    else if (a === '--check' || a === '-c') opts.check = true;
    else if (a === '--no-rdap') opts.noRdap = true;
    else if (a === '--no-dns') opts.noDns = true;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--type=')) opts.types = a.slice(7).toUpperCase().split(',').map((x) => x.trim()).filter(Boolean);
    else if (a.startsWith('--server=')) opts.servers = a.slice(9).split(',').map((x) => x.trim()).filter(Boolean);
    else if (a.startsWith('--concurrency=')) opts.concurrency = Math.max(1, Math.min(8, +a.slice(14) || 4));
    else if (a.startsWith('--bulk=')) opts.bulkFile = a.slice(7);
    else if (a.startsWith('--bulk')) opts.bulkFile = argv[argv.indexOf(a) + 1] || null;
    else if (a.startsWith('--tlds=')) opts.tlds = a.slice(7);
    else if (a === '--tlds') opts.tlds = argv[argv.indexOf(a) + 1] || '';
    else if (!a.startsWith('-')) opts.domains.push(a);
  }
  return opts;
}

const HELP = `
${bold('域名查询工具')} ${dim('— WHOIS / RDAP / DNS / 可用性检测')}

${bold('用法')}
  node cli.js <域名...> [选项]

${bold('示例')}
  node cli.js example.com                 查询 WHOIS + DNS 概览
  node cli.js example.com --raw           只看 WHOIS 原始响应
  node cli.js example.com --dns           只看 DNS 记录
  node cli.js example.com --dns --type=MX,TXT --server=8.8.8.8
  node cli.js example.com --json          输出机器可读 JSON
  node cli.js a.com b.net c.org --check   批量可用性检测
  node cli.js --bulk domains.txt --check  从文件读取域名批量检测
  node cli.js --tlds co                   搜索内置支持的 TLD

${bold('选项')}
  -j, --json              输出 JSON(便于脚本处理)
  -r, --raw               仅输出 WHOIS 原始文本
  -d, --dns               仅查询 DNS
  -c, --check             可用性检测模式
      --chain             额外输出 CNAME 解析链
      --type=A,MX         指定 DNS 记录类型
      --server=8.8.8.8    指定 DNS 服务器
      --no-rdap           跳过 RDAP
      --no-dns            跳过 DNS
      --bulk <文件>       从文件读取域名列表
      --concurrency=N     批量并发数(默认 4)
      --tlds <关键词>     搜索支持的 TLD
  -h, --help              显示帮助
`;

/* -------------------- 输出工具 -------------------- */
const W = 76;
const line = (ch = '─') => dim(ch.repeat(W));
const pad = (s, n) => {
  // 中文字符占两格
  let w = 0;
  for (const ch of String(s)) w += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1;
  return String(s) + ' '.repeat(Math.max(0, n - w));
};

function kv(key, value, indent = 2) {
  if (value === null || value === undefined || value === '') return;
  console.log(`${' '.repeat(indent)}${dim(pad(key, 14))}${value}`);
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDays(n) {
  if (n === null || n === undefined) return null;
  const a = Math.abs(n);
  if (a < 1) return '不到 1 天';
  if (a < 365) return `${a} 天`;
  const y = Math.floor(a / 365); const d = a % 365;
  return d ? `${y} 年 ${d} 天` : `${y} 年`;
}

const STATUS_COLOR = { ok: green, warn: yellow, err: red, info: blue };

/* -------------------- 单域名查询 -------------------- */
async function queryDomain(rawInput, opts) {
  const norm = normalizeDomain(rawInput);
  console.log('');
  console.log(bold(`◆ ${rawInput}`));
  if (!norm.ok) { console.log(`  ${red('✗')} ${norm.error}`); return { input: rawInput, ok: false, error: norm.error }; }

  if (norm.unicode !== norm.ascii) console.log(`  ${dim(`punycode: ${norm.ascii}`)}`);

  // ---- 仅 DNS ----
  if (opts.dnsOnly) {
    const types = opts.types || TYPES;
    const d = await dnsLookup(norm.ascii, { types, servers: opts.servers });
    if (opts.json) return d;
    if (!Object.keys(d.records).length) {
      console.log(`  ${dim('无任何 DNS 记录')}${d.nxdomain ? dim(' (NXDOMAIN)') : ''}`);
    } else {
      for (const [type, recs] of Object.entries(d.records)) {
        console.log(`  ${magenta(type.padEnd(6))} ${dim(`${recs.length} 条`)}`);
        for (const r of recs) {
          const s = typeof r === 'object'
            ? (type === 'MX' ? `${String(r.priority).padStart(3)}  ${r.exchange || dim('(Null MX — 该域名不接收邮件)')}`
              : type === 'SRV' ? `${String(r.priority).padStart(3)}  ${r.name}:${r.port}`
                : type === 'SOA' ? `${r.nsname} (序列号 ${r.serial})`
                  : JSON.stringify(r))
            : r;
          console.log(`         ${s}`);
        }
      }
    }
    if (opts.chain) {
      const ch = await resolveChain(norm.ascii, { servers: opts.servers });
      console.log(`  ${dim('解析链:')}`);
      ch.chain.forEach((h) => console.log(`    ${h.cname ? `${h.name} ${blue('→')} ${h.cname}` : `${h.name} ${dim((h.a || []).join(', ') || h.note || '')}`}`));
    }
    return { input: rawInput, ok: true, norm, dns: d };
  }

  // ---- WHOIS / RDAP / DNS ----
  const t0 = Date.now();
  const [whoisRes, dnsRes, rdapRes] = await Promise.all([
    whoisLookup(norm.ascii, { deep: true }).catch((e) => ({ ok: false, error: e.message, steps: [] })),
    opts.noDns ? null : dnsLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message, records: {} })),
    opts.noRdap ? null : rdapLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message })),
  ]);

  const parsed = whoisRes.ok ? parseWhois(whoisRes.text, norm.ascii) : null;
  const summary = mergeInfo(parsed, rdapRes && rdapRes.ok && rdapRes.found ? rdapRes.parsed : null, norm);

  if (opts.json) {
    return { input: rawInput, ok: true, query: norm, summary, whois: whoisRes, rdap: rdapRes, dns: dnsRes };
  }

  // ---- 原始模式 ----
  if (opts.raw) {
    if (!whoisRes.ok) { console.log(`  ${red('WHOIS 查询失败:')} ${whoisRes.error}`); return { input: rawInput, ok: false, error: whoisRes.error }; }
    console.log(dim(`  ← ${(whoisRes.servers || []).join(' → ')}`));
    console.log(line());
    console.log(whoisRes.text);
    console.log(line());
    return { input: rawInput, ok: true, norm, summary, whois: whoisRes, rdap: rdapRes, dns: dnsRes };
  }

  // ---- 概览 ----
  const badge = summary.registered === true ? green('● 已注册')
    : summary.registered === false ? green('● 未注册(可注册)') : yellow('● 状态未知');
  console.log(`  ${badge}   ${dim(`.${summary.tld}${summary.tldUnicode ? ` (${summary.tldUnicode})` : ''} · ${Date.now() - t0}ms · ${(summary.sources || []).join('+') || '无数据源'}`)}`);
  console.log(line());

  kv('注册商', summary.registrar.name);
  kv('注册时间', fmtDate(summary.created));
  kv('到期时间', summary.expires ? `${fmtDate(summary.expires)}  ${summary.daysLeft !== null ? dim(`(剩余 ${fmtDays(summary.daysLeft)})`) : ''}` : null);
  kv('最后更新', fmtDate(summary.updated));
  kv('域名年龄', fmtDays(summary.ageDays));
  kv('DNSSEC', summary.dnssec === 'signed' ? green('已签名') : (summary.dnssec === 'unsigned' ? '未签名' : null));
  kv('注册局 ID', summary.registryDomainId);

  if (summary.registrar.abuseEmail) kv('滥用举报', summary.registrar.abuseEmail);

  const reg = summary.registrant || {};
  if (reg.name || reg.email) {
    kv('注册人', reg.name);
    if (reg.email) kv('注册人邮箱', reg.email);
    if (reg.country) kv('注册人国家', reg.country);
  } else if (summary.registrantRedacted) {
    kv('注册人', dim('已脱敏(隐私保护/GDPR)'));
  }

  if (summary.statuses.length) {
    console.log('');
    console.log(`  ${dim('域名状态')}`);
    for (const s of summary.statuses) {
      const col = STATUS_COLOR[s.type] || ((x) => x);
      console.log(`    ${col('•')} ${s.code}${s.zh && s.zh !== s.code ? dim(`  ${s.zh}`) : ''}`);
    }
  }

  if (summary.nameServers.length) {
    console.log('');
    console.log(`  ${dim(`域名服务器 (${summary.nameServers.length})`)}`);
    for (const ns of summary.nameServers) console.log(`    ${dim('•')} ${ns}`);
  }

  if (dnsRes && dnsRes.ok && Object.keys(dnsRes.records).length) {
    console.log('');
    console.log(`  ${dim('DNS 记录')}`);
    for (const [type, recs] of Object.entries(dnsRes.records)) {
      const shown = recs.slice(0, 3).map((r) => {
        if (typeof r !== 'object') return r;
        if (type === 'MX') return `${r.priority} ${r.exchange}`;
        if (type === 'SOA') return r.nsname;
        if (type === 'SRV') return `${r.name}:${r.port}`;
        return JSON.stringify(r);
      }).join(', ');
      console.log(`    ${magenta(pad(type, 6))} ${shown}${recs.length > 3 ? dim(` …共 ${recs.length} 条`) : ''}`);
    }
    if (dnsRes.hijackSuspect) {
      console.log(`    ${yellow('⚠')} ${dim(`A 记录指向非公网地址 ${dnsRes.nonPublicIps.join(', ')},疑似 DNS 劫持`)}`);
    }
  } else if (dnsRes && dnsRes.ok === false) {
    console.log(`  ${dim(`DNS 查询失败: ${dnsRes.error}`)}`);
  }

  if (!whoisRes.ok) console.log(`\n  ${yellow('⚠')} ${dim(`WHOIS 失败: ${whoisRes.error}`)}`);
  if (rdapRes && rdapRes.ok === false) console.log(`  ${dim(`RDAP 不可用: ${rdapRes.error}`)}`);

  console.log('');
  return { input: rawInput, ok: true, norm, summary, whois: whoisRes, rdap: rdapRes, dns: dnsRes };
}

/* -------------------- 批量可用性 -------------------- */
async function runBulk(domains, opts) {
  const valid = [];
  for (const d of domains) {
    const n = normalizeDomain(d);
    if (n.ok) valid.push(n);
    else console.log(`${yellow('跳过')} ${d} ${dim(`(${n.error})`)}`);
  }
  if (!valid.length) { console.log(red('没有合法的域名。')); return []; }

  if (!opts.quiet) console.log(dim(`\n正在检测 ${valid.length} 个域名(并发 ${opts.concurrency})…\n`));

  const results = await bulkAvailability(valid.map((v) => v.ascii), {
    concurrency: opts.concurrency,
    useDns: !opts.noDns,
    useRdap: !opts.noRdap,
    onProgress: opts.quiet ? undefined : (done, total, r) => {
      const mark = r.available === true ? green('可注册') : r.available === false ? red('已注册') : yellow('  未知');
      const exp = r.summary && r.summary.expires ? dim(fmtDate(r.summary.expires).slice(0, 10)) : '';
      process.stdout.write(`\r  [${String(done).padStart(3)}/${total}] ${pad(r.domain, 38)} ${mark} ${exp}\n`);
    },
  });

  if (opts.json) return results;

  const free = results.filter((r) => r.available === true);
  const taken = results.filter((r) => r.available === false);
  const unknown = results.filter((r) => r.available === null);

  console.log(`\n${line()}`);
  console.log(bold('  汇总'));
  console.log(`    ${green(`${free.length} 个可注册`)}   ${red(`${taken.length} 个已注册`)}   ${yellow(`${unknown.length} 个未知`)}   ${dim(`共 ${results.length} 个`)}`);

  if (free.length) {
    console.log(`\n  ${bold(green('可注册域名:'))}`);
    for (const r of free) {
      const conf = { high: green('高'), medium: yellow('中'), unknown: dim('低') }[r.confidence] || '';
      console.log(`    ${green('✓')} ${pad(r.domain, 40)} ${dim('置信度')} ${conf}`);
    }
  }
  console.log('');
  return results;
}

/* -------------------- TLD 搜索 -------------------- */
function runTlds(keyword) {
  const q = String(keyword || '').toLowerCase();
  const all = Object.entries(TLDS);
  const hit = all.filter(([t, s]) => !q || t.includes(q) || s.includes(q));
  console.log(`\n${bold(`内置 WHOIS 服务器映射`)} ${dim(`(${all.length} 个顶级域,匹配 "${keyword}" 的有 ${hit.length} 个)`)}\n`);
  for (const [t, s] of hit.slice(0, 200)) console.log(`  ${pad(`.${t}`, 14)} ${dim(s)}`);
  if (!hit.length) console.log(dim('  没有匹配项。未收录的 TLD 会自动通过 IANA 查询转介服务器。'));
  console.log(`\n  ${dim('提示:未收录的 TLD 会先查询 whois.iana.org 自动发现注册局服务器,所以绝大多数后缀都能查。')}\n`);
}

/* -------------------- 主流程 -------------------- */
(async () => {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || (!opts.domains.length && opts.bulkFile === null && opts.tlds === null)) {
    console.log(HELP);
    process.exit(0);
  }

  if (opts.tlds !== null) { runTlds(opts.tlds); return; }

  let domains = opts.domains.slice();

  if (opts.bulkFile) {
    if (!fs.existsSync(opts.bulkFile)) {
      console.error(red(`找不到文件: ${opts.bulkFile}`));
      process.exit(1);
    }
    domains = domains.concat(splitInputList(fs.readFileSync(opts.bulkFile, 'utf8')));
  }

  if (!domains.length) { console.log(HELP); process.exit(0); }

  // 批量模式
  if (opts.check || opts.bulkFile || domains.length > 1) {
    const results = await runBulk(domains, opts);
    if (opts.json) process.stdout.write(JSON.stringify(results, null, 2) + '\n');
    return;
  }

  // 单域名模式
  const out = await queryDomain(domains[0], opts);
  if (opts.json) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
})().catch((err) => {
  console.error(red(`\n执行失败: ${err.message}`));
  if (process.env.DSH_DEBUG) console.error(err.stack);
  process.exit(1);
});
