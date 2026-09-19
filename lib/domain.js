'use strict';

const { domainToASCII, domainToUnicode } = require('url');
const { TLDS } = require('./tld-servers');

/** 常见的多级公共后缀(用于正确提取可注册域名 registrable domain) */
const MULTI_SUFFIXES = new Set([
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn', 'mil.cn',
  'bj.cn', 'sh.cn', 'gd.cn', 'zj.cn', 'js.cn', 'sd.cn', 'hb.cn', 'hn.cn',
  'sc.cn', 'fj.cn', 'ah.cn', 'jx.cn', 'ln.cn', 'jl.cn', 'hl.cn', 'sx.cn',
  'gs.cn', 'qh.cn', 'nx.cn', 'xj.cn', 'xz.cn', 'yn.cn', 'gz.cn', 'gx.cn',
  'hi.cn', 'tj.cn', 'cq.cn', 'he.cn', 'nm.cn', 'mo.cn', 'tw.cn', 'hk.cn',
  'co.uk', 'org.uk', 'me.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au', 'asn.au',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp', 'ad.jp', 'ed.jp', 'gr.jp', 'lg.jp',
  'co.kr', 'ne.kr', 'or.kr', 're.kr', 'pe.kr', 'go.kr', 'ac.kr', 'mil.kr',
  'com.tw', 'net.tw', 'org.tw', 'edu.tw', 'gov.tw', 'idv.tw', 'club.tw',
  'com.hk', 'net.hk', 'org.hk', 'edu.hk', 'gov.hk', 'idv.hk',
  'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg', 'per.sg',
  'com.my', 'net.my', 'org.my', 'edu.my', 'gov.my',
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  'com.mx', 'net.mx', 'org.mx', 'edu.mx', 'gob.mx',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'geek.nz', 'school.nz',
  'co.za', 'net.za', 'org.za', 'gov.za', 'ac.za', 'web.za',
  'com.ar', 'net.ar', 'org.ar', 'gov.ar', 'edu.ar',
  'com.tr', 'net.tr', 'org.tr', 'gov.tr', 'edu.tr', 'web.tr',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'ac.in', 'edu.in', 'gov.in', 'res.in',
  'com.pk', 'net.pk', 'org.pk', 'edu.pk', 'gov.pk',
  'com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn',
  'co.th', 'in.th', 'ac.th', 'go.th', 'or.th', 'net.th',
  'com.ph', 'net.ph', 'org.ph', 'edu.ph', 'gov.ph',
  'co.id', 'or.id', 'ac.id', 'go.id', 'web.id', 'sch.id', 'my.id',
  'com.ua', 'net.ua', 'org.ua', 'edu.ua', 'gov.ua', 'in.ua',
  'com.ru', 'net.ru', 'org.ru', 'msk.ru', 'spb.ru',
  'com.pl', 'net.pl', 'org.pl', 'edu.pl', 'gov.pl', 'waw.pl',
  'co.il', 'org.il', 'net.il', 'ac.il', 'gov.il', 'muni.il',
  'com.sa', 'net.sa', 'org.sa', 'edu.sa', 'gov.sa', 'med.sa',
  'com.eg', 'net.eg', 'org.eg', 'edu.eg', 'gov.eg',
  'co.ke', 'or.ke', 'ne.ke', 'go.ke', 'ac.ke',
  'com.ng', 'net.ng', 'org.ng', 'edu.ng', 'gov.ng',
  'com.gh', 'net.gh', 'org.gh', 'edu.gh', 'gov.gh',
  'co.tz', 'or.tz', 'ne.tz', 'go.tz', 'ac.tz',
  'com.et', 'com.co', 'com.pe', 'com.ve', 'com.uy', 'com.ec', 'com.bo',
  'co.at', 'or.at', 'ac.at', 'gv.at',
  'co.hu', 'org.hu', 'com.es', 'nom.es', 'org.es', 'gob.es', 'edu.es',
  'com.pt', 'org.pt', 'edu.pt', 'gov.pt', 'net.pt',
  'com.gr', 'org.gr', 'net.gr', 'edu.gr', 'gov.gr',
  'com.ro', 'org.ro', 'nt.ro', 'nom.ro', 'info.ro',
  'com.hr', 'com.si', 'com.ba', 'org.ba', 'gov.ba',
  'co.rs', 'org.rs', 'edu.rs', 'in.rs',
  'com.mo', 'org.mo', 'net.mo', 'edu.mo', 'gov.mo',
  'com.kw', 'com.qa', 'com.om', 'com.bh', 'com.jo', 'com.lb',
  'co.ae', 'net.ae', 'org.ae', 'ac.ae', 'gov.ae', 'sch.ae',
  'com.np', 'com.bd', 'com.lk', 'com.mm', 'com.kh', 'com.la',
  'co.jp', 'ne.jp', 'com.mt', 'com.cy', 'com.is',
  'gouv.fr', 'asso.fr', 'com.fr', 'tm.fr', 'prd.fr', 'presse.fr',
]);

/** 两字母国家代码集合(用于粗略判断) */
function isTwoLetterCc(s) {
  return /^[a-z]{2}$/.test(s);
}

/**
 * 规范化用户输入的域名。
 * 支持:https://example.com/path?a=1、example.com.、Example.COM、中文域名
 * @returns {{ok:true, ascii:string, unicode:string, tld:string, sld:string, sub:string, registrable:string}
 *          | {ok:false, error:string}}
 */
function normalizeDomain(input) {
  if (typeof input !== 'string') return { ok: false, error: '输入必须是字符串' };

  let s = input.trim();
  if (!s) return { ok: false, error: '域名为空' };

  // 去掉 URL 外壳
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    try {
      s = new URL(s).hostname;
    } catch {
      s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    }
  }
  s = s.split('/')[0].split('?')[0].split('#')[0];
  s = s.split('@').pop();          // 去掉 user@
  s = s.replace(/:\d+$/, '');      // 去掉端口
  s = s.replace(/^\.+|\.+$/g, ''); // 去掉首尾点
  s = s.trim();

  if (!s) return { ok: false, error: '无法从输入中解析出域名' };

  // 转 punycode(可正确处理中文、emoji 等)
  const ascii = domainToASCII(s);
  if (!ascii) return { ok: false, error: `域名 "${input}" 不是合法的国际化域名` };

  const lower = ascii.toLowerCase();

  // 校验标签
  if (lower.length > 253) return { ok: false, error: '域名总长度超过 253 个字符' };
  const labels = lower.split('.');
  if (labels.length < 2) return { ok: false, error: '请输入完整域名(例如 example.com)' };
  for (const lab of labels) {
    if (!lab) return { ok: false, error: '域名中存在连续的点' };
    if (lab.length > 63) return { ok: false, error: `标签 "${lab}" 超过 63 个字符` };
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(lab)) {
      return { ok: false, error: `标签 "${lab}" 含非法字符(只允许字母、数字、连字符,且不能以连字符开头或结尾)` };
    }
  }
  if (!/^[a-z0-9-]+$/.test(labels[labels.length - 1])) {
    return { ok: false, error: '顶级域不合法' };
  }
  if (/^\d+$/.test(labels[labels.length - 1])) {
    return { ok: false, error: '顶级域不能是纯数字' };
  }

  // 提取后缀 / 主域 / 子域
  const last2 = labels.slice(-2).join('.');
  let suffixLen = 1;
  if (MULTI_SUFFIXES.has(last2)) suffixLen = 2;

  const tld = labels.slice(-1)[0];
  const sld = labels.slice(-2)[0];
  const sub = labels.length > suffixLen + 1 ? labels.slice(0, labels.length - suffixLen - 1).join('.') : '';
  const registrable = labels.slice(-(suffixLen + 1)).join('.');

  let unicode = lower;
  try { unicode = domainToUnicode(lower); } catch { /* 保持 ascii */ }

  const tldUnicode = unicode.split('.').pop();

  return {
    ok: true,
    ascii: lower,
    unicode,
    tld,
    tldUnicode: tldUnicode !== tld ? tldUnicode : null,
    sld,
    sub,
    registrable,
  };
}

/** 判断一个 TLD 是否有已知的 WHOIS 服务器 */
function hasKnownTld(tld) {
  return Object.prototype.hasOwnProperty.call(TLDS, tld);
}

/** 把用户输入的一批文本拆成候选域名列表 */
function splitInputList(text) {
  return String(text || '')
    .split(/[\s,;\r\n\t]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

module.exports = { normalizeDomain, hasKnownTld, splitInputList, MULTI_SUFFIXES, isTwoLetterCc };
