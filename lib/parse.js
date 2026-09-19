'use strict';

/**
 * WHOIS 纯文本解析器。
 *
 * 不同注册局的格式差异极大,这里用"按行 key:value + 方括号段 + 别名表"的
 * 组合策略尽量把关键字段抽出来。解析失败不影响原始文本展示。
 */

const ALIASES = {
  domain: ['domain name', 'domain', 'domainname', 'domain name:', 'ascii domain', 'domain names'],
  registrar: ['registrar', 'sponsoring registrar', 'registrar name', 'registrar organization', 'record maintained by'],
  registrarUrl: ['registrar url', 'registrar website', 'registrarurl'],
  registrarIanaId: ['registrar iana id', 'iana id', 'registrar id'],
  registrarAbuseEmail: ['registrar abuse contact email', 'abuse contact email', 'abuse-mailbox'],
  registrarAbusePhone: ['registrar abuse contact phone', 'abuse contact phone', 'abuse phone'],
  created: ['creation date', 'created', 'created on', 'created date', 'registration date', 'registration time',
    'registered on', 'registered', 'domain registration date', 'created date:', 'activation date', 'registered date'],
  updated: ['updated date', 'last updated', 'last update', 'modified', 'changed', 'updated', 'last modified',
    'last update date', 'domain last updated date'],
  expires: ['registry expiry date', 'registrar registration expiration date', 'expiry date', 'expiration date',
    'expiration time', 'expires', 'expire date', 'expiry', 'paid-till', 'renewal date', 'valid until',
    'domain expiration date'],
  status: ['domain status', 'status', 'registration status', 'domain statuses', 'state', 'domain state'],
  nameServer: ['name server', 'nserver', 'nameserver', 'name servers', 'nameservers', 'ns'],
  dnssec: ['dnssec', 'dnssec status', 'ds record'],
  registrant: ['registrant', 'registrant name', 'registrant organization', 'registrant org', 'registrant contact',
    'registrant name (english)', 'holder', 'org'],
  registrantEmail: ['registrant email', 'registrant contact email', 'email'],
  registrantCountry: ['registrant country', 'registrant country/economy', 'country'],
  registrarWhois: ['registrar whois server', 'whois server', 'refer'],
  registryDomainId: ['registry domain id', 'domain id'],
  domainAge: ['domain age'],
};

function buildLookup() {
  const map = new Map(); // 归一化 key -> 规范字段名
  for (const [field, names] of Object.entries(ALIASES)) {
    for (const n of names) map.set(n.toLowerCase().replace(/[_\s]+/g, ' ').replace(/:$/, '').trim(), field);
  }
  return map;
}
const KEYMAP = buildLookup();

/** 归一化一个 key */
function normKey(k) {
  return k
    .replace(/^\[|\]$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/:+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * 把 WHOIS 文本切成 {key, value} 对。
 * 同时支持:
 *   Key: value
 *   [Key] ... value        (JPRS 风格)
 *   key:  value            (RIPE 风格小写)
 */
function tokenize(text) {
  const out = [];
  const lines = String(text || '').split(/\r?\n/);
  let pendingBracketKey = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u0000/g, '').trimEnd();
    if (!line.trim()) continue;
    if (/^[%#>]/.test(line.trim()) && !/^%\s*\w+\s*:/.test(line)) continue; // 注释行
    if (/^>>>|^NOTICE:|^TERMS OF USE|^URL of the ICANN|^For more information on Whois/i.test(line.trim())) continue;

    // [Key] value  或 [Key]
    const br = line.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (br) {
      const key = normKey(br[1]);
      const val = br[2].trim();
      if (val) out.push({ key, value: val, raw: br[1].trim() });
      else pendingBracketKey = key;
      continue;
    }

    const m = line.match(/^\s*([A-Za-z][A-Za-z0-9 _./()'-]{0,60}?)\s*:\s*(.*)$/);
    if (m) {
      const key = normKey(m[1]);
      let value = m[2].trim();
      if (!value && pendingBracketKey) { out.push({ key: pendingBracketKey, value: '', raw: m[1].trim() }); }
      out.push({ key, value, raw: m[1].trim() });
      if (key) pendingBracketKey = null;
      continue;
    }

    // 续行 -> 追加到上一个 key
    if (pendingBracketKey) {
      out.push({ key: pendingBracketKey, value: line.trim(), raw: pendingBracketKey });
      pendingBracketKey = null;
    } else if (out.length && /^\s{2,}\S/.test(rawLine)) {
      const last = out[out.length - 1];
      last.value = `${last.value} ${line.trim()}`.trim();
    }
  }
  return out;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/**
 * 尽量把各种日期写法解析成 Date。
 * 支持:1995-08-14T04:00:00Z / 1995-08-14 / 14-Aug-1995 / 1995.08.14 /
 *       11-Mar-2003 05:00:00 UTC / 2024/01/01 / 14.08.1995
 */
function parseDate(input) {
  if (!input) return null;
  let s = String(input).replace(/\(.*?\)/g, '').trim();
  if (!s || /^(not disclosed|redacted|n\/a|none|null|-+)$/i.test(s)) return null;

  // ISO 8601(可能不带时区)
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?/.test(s)) {
    let iso = s.replace(' ', 'T');
    const dateOnly = iso.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!/T\d{2}:\d{2}/.test(iso)) {
      // 只有日期
      iso = `${dateOnly[1]}T00:00:00Z`;
    } else if (!/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) {
      // 注册局返回的裸时间一律是 UTC。不补 Z 的话 JS 会按"本地时间"解析,
      // 在东八区会导致所有 .cn/.jp 域名的注册时间整体偏移 8 小时。
      iso += 'Z';
    }
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // 14-Aug-1995 / 14 Aug 1995
  let m = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{2,4})/);
  if (m) {
    const day = +m[1];
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    let year = +m[3];
    if (year < 100) year += year > 70 ? 1900 : 2000;
    if (mon !== undefined) {
      const tm = s.match(/(\d{2}:\d{2}(:\d{2})?)/);
      const [hh, mm, ss] = tm ? tm[1].split(':').map(Number) : [0, 0, 0];
      return new Date(Date.UTC(year, mon, day, hh || 0, mm || 0, ss || 0));
    }
  }

  // 1995.08.14 / 1995/08/14
  m = s.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));

  // 14.08.1995
  m = s.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));

  // 纯年份
  m = s.match(/^(\d{4})$/);
  if (m) return new Date(Date.UTC(+m[1], 0, 1));

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const EPP_STATUS = {
  'client transfer prohibited': { zh: '客户端禁止转移', desc: '域名持有人/注册商锁定了转移,防止被恶意转出', type: 'ok' },
  'client update prohibited': { zh: '客户端禁止更新', desc: '禁止修改域名信息', type: 'ok' },
  'client delete prohibited': { zh: '客户端禁止删除', desc: '禁止删除该域名', type: 'ok' },
  'client renew prohibited': { zh: '客户端禁止续费', desc: '禁止续费该域名', type: 'ok' },
  'client hold': { zh: '客户端暂停解析', desc: '域名被暂停,不解析 DNS(通常因未验证邮箱或欠费)', type: 'warn' },
  'server transfer prohibited': { zh: '注册局禁止转移', desc: '注册局层面禁止转移', type: 'ok' },
  'server update prohibited': { zh: '注册局禁止更新', desc: '注册局层面禁止修改', type: 'ok' },
  'server delete prohibited': { zh: '注册局禁止删除', desc: '注册局层面禁止删除', type: 'ok' },
  'server renew prohibited': { zh: '注册局禁止续费', desc: '注册局层面禁止续费', type: 'ok' },
  'server hold': { zh: '注册局暂停解析', desc: '注册局暂停了域名解析', type: 'warn' },
  'pending create': { zh: '待创建', desc: '域名创建中', type: 'info' },
  'pending delete': { zh: '待删除', desc: '域名即将被删除释放', type: 'warn' },
  'pending renew': { zh: '待续费', desc: '续费处理中', type: 'info' },
  'pending transfer': { zh: '待转移', desc: '转移处理中', type: 'info' },
  'pending update': { zh: '待更新', desc: '更新处理中', type: 'info' },
  'redemption period': { zh: '赎回期', desc: '域名已过期,处于高价赎回期,原持有人可赎回', type: 'warn' },
  'auto renew period': { zh: '自动续费宽限期', desc: '注册局自动续费后的宽限期', type: 'info' },
  'add period': { zh: '新增宽限期', desc: '新注册后的可删除宽限期', type: 'info' },
  'renew period': { zh: '续费宽限期', desc: '续费后的可删除宽限期', type: 'info' },
  'transfer period': { zh: '转移宽限期', desc: '转移后的可删除宽限期', type: 'info' },
  'inactive': { zh: '未激活', desc: '域名没有配置可用的域名服务器', type: 'warn' },
  'active': { zh: '正常', desc: '域名状态正常', type: 'ok' },
  'ok': { zh: '正常', desc: '域名状态正常', type: 'ok' },
  'connect': { zh: '已连接', desc: '.cn 域名的正常状态', type: 'ok' },
  'free': { zh: '未注册', desc: '该域名可注册', type: 'info' },
  'blocked': { zh: '被保留', desc: '该域名被注册局保留,不可注册', type: 'warn' },
  'reserved': { zh: '保留', desc: '域名被保留', type: 'warn' },
  'registered': { zh: '已注册', desc: '域名已注册', type: 'ok' },
  'suspended': { zh: '已暂停', desc: '域名被暂停', type: 'warn' },
  'no_object': { zh: '不存在', desc: '.uk 域名未注册', type: 'info' },
  'available': { zh: '可注册', desc: '域名可注册', type: 'info' },
};

/** 把 "clientDeleteProhibited" / "client delete prohibited" / "CLIENT-DELETE-PROHIBITED" 统一成一种形式 */
function normalizeStatusToken(s) {
  return String(s)
    .replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, '') // 去掉 http://www.icann.org/epp#xxx
    .replace(/[^A-Za-z0-9]+/g, '')
    .toLowerCase();
}

function explainStatus(s) {
  const code = String(s).replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, '').replace(/[()]/g, '').replace(/\s{2,}/g, ' ').trim();
  const key = normalizeStatusToken(code);
  for (const [k, v] of Object.entries(EPP_STATUS)) {
    if (key === normalizeStatusToken(k)) return { code, ...v };
  }
  for (const [k, v] of Object.entries(EPP_STATUS)) {
    if (key.includes(normalizeStatusToken(k))) return { code, ...v };
  }
  return { code, zh: code, desc: '', type: 'info' };
}

function clean(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function isRedacted(v) {
  const s = clean(v);
  if (!s) return false;
  if (/^-+$/.test(s)) return true;
  if (/\bredact/i.test(s)) return true;
  if (/^(not disclosed|data protected|no data|anonymous|unknown|private|privacy|n\/a|none|null)$/i.test(s)) return true;
  if (/(statutory masking|withheld|for privacy purposes|privacy service|privacy protect|gdpr|masked|not available publicly)/i.test(s)) return true;
  return false;
}

/**
 * 解析 WHOIS 文本
 * @param {string} text
 * @param {string} domain
 * @returns {object} 结构化结果
 */
function parseWhois(text, domain = '') {
  const tokens = tokenize(text);
  const fields = {};
  const multi = {};

  for (const { key, value, raw } of tokens) {
    const field = KEYMAP.get(key) || KEYMAP.get(normKey(raw));
    if (!field) continue;
    const v = clean(value);
    if (!v) continue;
    if (field === 'status' || field === 'nameServer') {
      multi[field] = multi[field] || [];
      // 有些行是 "Domain Status: clientTransferProhibited https://..."  多个状态挤在一行
      const parts = v.split(/\s+(?=[a-z]*[A-Z])/).map((x) => x.trim()).filter(Boolean);
      for (const p of parts) {
        const cleaned = p
          .replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, '') // 去掉 EPP 参考链接
          .replace(/[()[\]]/g, '')                      // 去掉残留括号
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!cleaned || !/[A-Za-z0-9]/.test(cleaned)) continue;
        if (!multi[field].includes(cleaned)) multi[field].push(cleaned);
      }
    } else {
      if (fields[field] === undefined) fields[field] = v;
    }
  }

  // 有些注册局把 Name Server 写成多行重复
  const nameServers = (multi.nameServer || [])
    .map((ns) => ns.split(/\s+/)[0].toLowerCase().replace(/\.$/, ''))
    .filter((ns) => ns.includes('.'))
    .filter((ns, i, a) => a.indexOf(ns) === i);

  // 按归一化后的状态码去重(不同注册局大小写/空格写法不同)
  const statusSeen = new Set();
  const statuses = [];
  for (const s of multi.status || []) {
    const key = normalizeStatusToken(s);
    if (!key || statusSeen.has(key)) continue;
    statusSeen.add(key);
    statuses.push(explainStatus(s));
  }

  const created = parseDate(fields.created);
  const updated = parseDate(fields.updated);
  const expires = parseDate(fields.expires);

  const now = Date.now();
  const daysLeft = expires ? Math.floor((expires.getTime() - now) / 86400000) : null;
  const ageDays = created ? Math.floor((now - created.getTime()) / 86400000) : null;

  const registrant = {};
  for (const k of ['registrant', 'registrantEmail', 'registrantCountry']) {
    if (fields[k] && !isRedacted(fields[k])) {
      registrant[k === 'registrant' ? 'name' : k === 'registrantEmail' ? 'email' : 'country'] = fields[k];
    }
  }
  const registrantRedacted = fields.registrant ? isRedacted(fields.registrant) : false;

  // 判断域名是否已注册
  let registered = null;
  if (/no match|not found|no matching record|status:\s*free|no object found|no entries found/i.test(text)) {
    registered = false;
  } else if (created || fields.registrar || nameServers.length || statuses.length) {
    registered = true;
  }

  const dnssec = fields.dnssec && !/unsigned|no|none|absent/i.test(fields.dnssec)
    ? 'signed'
    : (fields.dnssec ? 'unsigned' : null);

  return {
    domain: fields.domain || domain,
    registered,
    created: created ? created.toISOString() : null,
    updated: updated ? updated.toISOString() : null,
    expires: expires ? expires.toISOString() : null,
    ageDays,
    daysLeft,
    statuses,
    nameServers,
    dnssec,
    registrant,
    registrantRedacted,
    registrar: {
      name: clean(fields.registrar) || null,
      url: clean(fields.registrarUrl) || null,
      ianaId: clean(fields.registrarIanaId) || null,
      abuseEmail: clean(fields.registrarAbuseEmail) || null,
      abusePhone: clean(fields.registrarAbusePhone) || null,
      whoisServer: clean(fields.registrarWhois) || null,
    },
    registryDomainId: clean(fields.registryDomainId) || null,
    rawFields: fields,
  };
}

module.exports = { parseWhois, parseDate, explainStatus, tokenize, EPP_STATUS };
