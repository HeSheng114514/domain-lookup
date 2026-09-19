'use strict';

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const { normalizeDomain, splitInputList, MULTI_SUFFIXES } = require('./lib/domain');
const { whoisLookup } = require('./lib/whois');
const { parseWhois, parseDate } = require('./lib/parse');
const { rdapLookup, findRdapServer, loadBootstrap } = require('./lib/rdap');
const { dnsLookup, resolveChain, systemServers, TYPES } = require('./lib/dns');
const { checkAvailability, bulkAvailability } = require('./lib/availability');
const { TLDS } = require('./lib/tld-servers');
const { mergeInfo } = require('./lib/merge');
const { getEmbedded, isSeaBuild: IsSeaBuild } = require('./lib/assets');
const pkg = require('./package.json');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(text);
}

/** 统一读取并校验 domain 参数 */
function readDomain(url, param = 'domain') {
  const raw = url.searchParams.get(param) || '';
  if (!raw) return { ok: false, status: 400, error: '缺少 domain 参数' };
  const norm = normalizeDomain(raw);
  if (!norm.ok) return { ok: false, status: 400, error: norm.error };
  return { ok: true, norm };
}

const routes = {
  /** GET /api/full?domain=x —— 一次性拿到 WHOIS + DNS + RDAP */
  async full(req, res, url) {
    const d = readDomain(url);
    if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
    const { norm } = d;
    const noDns = url.searchParams.get('dns') === '0';
    const noRdap = url.searchParams.get('rdap') === '0';
    const t0 = Date.now();

    const [whoisRes, dnsRes, rdapRes] = await Promise.all([
      whoisLookup(norm.ascii).catch((e) => ({ ok: false, domain: norm.ascii, error: e.message, steps: [] })),
      noDns ? Promise.resolve(null) : dnsLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message, records: {} })),
      noRdap ? Promise.resolve(null) : rdapLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message })),
    ]);

    const parsed = whoisRes.ok ? parseWhois(whoisRes.text, norm.ascii) : null;
    // WHOIS 里没有的字段,用 RDAP 补全
    const merged = mergeInfo(parsed, rdapRes && rdapRes.ok ? rdapRes.parsed : null, norm);

    return sendJson(res, 200, {
      ok: true,
      query: { input: url.searchParams.get('domain'), ...norm },
      elapsedMs: Date.now() - t0,
      summary: merged,
      whois: whoisRes.ok
        ? { ok: true, found: whoisRes.found, servers: whoisRes.servers, steps: whoisRes.steps, text: whoisRes.text }
        : { ok: false, error: whoisRes.error, steps: whoisRes.steps || [] },
      parsed,
      rdap: rdapRes ? (rdapRes.ok
        ? { ok: true, found: rdapRes.found, server: rdapRes.server, serverSource: rdapRes.serverSource, url: rdapRes.url, parsed: rdapRes.parsed, json: rdapRes.json }
        : { ok: false, error: rdapRes.error, server: rdapRes.server }) : null,
      dns: dnsRes,
    });
  },

  /** GET /api/whois?domain=x */
  async whois(req, res, url) {
    const d = readDomain(url);
    if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
    const { norm } = d;
    const deep = url.searchParams.get('deep') !== '0';
    const t0 = Date.now();
    const r = await whoisLookup(norm.ascii, { deep });
    if (!r.ok) return sendJson(res, 200, { ok: false, domain: norm.ascii, error: r.error, steps: r.steps });
    const parsed = parseWhois(r.text, norm.ascii);
    return sendJson(res, 200, {
      ok: true,
      domain: norm.ascii,
      found: r.found,
      servers: r.servers,
      steps: r.steps,
      elapsedMs: Date.now() - t0,
      parsed,
      text: r.text,
    });
  },

  /** GET /api/rdap?domain=x */
  async rdap(req, res, url) {
    const d = readDomain(url);
    if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
    const r = await rdapLookup(d.norm.ascii);
    return sendJson(res, 200, r);
  },

  /** GET /api/dns?domain=x&types=A,MX */
  async dns(req, res, url) {
    const d = readDomain(url);
    if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
    const typesParam = url.searchParams.get('types');
    const types = typesParam ? typesParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : TYPES;
    const bad = types.filter((t) => !TYPES.includes(t));
    if (bad.length) return sendJson(res, 400, { ok: false, error: `不支持的记录类型: ${bad.join(', ')}`, supported: TYPES });
    const chain = url.searchParams.get('chain') === '1';
    const [records, chainRes] = await Promise.all([
      dnsLookup(d.norm.ascii, { types }),
      chain ? resolveChain(d.norm.ascii) : Promise.resolve(null),
    ]);
    return sendJson(res, 200, { ...records, chain: chainRes });
  },

  /** GET /api/check?domain=x —— 可用性检测 */
  async check(req, res, url) {
    const d = readDomain(url);
    if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
    const r = await checkAvailability(d.norm.ascii, {
      useDns: url.searchParams.get('dns') !== '0',
      useRdap: url.searchParams.get('rdap') !== '0',
    });
    return sendJson(res, 200, { ok: true, ...r });
  },

  /** GET /api/bulk?domains=a.com,b.net —— SSE 流式返回每个结果 */
  async bulk(req, res, url) {
    const raw = url.searchParams.get('domains') || '';
    const inputs = splitInputList(raw).slice(0, 200);
    if (!inputs.length) return sendJson(res, 400, { ok: false, error: '没有提供要查询的域名' });

    const items = inputs.map((x) => ({ input: x, norm: normalizeDomain(x) }));

    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    const send = (event, data) => {
      if (res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('start', { total: items.length });
    let closed = false;
    req.on('close', () => { closed = true; });

    let done = 0;
    const concurrency = Math.max(1, Math.min(Number(url.searchParams.get('c') || 4), 8));
    let cursor = 0;

    async function worker() {
      for (;;) {
        if (closed) return;
        const i = cursor; cursor += 1;
        if (i >= items.length) return;
        const it = items[i];
        let result;
        if (!it.norm.ok) {
          result = { input: it.input, ok: false, error: it.norm.error };
        } else {
          try {
            const av = await checkAvailability(it.norm.ascii);
            const parsed = av.whois && av.whois.parsed ? av.whois.parsed : null;
            const rdapParsed = av.rdap && av.rdap.ok && av.rdap.found ? av.rdap.parsed : null;
            result = {
              input: it.input,
              ok: true,
              ...av,
              ascii: it.norm.ascii,
              unicode: it.norm.unicode,
              summary: mergeInfo(parsed, rdapParsed, it.norm),
            };
          } catch (err) {
            result = { input: it.input, ok: false, error: err.message };
          }
        }
        done += 1;
        send('result', { index: i, done, ...result });
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    send('done', { total: items.length, done });
    res.end();
  },

  /** GET /api/meta —— 程序信息 */
  async meta(req, res) {
    const boot = await loadBootstrap();
    return sendJson(res, 200, {
      ok: true,
      name: pkg.name,
      version: pkg.version,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      dnsServers: systemServers(),
      dnsTypes: TYPES,
      whoisTldCount: Object.keys(TLDS).length,
      rdapBootstrapLoaded: !!boot,
      rdapTldCount: boot ? Object.keys(boot).length : 0,
      multiSuffixes: [...MULTI_SUFFIXES].length,
    });
  },

  /** GET /api/tlds?q=co */
  async tlds(req, res, url) {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const list = Object.keys(TLDS).filter((t) => !q || t.includes(q));
    return sendJson(res, 200, { ok: true, total: Object.keys(TLDS).length, tlds: list });
  },

  /** GET /api/health */
  async health(req, res) {
    return sendJson(res, 200, { ok: true, time: new Date().toISOString(), uptime: Math.round(process.uptime()) });
  },
};

/** 静态文件服务 */
async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  // 防目录穿越
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, 403, '403 Forbidden');

  // 单文件版(SEA)把 public/ 内嵌进 exe,磁盘上没有这个目录,所以先查内嵌资源
  if (IsSeaBuild) {
    const emb = getEmbedded(`public/${safe.split(path.sep).join('/')}`);
    if (emb) {
      const ext = path.extname(safe).toLowerCase();
      res.writeHead(200, {
        'content-type': MIME[ext] || 'application/octet-stream',
        'content-length': emb.length,
        'cache-control': 'no-cache',
      });
      return res.end(emb);
    }
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) return serveStatic(req, res, new URL(`${rel}/index.html`, url.origin));
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    // SPA 回退
    try {
      const idx = path.join(PUBLIC_DIR, 'index.html');
      const html = await fsp.readFile(idx);
      res.writeHead(200, { 'content-type': MIME['.html'] });
      res.end(html);
    } catch {
      sendText(res, 404, '404 Not Found');
    }
  }
  return undefined;
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    };
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);

    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/\/$/, '');
      const handler = routes[name];
      if (!handler) return sendJson(res, 404, { ok: false, error: `未知接口 /api/${name}` });
      try {
        return await handler(req, res, url);
      } catch (err) {
        if (!res.writableEnded) sendJson(res, 500, { ok: false, error: err.message, stack: process.env.DSH_DEBUG ? err.stack : undefined });
        return undefined;
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, '405 Method Not Allowed');
    return serveStatic(req, res, url);
  });
}

module.exports = { createServer, mergeInfo };

if (require.main === module) {
  const port = Number(process.env.PORT || process.argv[2] || 8420);
  const host = process.env.HOST || '127.0.0.1';
  const server = createServer();
  server.listen(port, host, () => {
    const shown = host === '0.0.0.0' ? '127.0.0.1' : host;
    console.log('');
    console.log('  域名查询工具已启动');
    console.log('  ────────────────────────────────────────');
    console.log(`  本机访问:  http://${shown}:${port}`);
    console.log(`  监听地址:  ${host}:${port}`);
    console.log(`  Node 版本: ${process.version}`);
    console.log('  按 Ctrl+C 停止');
    console.log('');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n端口 ${port} 已被占用。请换一个端口,例如:\n  node server.js 8421\n`);
    } else {
      console.error('启动失败:', err.message);
    }
    process.exit(1);
  });
}
