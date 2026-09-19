'use strict';

const net = require('net');
const { TLDS, QUERY_PREFIX, REGISTRY_ONLY } = require('./tld-servers');

const DEFAULT_TIMEOUT = 15000;
const MAX_RESPONSE = 2 * 1024 * 1024; // 2MB 上限,防止异常服务器灌爆内存

/** ---- 每个 WHOIS 服务器的限流器,避免被注册局封禁 ---- */
const MIN_INTERVAL = 900; // 同一服务器两次查询之间的最小间隔(ms)
const hostState = new Map();

function throttle(host) {
  const st = hostState.get(host) || { last: 0, chain: Promise.resolve() };
  const wait = Math.max(0, st.last - Date.now() + MIN_INTERVAL);
  const p = st.chain.then(() => new Promise((r) => setTimeout(r, wait)));
  st.chain = p.catch(() => {});
  st.last = Date.now() + wait;
  hostState.set(host, st);
  return p;
}

/** 底层:向某个 WHOIS 服务器发起一次 TCP 43 查询 */
function rawWhois(host, query, { timeout = DEFAULT_TIMEOUT, port = 43 } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const done = (fn, arg) => { if (!settled) { settled = true; fn(arg); } };

    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const prefix = QUERY_PREFIX[host] ?? '';
      socket.write(`${prefix}${query}\r\n`);
    });
    socket.on('data', (buf) => {
      total += buf.length;
      if (total > MAX_RESPONSE) {
        socket.destroy();
        return done(resolve, Buffer.concat(chunks).toString('utf8'));
      }
      chunks.push(buf);
    });
    socket.on('end', () => done(resolve, Buffer.concat(chunks).toString('utf8')));
    socket.on('close', () => done(resolve, Buffer.concat(chunks).toString('utf8')));
    socket.on('timeout', () => { socket.destroy(); done(reject, new Error(`连接 ${host} 超时(${timeout}ms)`)); });
    socket.on('error', (err) => { socket.destroy(); done(reject, new Error(`连接 ${host} 失败: ${err.message}`)); });
  });
}

/** 判断响应是否表示"域名未注册" */
function isNotFound(text, tld) {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    /no match for/, /^not found/, /\nnot found/, /no data found/, /domain not found/,
    /is not registered/, /not registered/, /no entries found/, /no object found/,
    /status:\s*free/, /% no entries found/, /no information available/,
    /the queried object does not exist/, /domain .* not found/,
    /object does not exist/, /no matching record/, /nothing found/,
  ];
  if (patterns.some((re) => re.test(t))) return true;
  // .cn 等返回 "no matching record"; DENIC 返回 "Status: free"
  if (tld === 'cn' && /no matching record/.test(t)) return true;
  return false;
}

/** 判断响应是否为限流/拒绝服务 */
function isRateLimited(text) {
  if (!text) return false;
  return /(connection limit exceeded|too many requests|rate limit|quota exceeded|exceeded the maximum|try again later|access denied for frequent|blocked)/i.test(text);
}

/** 从 WHOIS 文本里找出下一个要查询的服务器 */
function findReferral(text, tld) {
  const lines = String(text || '').split(/\r?\n/);
  const candidates = [];
  for (const line of lines) {
    const m = line.match(/^\s*(refer|whois server|registrar whois server|whois)\s*:\s*(\S+)/i);
    if (m) {
      const host = m[2].trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (host && host.includes('.') && !/^(whois\.)?iana\.org$/.test(host)) {
        // Registrar WHOIS Server 优先级最高
        if (/registrar whois server/i.test(m[1])) candidates.unshift(host);
        else candidates.push(host);
      }
    }
  }
  return candidates[0] || null;
}

/** 有些服务器用一个"薄"注册局响应,里面嵌了真正的注册商信息 */
function extractWhoisServerField(text) {
  const m = String(text || '').match(/^\s*(?:registrar )?whois server\s*:\s*(\S+)/im);
  return m ? m[1].trim().toLowerCase() : null;
}

/**
 * 完整 WHOIS 查询。
 * 流程:静态表/IANA 找到注册局 WHOIS -> 查询 -> 必要时跟随转介到注册商 WHOIS
 *
 * @param {string} domain 已规范化的 ascii 域名
 * @param {object} opts
 * @param {number} opts.maxHops 最多跟随几次转介
 * @param {boolean} opts.deep   是否深入注册商 WHOIS(拿注册人信息)
 * @returns {Promise<object>} 查询结果(含原始文本链)
 */
async function whoisLookup(domain, opts = {}) {
  const { maxHops = 3, deep = true, timeout = DEFAULT_TIMEOUT } = opts;
  const tld = domain.split('.').pop();

  const steps = [];
  let server = TLDS[tld] || null;
  let text = '';
  let hops = 0;
  let rateLimitRetries = 0;
  const visited = new Set();

  // 没有静态表 -> 先问 IANA
  if (!server) {
    try {
      const ianaText = await rawWhois('whois.iana.org', domain, { timeout });
      steps.push({ server: 'whois.iana.org', role: 'iana', ok: true, bytes: ianaText.length });
      server = findReferral(ianaText, tld);
      if (!server) {
        return {
          ok: false,
          domain,
          steps,
          error: `IANA 未提供 .${tld} 的 WHOIS 服务器(该后缀可能不支持 WHOIS 查询,可尝试 RDAP)`,
        };
      }
    } catch (err) {
      steps.push({ server: 'whois.iana.org', role: 'iana', ok: false, error: err.message });
      return { ok: false, domain, steps, error: `无法连接 IANA WHOIS:${err.message}` };
    }
  }

  while (server && hops <= maxHops) {
    if (visited.has(server)) break;
    visited.add(server);
    hops += 1;

    await throttle(server);

    let resp;
    try {
      resp = await rawWhois(server, domain, { timeout });
    } catch (err) {
      steps.push({ server, role: hops === 1 ? 'registry' : 'registrar', ok: false, error: err.message });
      // 第一个服务器失败且是静态表里的 -> 再试 IANA 一次
      if (hops === 1) {
        try {
          const ianaText = await rawWhois('whois.iana.org', domain, { timeout });
          const alt = findReferral(ianaText, tld);
          if (alt && alt !== server) {
            steps.push({ server: 'whois.iana.org', role: 'iana', ok: true, bytes: ianaText.length });
            server = alt;
            continue;
          }
        } catch { /* 忽略 */ }
      }
      return { ok: false, domain, steps, error: err.message };
    }

    // 限流重试
    if (isRateLimited(resp) && rateLimitRetries < 2) {
      rateLimitRetries += 1;
      steps.push({ server, role: hops === 1 ? 'registry' : 'registrar', ok: false, error: '被限流,重试中' });
      await new Promise((r) => setTimeout(r, 1500 * rateLimitRetries));
      hops -= 1;
      visited.delete(server);
      continue;
    }

    steps.push({
      server,
      role: hops === 1 ? 'registry' : 'registrar',
      ok: true,
      bytes: resp.length,
      rateLimited: isRateLimited(resp) || undefined,
    });

    text = text ? `${text}\n\n${'-'.repeat(60)}\n\n${resp}` : resp;

    // 未注册 -> 直接结束
    if (isNotFound(resp, tld)) {
      return { ok: true, domain, found: false, server, text, steps, raw: resp };
    }

    if (isRateLimited(resp)) {
      return { ok: true, domain, found: null, server, text, steps, raw: resp, notice: '注册局限流,结果可能不完整' };
    }

    // 决定是否继续跟随
    let next = null;
    if (deep) {
      const registrarServer = (String(resp).match(/^\s*registrar whois server\s*:\s*(\S+)/im) || [])[1];
      if (registrarServer) {
        next = registrarServer.trim().toLowerCase();
      } else if (REGISTRY_ONLY.has(server)) {
        const f = extractWhoisServerField(resp);
        if (f) next = f;
      } else {
        const f = findReferral(resp, tld);
        // 只有当响应看起来是"薄"注册局响应(没有注册商字段)时才继续
        if (f && f !== server && !/registrar\s*:/i.test(resp)) next = f;
      }
    }

    if (!next || visited.has(next)) break;
    server = next;
  }

  const found = !isNotFound(text, tld);
  return {
    ok: true,
    domain,
    found,
    server: [...visited].pop(),
    servers: [...visited],
    text,
    steps,
  };
}

module.exports = { whoisLookup, rawWhois, isNotFound, isRateLimited, findReferral };
