'use strict';

const { whoisLookup } = require('./whois');
const { parseWhois } = require('./parse');
const { rdapLookup } = require('./rdap');
const { dnsLookup } = require('./dns');

/**
 * 域名可用性检测。
 *
 * 单一来源都不可靠:
 *  - WHOIS 的 "not found" 偶尔会因为限流而误报
 *  - DNS 无记录不代表未注册(注册了但没配解析)
 *  - RDAP 有很多 ccTLD 不支持
 * 所以这里做交叉验证,并给出置信度。
 *
 * @param {string} domain 已规范化的 ascii 域名
 * @param {object} opts
 * @returns {Promise<object>}
 */
async function checkAvailability(domain, opts = {}) {
  const useDns = opts.useDns !== false;
  const useRdap = opts.useRdap !== false;

  const evidence = [];
  let voteRegistered = 0;
  let voteFree = 0;
  let note = null;

  // ---- 1. WHOIS ----
  let whoisResult = null;
  let parsed = null;
  try {
    whoisResult = await whoisLookup(domain, { deep: false });
    if (whoisResult.ok) {
      parsed = parseWhois(whoisResult.text, domain);
      if (whoisResult.found === false || parsed.registered === false) {
        voteFree += 1;
        evidence.push({ source: 'WHOIS', verdict: 'available', detail: `${whoisResult.server} 未找到该域名的注册记录` });
      } else if (parsed.registered === true) {
        voteRegistered += 1;
        evidence.push({
          source: 'WHOIS',
          verdict: 'registered',
          detail: parsed.created ? `注册于 ${parsed.created.slice(0, 10)}` : '存在注册记录',
        });
      } else {
        evidence.push({ source: 'WHOIS', verdict: 'unknown', detail: '响应无法明确判定' });
      }
    } else {
      evidence.push({ source: 'WHOIS', verdict: 'error', detail: whoisResult.error });
    }
  } catch (err) {
    evidence.push({ source: 'WHOIS', verdict: 'error', detail: err.message });
  }

  // ---- 2. DNS ----
  // 关键:只看"注册局委派"(NS/SOA)。单独一条 A 记录不能证明域名已注册 ——
  // 运营商劫持、泛解析、CDN 都可能凭空造出 A 记录,而真正已注册的域名一定有 NS。
  let dnsResult = null;
  if (useDns) {
    try {
      dnsResult = await dnsLookup(domain, { types: ['NS', 'SOA', 'A'] });
      const nsRecs = dnsResult.records.NS || [];
      const soaRecs = dnsResult.records.SOA || [];
      const nsLookup = (dnsResult.details || []).find((d) => d.type === 'NS');
      const soaLookup = (dnsResult.details || []).find((d) => d.type === 'SOA');

      if (nsRecs.length || soaRecs.length) {
        voteRegistered += 1;
        const what = nsRecs.length ? `${nsRecs.length} 条 NS 委派` : 'SOA 记录';
        evidence.push({ source: 'DNS', verdict: 'registered', detail: `存在 ${what}(域名已在注册局完成委派)` });
      } else if (nsLookup && nsLookup.notFound && soaLookup && soaLookup.notFound) {
        voteFree += 1;
        evidence.push({ source: 'DNS', verdict: 'available', detail: 'NS 与 SOA 均返回 NXDOMAIN —— 该域名未在 DNS 中委派' });
      } else if (dnsResult.hijackSuspect) {
        evidence.push({
          source: 'DNS',
          verdict: 'unknown',
          detail: `A 记录指向非公网地址(${dnsResult.nonPublicIps.join(', ')}),疑似 DNS 劫持/NXDOMAIN 重定向,不作为注册依据`,
        });
      } else {
        evidence.push({ source: 'DNS', verdict: 'unknown', detail: '无 NS/SOA 委派记录(可能已注册但未配置解析)' });
      }
    } catch (err) {
      evidence.push({ source: 'DNS', verdict: 'error', detail: err.message });
    }
  }

  // ---- 3. RDAP ----
  let rdapResult = null;
  if (useRdap) {
    try {
      rdapResult = await rdapLookup(domain);
      if (rdapResult.ok) {
        if (rdapResult.found === false) {
          voteFree += 1;
          evidence.push({ source: 'RDAP', verdict: 'available', detail: '注册局 RDAP 返回 404(对象不存在)' });
        } else {
          voteRegistered += 1;
          evidence.push({ source: 'RDAP', verdict: 'registered', detail: `handle=${rdapResult.parsed.handle || '-'}` });
        }
      } else {
        evidence.push({ source: 'RDAP', verdict: 'unknown', detail: rdapResult.error });
      }
    } catch (err) {
      evidence.push({ source: 'RDAP', verdict: 'error', detail: err.message });
    }
  }

  // ---- 综合判定 ----
  let available = null;
  let confidence = 'unknown';

  if (voteRegistered > 0) {
    available = false;
    confidence = voteFree > 0 ? 'medium' : 'high';
    if (voteFree > 0) note = '不同数据源结论不一致(通常是 DNS 尚未生效或 WHOIS 限流),已按"已注册"处理';
  } else if (voteFree > 0) {
    available = true;
    confidence = voteFree >= 2 ? 'high' : 'medium';
    if (voteFree === 1) note = '仅单一数据源确认未注册,建议以注册商实时结果为准';
  } else {
    available = null;
    confidence = 'unknown';
    note = '所有数据源均未能给出明确结论';
  }

  // 注册局保留/溢价域名的提示
  const rawText = whoisResult && whoisResult.text ? whoisResult.text : '';
  if (/reserved|blocked|premium|not available for registration/i.test(rawText)) {
    note = (note ? `${note};` : '') + '注册局提示该域名为保留/溢价域名,可能无法以普通价格注册';
  }

  return {
    domain,
    available,
    confidence,
    votes: { registered: voteRegistered, available: voteFree },
    evidence,
    note,
    whois: whoisResult ? { ok: whoisResult.ok, found: whoisResult.found, server: whoisResult.server, error: whoisResult.error, parsed } : null,
    dns: dnsResult ? {
      hasAnyRecord: dnsResult.hasAnyRecord,
      hasDelegation: dnsResult.hasDelegation,
      hijackSuspect: dnsResult.hijackSuspect,
      nxdomain: dnsResult.nxdomain,
      records: dnsResult.records,
    } : null,
    rdap: rdapResult ? { ok: rdapResult.ok, found: rdapResult.found, error: rdapResult.error } : null,
  };
}

/**
 * 批量检测多个域名(可跨多个后缀)的可用性,带并发控制。
 * @param {string[]} domains 已规范化的 ascii 域名数组
 * @param {object} opts { concurrency: number, onProgress: fn }
 */
async function bulkAvailability(domains, opts = {}) {
  const concurrency = Math.max(1, Math.min(opts.concurrency || 4, 10));
  const results = new Array(domains.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= domains.length) return;
      try {
        results[i] = await checkAvailability(domains[i], opts);
      } catch (err) {
        results[i] = { domain: domains[i], available: null, confidence: 'unknown', error: err.message, evidence: [] };
      }
      done += 1;
      if (typeof opts.onProgress === 'function') {
        try { opts.onProgress(done, domains.length, results[i]); } catch { /* ignore */ }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, domains.length) }, worker));
  return results;
}

module.exports = { checkAvailability, bulkAvailability };
