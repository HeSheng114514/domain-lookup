'use strict';

const dns = require('dns');
const { Resolver } = dns;

const TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'SRV', 'PTR'];

/**
 * 建立一个解析器。默认用系统 DNS;也可指定上游服务器。
 * @param {string[]|null} servers 例如 ['8.8.8.8','1.1.1.1']
 */
function makeResolver(servers) {
  if (!servers || !servers.length) return dns.promises;
  const r = new Resolver({ timeout: 5000, tries: 2 });
  r.setServers(servers);
  return {
    resolve4: (n) => r.resolve4(n),
    resolve6: (n) => r.resolve6(n),
    resolveCname: (n) => r.resolveCname(n),
    resolveMx: (n) => r.resolveMx(n),
    resolveNs: (n) => r.resolveNs(n),
    resolveTxt: (n) => r.resolveTxt(n),
    resolveSoa: (n) => r.resolveSoa(n),
    resolveCaa: (n) => r.resolveCaa(n),
    resolveSrv: (n) => r.resolveSrv(n),
    reverse: (n) => r.reverse(n),
  };
}

/** DNS 错误码 -> 中文说明 */
function explainDnsError(code) {
  switch (code) {
    case 'ENOTFOUND': return '记录不存在';
    case 'ENODATA': return '该类型无记录';
    case 'NXDOMAIN': return '域名不存在';
    case 'SERVFAIL': return 'DNS 服务器返回 SERVFAIL';
    case 'REFUSED': return 'DNS 服务器拒绝查询';
    case 'ETIMEOUT':
    case 'ETIMEDOUT': return 'DNS 查询超时';
    case 'ECONNREFUSED': return '无法连接 DNS 服务器';
    case 'ESERVFAIL': return 'DNS 服务器解析失败';
    default: return code || '未知错误';
  }
}

function isNotFoundCode(code) {
  return code === 'ENOTFOUND' || code === 'ENODATA' || code === 'NXDOMAIN';
}

/**
 * 查询一条记录
 * @returns {Promise<{type:string, ok:boolean, records:any[], error?:string, code?:string}>}
 */
async function queryType(resolver, domain, type) {
  try {
    let records;
    switch (type) {
      case 'A': records = await resolver.resolve4(domain); break;
      case 'AAAA': records = await resolver.resolve6(domain); break;
      case 'CNAME': records = await resolver.resolveCname(domain); break;
      case 'MX': records = (await resolver.resolveMx(domain)).sort((a, b) => a.priority - b.priority); break;
      case 'NS': records = (await resolver.resolveNs(domain)).sort(); break;
      case 'TXT':
        records = (await resolver.resolveTxt(domain)).map((chunks) => chunks.join(''));
        break;
      case 'SOA': {
        const s = await resolver.resolveSoa(domain);
        records = [s];
        break;
      }
      case 'CAA': {
        const c = await resolver.resolveCaa(domain);
        records = c.map((x) => `${x.critical ? 'critical ' : ''}${x.issue ? `issue="${x.issue}"` : ''}${x.issuewild ? `issuewild="${x.issuewild}"` : ''}${x.iodef ? `iodef="${x.iodef}"` : ''}`.trim());
        break;
      }
      case 'SRV': records = await resolver.resolveSrv(domain); break;
      case 'PTR': records = await resolver.reverse(domain); break;
      default: return { type, ok: false, records: [], error: `不支持的记录类型 ${type}` };
    }
    return { type, ok: true, records: records || [] };
  } catch (err) {
    return {
      type,
      ok: false,
      records: [],
      code: err.code,
      error: explainDnsError(err.code),
      notFound: isNotFoundCode(err.code),
    };
  }
}

/**
 * 查询一个域名的全部(或指定)DNS 记录
 * @param {string} domain
 * @param {object} opts { types: string[], servers: string[] }
 */
async function dnsLookup(domain, opts = {}) {
  const types = (opts.types && opts.types.length ? opts.types : TYPES).map((t) => t.toUpperCase());
  const resolver = makeResolver(opts.servers);

  const started = Date.now();
  const results = await Promise.all(types.map((t) => queryType(resolver, domain, t)));

  const records = {};
  for (const r of results) {
    if (r.ok && r.records.length) records[r.type] = r.records;
  }

  const hasAnyRecord = Object.keys(records).length > 0;
  const allNotFound = results.every((r) => !r.ok && r.notFound);

  // DNS 劫持检测:A/AAAA 指向私有或保留段,但又没有真实的委派(NS/SOA)
  const addrList = [...(records.A || []), ...(records.AAAA || [])];
  const nonPublicIps = addrList.filter(ipIsNonPublic);
  const hasDelegation = !!(records.NS || records.SOA);
  const hijackSuspect = nonPublicIps.length > 0 && !hasDelegation;

  return {
    ok: true,
    domain,
    records,
    details: results,
    hasAnyRecord,
    allNotFound,
    /** 该域名是否存在注册局委派(有 NS 或 SOA 才算真正"在 DNS 里存在") */
    hasDelegation,
    nonPublicIps,
    /** 疑似被 DNS 劫持/NXDOMAIN 重定向:解析出了内网地址却没有委派记录 */
    hijackSuspect,
    /** 没有任何 DNS 记录,通常意味着域名未注册或未配置解析 */
    nxdomain: results.some((r) => r.code === 'ENOTFOUND' || r.code === 'NXDOMAIN'),
    servers: opts.servers && opts.servers.length ? opts.servers : 'system',
    elapsedMs: Date.now() - started,
  };
}

/** 沿 CNAME 链一路解析,返回解析路径 */
async function resolveChain(domain, opts = {}) {
  const resolver = makeResolver(opts.servers);
  const chain = [];
  let current = domain;
  const seen = new Set();

  for (let i = 0; i < 10; i += 1) {
    if (seen.has(current)) { chain.push({ name: current, note: 'CNAME 链存在环' }); break; }
    seen.add(current);

    const [cname, a, aaaa] = await Promise.all([
      queryType(resolver, current, 'CNAME'),
      queryType(resolver, current, 'A'),
      queryType(resolver, current, 'AAAA'),
    ]);

    const hop = { name: current };
    if (cname.ok && cname.records.length) {
      hop.cname = cname.records[0];
      chain.push(hop);
      current = cname.records[0];
      continue;
    }
    if (a.ok && a.records.length) hop.a = a.records;
    if (aaaa.ok && aaaa.records.length) hop.aaaa = aaaa.records;
    if (!hop.a && !hop.aaaa) hop.note = cname.notFound !== false ? '无解析记录' : '解析失败';
    chain.push(hop);
    break;
  }
  return { ok: true, domain, chain };
}

/** 列出系统 DNS 服务器 */
function systemServers() {
  try { return dns.getServers(); } catch { return []; }
}

/**
 * 私有/保留地址段。注意 198.18.0.0/15 (RFC 2544 基准测试段) ——
 * 部分运营商和企业 DNS 会把 NXDOMAIN 劫持到这个段,所以它出现在 A 记录里
 * 通常意味着"域名其实不存在,只是被 DNS 劫持了"。
 */
const NON_PUBLIC_PATTERNS = [
  /^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^198\.1[89]\./,
  /^192\.0\.(0|2)\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1$/, /^::$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i,
];

/** 判断一个 IP 是否属于私有/保留段(不可能是一个正常的公网网站地址) */
function ipIsNonPublic(ip) {
  const s = String(ip || '').trim().toLowerCase();
  if (!s) return false;
  return NON_PUBLIC_PATTERNS.some((re) => re.test(s));
}

module.exports = {
  dnsLookup, queryType, resolveChain, systemServers,
  explainDnsError, ipIsNonPublic, TYPES, makeResolver,
};
