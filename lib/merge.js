'use strict';

/**
 * 把 WHOIS 解析结果与 RDAP 解析结果合并成统一的 summary。
 * 原则:WHOIS 优先(它有中文状态解释),RDAP 用来补全 WHOIS 缺失的字段。
 */

const pick = (a, b) => (a !== null && a !== undefined && a !== ''
  && !(Array.isArray(a) && !a.length) ? a : b);

/**
 * @param {object|null} parsed WHOIS 解析结果
 * @param {object|null} rdap   RDAP 归一化结果
 * @param {object} norm        normalizeDomain 的结果
 */
function mergeInfo(parsed, rdap, norm) {
  const out = {
    domain: norm.ascii,
    unicode: norm.unicode,
    tld: norm.tld,
    tldUnicode: norm.tldUnicode || null,
    registrable: norm.registrable,
    sub: norm.sub || null,
    registered: parsed ? parsed.registered : (rdap ? rdap.registered : null),
    created: null, updated: null, expires: null, daysLeft: null, ageDays: null,
    statuses: [], nameServers: [], dnssec: null,
    registrant: {}, registrantRedacted: false,
    registrar: { name: null, url: null, ianaId: null, abuseEmail: null, abusePhone: null, whoisServer: null },
    registryDomainId: null,
    sources: [],
  };

  if (parsed) out.sources.push('WHOIS');
  if (rdap) out.sources.push('RDAP');

  out.created = pick(parsed && parsed.created, rdap && rdap.created);
  out.updated = pick(parsed && parsed.updated, rdap && rdap.updated);
  out.expires = pick(parsed && parsed.expires, rdap && rdap.expires);
  out.dnssec = pick(parsed && parsed.dnssec, rdap && rdap.dnssec);
  out.registryDomainId = pick(parsed && parsed.registryDomainId, rdap && rdap.registryDomainId);
  out.registrantRedacted = !!(parsed && parsed.registrantRedacted) || !!(rdap && rdap.registrantRedacted);
  out.nameServers = pick(parsed && parsed.nameServers, rdap && rdap.nameServers) || [];

  // 状态合并,以 WHOIS 的中文解释为主
  const seen = new Set();
  for (const s of [...((parsed && parsed.statuses) || []), ...((rdap && rdap.statuses) || [])]) {
    const code = typeof s === 'string' ? s : s.code;
    const k = String(code || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.statuses.push(typeof s === 'string' ? { code: s, zh: s, desc: '', type: 'info' } : s);
  }
  // 用 WHOIS 的解释补回 RDAP 里只有 code 的状态
  if (parsed && parsed.statuses) {
    for (let i = 0; i < out.statuses.length; i += 1) {
      const st = out.statuses[i];
      if (!st.zh || st.zh === st.code) {
        const match = parsed.statuses.find((p) => String(p.code).toLowerCase() === String(st.code).toLowerCase());
        if (match && match.zh && match.zh !== match.code) out.statuses[i] = match;
      }
    }
  }

  const reg = { ...out.registrar };
  for (const k of Object.keys(reg)) {
    reg[k] = pick(parsed && parsed.registrar && parsed.registrar[k], rdap && rdap.registrar && rdap.registrar[k]);
  }
  out.registrar = reg;

  out.registrant = {
    name: pick(parsed && parsed.registrant && parsed.registrant.name, rdap && rdap.registrant && rdap.registrant.name),
    email: pick(parsed && parsed.registrant && parsed.registrant.email, rdap && rdap.registrant && rdap.registrant.email),
    country: pick(parsed && parsed.registrant && parsed.registrant.country, rdap && rdap.registrant && rdap.registrant.country),
    org: pick(null, rdap && rdap.registrant && rdap.registrant.org),
  };

  // 以合并后的日期重算天数
  const now = Date.now();
  if (out.expires) {
    const t = new Date(out.expires).getTime();
    if (!Number.isNaN(t)) out.daysLeft = Math.floor((t - now) / 86400000);
  }
  if (out.created) {
    const t = new Date(out.created).getTime();
    if (!Number.isNaN(t)) out.ageDays = Math.floor((now - t) / 86400000);
  }

  return out;
}

module.exports = { mergeInfo };
