'use strict';

/**
 * RDAP (Registration Data Access Protocol) 客户端 —— WHOIS 的现代替代品。
 * 优点:结构化 JSON、支持 HTTPS、有标准化的错误码。
 * 缺点:不是所有 ccTLD 都提供。
 *
 * 服务地址优先从 IANA bootstrap 文件动态获取,失败则用内置映射。
 */

const BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
const BOOTSTRAP_TTL = 24 * 60 * 60 * 1000; // 24h

let bootstrapCache = { at: 0, map: null };

/** 内置兜底映射(常用 TLD -> RDAP base URL) */
const FALLBACK = {
  com: 'https://rdap.verisign.com/com/v1',
  net: 'https://rdap.verisign.com/net/v1',
  org: 'https://rdap.publicinterestregistry.org/rdap',
  info: 'https://rdap.identitydigital.services/rdap',
  biz: 'https://rdap.nic.biz',
  io: 'https://rdap.nic.io',
  co: 'https://rdap.nic.co',
  me: 'https://rdap.nic.me',
  tv: 'https://rdap.nic.tv',
  cc: 'https://rdap.verisign.com/cc/v1',
  xyz: 'https://rdap.centralnic.com/xyz',
  app: 'https://rdap.nic.google',
  dev: 'https://rdap.nic.google',
  page: 'https://rdap.nic.google',
  cn: 'https://rdap.cnnic.cn/rdap',
  uk: 'https://rdap.nominet.uk/uk',
  de: 'https://rdap.denic.de',
  nl: 'https://rdap.dnsbelgium.be/domain',
  fr: 'https://rdap.nic.fr',
  eu: 'https://rdap.eu',
  it: 'https://rdap.nic.it',
  es: 'https://rdap.nic.es',
  pl: 'https://rdap.dns.pl',
  cz: 'https://rdap.nic.cz',
  se: 'https://rdap.iis.se',
  no: 'https://rdap.norid.no',
  dk: 'https://rdap.dk-hostmaster.dk',
  fi: 'https://rdap.fi',
  ch: 'https://rdap.nic.ch',
  at: 'https://rdap.nic.at',
  be: 'https://rdap.dnsbelgium.be/domain',
  jp: 'https://rdap.jprs.jp',
  kr: 'https://rdap.kr',
  tw: 'https://rdap.twnic.tw',
  hk: 'https://rdap.hkirc.hk',
  sg: 'https://rdap.sgnic.sg',
  in: 'https://rdap.registry.in',
  au: 'https://rdap.auda.org.au',
  nz: 'https://rdap.srs.net.nz',
  ca: 'https://rdap.ca.fury.ca/rdap',
  br: 'https://rdap.registro.br',
  mx: 'https://rdap.mx',
  ai: 'https://rdap.identitydigital.services/rdap',
  id: 'https://rdap.pandi.id',
  vn: 'https://rdap.vnnic.vn',
  th: 'https://rdap.thnic.net',
  ru: 'https://rdap.tcinet.ru',
  ua: 'https://rdap.ua',
  tr: 'https://rdap.trabis.gov.tr',
  il: 'https://rdap.isoc.org.il',
  za: 'https://rdap.registry.net.za',
  us: 'https://rdap.nic.us',
  top: 'https://rdap.centralnic.com/top',
  site: 'https://rdap.centralnic.com/site',
  online: 'https://rdap.centralnic.com/online',
  club: 'https://rdap.centralnic.com/club',
  shop: 'https://rdap.centralnic.com/shop',
  store: 'https://rdap.centralnic.com/store',
  tech: 'https://rdap.centralnic.com/tech',
  space: 'https://rdap.centralnic.com/space',
  website: 'https://rdap.centralnic.com/website',
  press: 'https://rdap.centralnic.com/press',
  host: 'https://rdap.centralnic.com/host',
  fun: 'https://rdap.centralnic.com/fun',
  icu: 'https://rdap.centralnic.com/icu',
  vip: 'https://rdap.centralnic.com/vip',
  wang: 'https://rdap.centralnic.com/wang',
  ren: 'https://rdap.centralnic.com/ren',
};

/** 拉取并解析 IANA RDAP bootstrap */
async function loadBootstrap() {
  if (bootstrapCache.map && Date.now() - bootstrapCache.at < BOOTSTRAP_TTL) {
    return bootstrapCache.map;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(BOOTSTRAP_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const map = {};
    for (const [tlds, urls] of json.services || []) {
      const base = (urls || []).find((u) => u.startsWith('https://')) || (urls || [])[0];
      if (!base) continue;
      for (const t of tlds) map[String(t).toLowerCase()] = base.replace(/\/$/, '');
    }
    bootstrapCache = { at: Date.now(), map };
    return map;
  } catch {
    return null;
  }
}

/** 找出某 TLD 的 RDAP 服务地址 */
async function findRdapServer(tld) {
  const boot = await loadBootstrap();
  if (boot && boot[tld]) return { base: boot[tld], source: 'iana-bootstrap' };
  if (FALLBACK[tld]) return { base: FALLBACK[tld], source: 'builtin' };
  return null;
}

/** 规范化 RDAP 的 vcardArray */
function parseVcard(vcardArray) {
  const out = {};
  if (!Array.isArray(vcardArray) || !Array.isArray(vcardArray[1])) return out;
  for (const item of vcardArray[1]) {
    if (!Array.isArray(item) || item.length < 4) continue;
    const [name, , , value] = item;
    if (name === 'fn' || name === 'org') out[name === 'fn' ? 'name' : 'org'] = Array.isArray(value) ? value.join(' ') : value;
    if (name === 'email') out.email = value;
    if (name === 'tel') out.phone = value;
    if (name === 'adr') {
      const arr = Array.isArray(value) ? value : [];
      out.country = arr[arr.length - 1] || arr[6] || '';
      out.address = arr.filter(Boolean).join(', ');
    }
  }
  return out;
}

/** 把 RDAP JSON 归一化成与 WHOIS 解析结果相近的结构 */
function normalizeRdap(json, domain) {
  const events = {};
  for (const e of json.events || []) {
    if (e && e.eventAction) events[e.eventAction] = e.eventDate;
  }
  const created = events.registration || null;
  const expires = events.expiration || null;
  const updated = events['last changed'] || events['last update of RDAP database'] || null;

  const now = Date.now();
  const daysLeft = expires ? Math.floor((new Date(expires).getTime() - now) / 86400000) : null;
  const ageDays = created ? Math.floor((now - new Date(created).getTime()) / 86400000) : null;

  const nameServers = [...new Set((json.nameservers || [])
    .map((n) => String(n.ldhName || '').toLowerCase().replace(/\.$/, ''))
    .filter((n) => n.includes('.')))];

  const statuses = (json.status || []).map((s) => String(s));

  // registrar 取 roles 含 registrar 的实体
  let registrar = { name: null, url: null, ianaId: null, abuseEmail: null, abusePhone: null, whoisServer: null };
  let registrant = {};
  let registrantRedacted = false;

  for (const ent of json.entities || []) {
    const roles = ent.roles || [];
    const vc = parseVcard(ent.vcardArray);
    if (roles.includes('registrar')) {
      registrar = {
        name: vc.name || vc.org || null,
        url: (ent.links || []).map((l) => l.href).find(Boolean) || null,
        ianaId: (ent.publicIds || []).map((p) => p.identifier).find(Boolean) || null,
        abuseEmail: vc.email || null,
        abusePhone: vc.phone || null,
        whoisServer: null,
      };
    }
    if (roles.includes('registrant')) {
      const redacted = JSON.stringify(ent).includes('redacted');
      if (redacted && !vc.name && !vc.org) { registrantRedacted = true; }
      registrant = {
        name: vc.name || vc.org || null,
        email: vc.email || null,
        country: vc.country || null,
      };
    }
  }

  const secureDNS = json.secureDNS;
  const dnssec = secureDNS ? (secureDNS.delegationSigned ? 'signed' : 'unsigned') : null;

  return {
    source: 'RDAP',
    domain: json.ldhName ? String(json.ldhName).toLowerCase() : domain,
    registered: json.objectClassName === 'domain' ? true : null,
    created, expires, updated, daysLeft, ageDays,
    statuses,
    nameServers,
    dnssec,
    registrant,
    registrantRedacted,
    registrar,
    registryDomainId: json.handle || null,
    handle: json.handle || null,
  };
}

/**
 * 执行 RDAP 查询
 * @param {string} domain 已规范化的 ascii 域名
 * @param {object} opts
 * @returns {Promise<object>}
 */
async function rdapLookup(domain, opts = {}) {
  const { timeout = 12000 } = opts;
  const tld = domain.split('.').pop();
  const server = await findRdapServer(tld);
  if (!server) {
    return { ok: false, domain, error: `未找到 .${tld} 的 RDAP 服务地址` };
  }

  const url = `${server.base}/domain/${encodeURIComponent(domain)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: 'application/rdap+json, application/json' },
    });
    clearTimeout(timer);

    if (res.status === 404) {
      // 有些注册局用 404 + 错误码表示"域名不存在"
      let body = null;
      try { body = await res.json(); } catch { /* ignore */ }
      return { ok: true, domain, found: false, source: 'RDAP', server: server.base, url, errorCode: body && body.errorCode };
    }
    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch { /* ignore */ }
      return {
        ok: false, domain, server: server.base, url,
        error: `RDAP 返回 HTTP ${res.status}${body && body.title ? `: ${body.title}` : ''}`,
      };
    }

    const json = await res.json();
    const parsed = normalizeRdap(json, domain);
    return { ok: true, domain, found: true, server: server.base, serverSource: server.source, url, json, parsed };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError' ? `RDAP 请求超时(${timeout}ms)` : `RDAP 请求失败: ${err.message}`;
    return { ok: false, domain, server: server.base, url, error: msg };
  }
}

module.exports = { rdapLookup, findRdapServer, loadBootstrap, normalizeRdap, FALLBACK };
