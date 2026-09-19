'use strict';

/**
 * 自动化测试 —— node tests/run.js
 * 默认只跑离线单元测试(快);
 * 加 --net 参数会额外跑真实网络查询测试(需要能访问 WHOIS/RDAP/DNS)。
 */

const { normalizeDomain, splitInputList } = require('../lib/domain');
const { parseWhois, parseDate, explainStatus } = require('../lib/parse');
const { isNotFound, findReferral } = require('../lib/whois');
const { ipIsNonPublic } = require('../lib/dns');
const { mergeInfo } = require('../lib/merge');
const { normalizeRdap } = require('../lib/rdap');

/* -------------------- 迷你测试框架 -------------------- */
let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass += 1;
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${name}\n`);
  } catch (err) {
    fail += 1;
    failures.push({ name, err });
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${name}\n      \x1b[31m${err.message}\x1b[0m\n`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    pass += 1;
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${name}\n`);
  } catch (err) {
    fail += 1;
    failures.push({ name, err });
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${name}\n      \x1b[31m${err.message}\x1b[0m\n`);
  }
}

function eq(actual, expected, label = '') {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label}期望 ${b},实际 ${a}`);
}
function ok(v, label = '') {
  if (!v) throw new Error(`${label}期望为真,实际 ${JSON.stringify(v)}`);
}
function section(t) {
  process.stdout.write(`\n\x1b[1m${t}\x1b[0m\n`);
}

/* ==================================================================
   1. 域名规范化
   ================================================================== */
section('1. 域名规范化 (lib/domain.js)');

test('基本域名', () => {
  const r = normalizeDomain('example.com');
  ok(r.ok);
  eq(r.ascii, 'example.com');
  eq(r.tld, 'com');
  eq(r.sld, 'example');
  eq(r.registrable, 'example.com');
});

test('大小写与首尾空白', () => {
  eq(normalizeDomain('  ExAmPle.COM  ').ascii, 'example.com');
});

test('带协议与路径的 URL', () => {
  eq(normalizeDomain('https://www.example.com/path?a=1#x').ascii, 'www.example.com');
});

test('带端口与用户名', () => {
  eq(normalizeDomain('http://user@example.com:8080/x').ascii, 'example.com');
});

test('尾部点(FQDN)', () => {
  eq(normalizeDomain('example.com.').ascii, 'example.com');
});

test('中文国际化域名 -> punycode', () => {
  const r = normalizeDomain('中国互联网络信息中心.中国');
  ok(r.ok);
  eq(r.ascii, 'xn--fiqa61au8b7zsevnm8ak20mc4a87e.xn--fiqs8s');
  eq(r.tld, 'xn--fiqs8s');
  eq(r.tldUnicode, '中国');
  eq(r.unicode, '中国互联网络信息中心.中国');
});

test('多级公共后缀 com.cn', () => {
  const r = normalizeDomain('www.example.com.cn');
  eq(r.registrable, 'example.com.cn');
  eq(r.sub, 'www');
  eq(r.tld, 'cn');
});

test('多级公共后缀 co.uk', () => {
  const r = normalizeDomain('shop.example.co.uk');
  eq(r.registrable, 'example.co.uk');
  eq(r.sub, 'shop');
});

test('子域提取', () => {
  const r = normalizeDomain('a.b.c.example.com');
  eq(r.sub, 'a.b.c');
  eq(r.registrable, 'example.com');
});

test('拒绝无 TLD 的输入', () => {
  eq(normalizeDomain('localhost').ok, false);
});

test('拒绝空输入', () => {
  eq(normalizeDomain('').ok, false);
  eq(normalizeDomain('   ').ok, false);
});

test('拒绝连续点', () => {
  eq(normalizeDomain('a..com').ok, false);
});

test('拒绝超长标签', () => {
  eq(normalizeDomain(`${'a'.repeat(64)}.com`).ok, false);
});

test('拒绝以连字符开头/结尾的标签', () => {
  eq(normalizeDomain('-bad.com').ok, false);
  eq(normalizeDomain('bad-.com').ok, false);
});

test('拒绝纯数字 TLD', () => {
  eq(normalizeDomain('example.123').ok, false);
});

test('允许标签中间的连字符与数字', () => {
  const r = normalizeDomain('my-site123.com');
  ok(r.ok);
  eq(r.sld, 'my-site123');
});

test('批量输入切分', () => {
  eq(splitInputList('a.com, b.net\nc.org;d.io  e.cn'), ['a.com', 'b.net', 'c.org', 'd.io', 'e.cn']);
});

test('非字符串输入不抛异常', () => {
  eq(normalizeDomain(null).ok, false);
  eq(normalizeDomain(undefined).ok, false);
  eq(normalizeDomain(123).ok, false);
});

/* ==================================================================
   2. 日期解析
   ================================================================== */
section('2. 日期解析 (lib/parse.js)');

function iso(d) { return d ? d.toISOString() : null; }

test('ISO 8601 带 Z', () => eq(iso(parseDate('1995-08-14T04:00:00Z')), '1995-08-14T04:00:00.000Z'));
test('ISO 8601 带毫秒', () => eq(iso(parseDate('2024-01-01T00:00:00.0Z')), '2024-01-01T00:00:00.000Z'));
test('纯日期', () => eq(iso(parseDate('2003-03-17')), '2003-03-17T00:00:00.000Z'));
test('日期时间空格分隔', () => eq(iso(parseDate('2003-03-17 12:20:05')), '2003-03-17T12:20:05.000Z'));
test('英文月份简写 14-Aug-1995', () => eq(iso(parseDate('14-Aug-1995')), '1995-08-14T00:00:00.000Z'));
test('英文月份带时间', () => eq(iso(parseDate('11-Mar-2003 05:00:00 UTC')), '2003-03-11T05:00:00.000Z'));
test('点分隔 1995.08.14', () => eq(iso(parseDate('1995.08.14')), '1995-08-14T00:00:00.000Z'));
test('欧洲格式 14.08.1995', () => eq(iso(parseDate('14.08.1995')), '1995-08-14T00:00:00.000Z'));
test('斜杠 2024/01/05', () => eq(iso(parseDate('2024/01/05')), '2024-01-05T00:00:00.000Z'));
test('带时区偏移', () => eq(iso(parseDate('2023-05-11T10:00:00+02:00')), '2023-05-11T08:00:00.000Z'));
test('两位年份 14-Aug-99', () => eq(iso(parseDate('14-Aug-99')), '1999-08-14T00:00:00.000Z'));
test('空值与脱敏值返回 null', () => {
  eq(parseDate(''), null);
  eq(parseDate(null), null);
  eq(parseDate('not disclosed'), null);
  eq(parseDate('REDACTED FOR PRIVACY'), null);
  eq(parseDate('   '), null);
});
test('2 月 30 日之类非法日期不崩溃', () => {
  const d = parseDate('2023-02-30');
  ok(d === null || d instanceof Date);
});

/* ==================================================================
   3. WHOIS 文本解析
   ================================================================== */
section('3. WHOIS 解析 (lib/parse.js)');

const FIXTURE_VERISIGN = `
   Domain Name: EXAMPLE.COM
   Registry Domain ID: 2336799_DOMAIN_COM-VRSN
   Registrar WHOIS Server: whois.iana.org
   Registrar URL: http://res-dom.iana.org
   Updated Date: 2026-08-14T08:01:43Z
   Creation Date: 1995-08-14T04:00:00Z
   Registry Expiry Date: 2027-08-13T04:00:00Z
   Registrar: RESERVED-Internet Assigned Numbers Authority
   Registrar IANA ID: 376
   Registrar Abuse Contact Email: abuse@iana.org
   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited
   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
   Domain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited
   Name Server: ELLIOTT.NS.CLOUDFLARE.COM
   Name Server: HERA.NS.CLOUDFLARE.COM
   DNSSEC: signedDelegation
>>> Last update of whois database: 2026-09-19T00:00:00Z <<<
`;

test('Verisign 风格:基本信息', () => {
  const p = parseWhois(FIXTURE_VERISIGN, 'example.com');
  eq(p.registered, true);
  eq(p.domain, 'EXAMPLE.COM');
  eq(p.registrar.name, 'RESERVED-Internet Assigned Numbers Authority');
  eq(p.registrar.ianaId, '376');
  eq(p.registrar.abuseEmail, 'abuse@iana.org');
  eq(p.registrar.whoisServer, 'whois.iana.org');
  eq(p.registryDomainId, '2336799_DOMAIN_COM-VRSN');
  eq(p.created, '1995-08-14T04:00:00.000Z');
  eq(p.expires, '2027-08-13T04:00:00.000Z');
});

test('Verisign 风格:状态码去掉 URL 与多余括号', () => {
  const p = parseWhois(FIXTURE_VERISIGN, 'example.com');
  eq(p.statuses.map((s) => s.code),
    ['clientDeleteProhibited', 'clientTransferProhibited', 'clientUpdateProhibited']);
  eq(p.statuses[0].zh, '客户端禁止删除');
  eq(p.statuses[1].zh, '客户端禁止转移');
});

test('Verisign 风格:NS 小写化并去重', () => {
  const p = parseWhois(FIXTURE_VERISIGN, 'example.com');
  eq(p.nameServers, ['elliott.ns.cloudflare.com', 'hera.ns.cloudflare.com']);
});

test('Verisign 风格:DNSSEC 判定', () => {
  eq(parseWhois(FIXTURE_VERISIGN, 'example.com').dnssec, 'signed');
  eq(parseWhois(FIXTURE_VERISIGN.replace('signedDelegation', 'unsigned'), 'example.com').dnssec, 'unsigned');
  eq(parseWhois(FIXTURE_VERISIGN.replace(/DNSSEC:.*/, ''), 'example.com').dnssec, null);
});

test('注释行(>>> 与 %)被忽略', () => {
  const p = parseWhois('>>> Last update: x\n% comment: y\nDomain Name: a.com\n', 'a.com');
  eq(p.domain, 'a.com');
});

const FIXTURE_CNNIC = `
Domain Name: google.cn
ROID: 20030317s10001s00054151-cn
Domain Status: clientDeleteProhibited
Domain Status: clientTransferProhibited
Registrant: 北京谷翔信息技术有限公司
Registrant Contact Email: dns-admin@google.com
Sponsoring Registrar: 厦门易名科技股份有限公司
Name Server: ns1.google.com
Name Server: ns2.google.com
Registration Time: 2003-03-17 12:20:05
Expiration Time: 2027-03-17 12:48:36
DNSSEC: unsigned
`;

test('CNNIC 风格:中文注册商与注册人', () => {
  const p = parseWhois(FIXTURE_CNNIC, 'google.cn');
  eq(p.registered, true);
  eq(p.registrar.name, '厦门易名科技股份有限公司');
  eq(p.registrant.name, '北京谷翔信息技术有限公司');
  eq(p.registrant.email, 'dns-admin@google.com');
  eq(p.registrantRedacted, false);
});

test('CNNIC 风格:Registration Time 被识别为注册时间', () => {
  const p = parseWhois(FIXTURE_CNNIC, 'google.cn');
  eq(p.created, '2003-03-17T12:20:05.000Z');
  eq(p.expires, '2027-03-17T12:48:36.000Z');
});

const FIXTURE_DENIC = `
Domain: denic.de
Status: connect
Nserver: ns1.denic.de
Nserver: ns2.denic.de
Changed: 2023-05-11T10:00:00+02:00
`;

test('DENIC 风格:小写 key 与 Status: connect', () => {
  const p = parseWhois(FIXTURE_DENIC, 'denic.de');
  eq(p.registered, true);
  eq(p.nameServers, ['ns1.denic.de', 'ns2.denic.de']);
  eq(p.updated, '2023-05-11T08:00:00.000Z');
  ok(p.statuses.some((s) => s.code.toLowerCase() === 'connect'));
  eq(p.statuses[0].zh, '已连接');
});

const FIXTURE_JPRS = `
[Domain Name]                   GOOGLE.JP
[Registrant]                    Google LLC
[Name Server]                   ns1.google.com
[Name Server]                   ns2.google.com
[Registration Date]             2001-03-22 00:00:00
[Expiration Date]               2026-03-31 00:00:00
[Last Update]                   2025-04-01 01:00:00
[State]                         Active
`;

test('JPRS 风格:方括号 key', () => {
  const p = parseWhois(FIXTURE_JPRS, 'google.jp');
  eq(p.registered, true);
  eq(p.domain, 'GOOGLE.JP');
  eq(p.nameServers, ['ns1.google.com', 'ns2.google.com']);
  eq(p.created, '2001-03-22T00:00:00.000Z');
  eq(p.expires, '2026-03-31T00:00:00.000Z');
  eq(p.updated, '2025-04-01T01:00:00.000Z');
  eq(p.registrant.name, 'Google LLC');
  ok(p.statuses.some((s) => s.code.toLowerCase() === 'active'));
});

test('未注册响应', () => {
  const p = parseWhois('No match for domain "NOPE12345.COM"\n>>> Last update <<<', 'nope12345.com');
  eq(p.registered, false);
  eq(p.created, null);
  eq(p.nameServers, []);
});

test('隐私脱敏的注册人', () => {
  const p = parseWhois('Registrant Organization: REDACTED FOR PRIVACY\nRegistrant Name: Not Disclosed', 'x.com');
  eq(p.registrantRedacted, true);
  eq(p.registrant.name, undefined);
});

test('EPP 状态中文解释覆盖常见状态', () => {
  eq(explainStatus('clientTransferProhibited').zh, '客户端禁止转移');
  eq(explainStatus('clientHold').zh, '客户端暂停解析');
  eq(explainStatus('serverHold').zh, '注册局暂停解析');
  eq(explainStatus('pendingDelete').zh, '待删除');
  eq(explainStatus('redemptionPeriod').zh, '赎回期');
  eq(explainStatus('active').zh, '正常');
  eq(explainStatus('inactive').zh, '未激活');
});

test('服务端返回的记录数与天数计算', () => {
  const p = parseWhois(FIXTURE_VERISIGN, 'example.com');
  ok(typeof p.ageDays === 'number' && p.ageDays > 10000, '年龄应超过 10000 天');
  ok(typeof p.daysLeft === 'number', '应计算出剩余天数');
});

test('空文本不抛异常', () => {
  const p = parseWhois('', 'x.com');
  eq(p.registered, null);
  eq(p.statuses, []);
  eq(p.nameServers, []);
});

test('非字符串输入不抛异常', () => {
  const p = parseWhois(null, 'x.com');
  eq(p.statuses, []);
});

/* ==================================================================
   4. 未注册判定 / 转介提取
   ================================================================== */
section('4. 未注册判定与转介提取 (lib/whois.js)');

test('识别各种"未注册"写法', () => {
  ok(isNotFound('No match for "X.COM"', 'com'));
  ok(isNotFound('Domain not found.', 'com'));
  ok(isNotFound('NOT FOUND', 'com'));
  ok(isNotFound('No entries found for the selected source(s).', 'com'));
  ok(isNotFound('Status: free', 'de'));
  ok(isNotFound('No matching record', 'cn'));
  ok(isNotFound('% No entries found', 'com'));
});

test('已注册响应不被误判为未注册', () => {
  eq(isNotFound(FIXTURE_VERISIGN, 'com'), false);
  eq(isNotFound(FIXTURE_CNNIC, 'cn'), false);
});

test('提取 refer 转介服务器', () => {
  const text = 'domain: COM\norganisation: VeriSign\nrefer: whois.verisign-grs.com\n';
  eq(findReferral(text, 'com'), 'whois.verisign-grs.com');
});

test('提取 Registrar WHOIS Server 并优先', () => {
  const text = 'Refer: whois.registry.example\nRegistrar WHOIS Server: whois.registrar.example\n';
  eq(findReferral(text, 'com'), 'whois.registrar.example');
});

test('忽略 iana.org 自转介', () => {
  eq(findReferral('refer: whois.iana.org\n', 'com'), null);
});

/* ==================================================================
   5. IP 分类(DNS 劫持检测)
   ================================================================== */
section('5. IP 分类 (lib/dns.js)');

test('识别私有与保留地址', () => {
  ok(ipIsNonPublic('10.0.0.1'));
  ok(ipIsNonPublic('192.168.1.1'));
  ok(ipIsNonPublic('172.16.0.1'));
  ok(ipIsNonPublic('172.31.255.255'));
  ok(ipIsNonPublic('127.0.0.1'));
  ok(ipIsNonPublic('169.254.1.1'));
  ok(ipIsNonPublic('198.18.0.2'), 'RFC 2544 基准测试段');
  ok(ipIsNonPublic('198.19.255.1'));
  ok(ipIsNonPublic('100.64.0.1'), 'CGNAT');
  ok(ipIsNonPublic('::1'));
  ok(ipIsNonPublic('fe80::1'));
});

test('公网地址不被误判', () => {
  eq(ipIsNonPublic('8.8.8.8'), false);
  eq(ipIsNonPublic('1.1.1.1'), false);
  eq(ipIsNonPublic('93.184.216.34'), false);
  eq(ipIsNonPublic('172.32.0.1'), false, '172.32 不属于私有段');
  eq(ipIsNonPublic('198.20.0.1'), false, '198.20 不属于基准测试段');
  eq(ipIsNonPublic('2606:4700::1111'), false);
});

/* ==================================================================
   6. 结果合并
   ================================================================== */
section('6. WHOIS + RDAP 合并 (lib/merge.js)');

const normCom = normalizeDomain('example.com');

test('RDAP 补全 WHOIS 缺失的字段', () => {
  const whoisParsed = parseWhois(FIXTURE_VERISIGN, 'example.com');
  const rdapParsed = {
    registered: true,
    created: '1995-08-14T04:00:00.000Z',
    expires: null,                    // WHOIS 有,RDAP 没有
    updated: null,
    dnssec: 'unsigned',               // WHOIS 是 signed,应以 WHOIS 为准
    statuses: ['client transfer prohibited', 'active'],
    nameServers: ['elliott.ns.cloudflare.com'],
    registrant: { name: 'Example Org', country: 'US' },
    registrantRedacted: false,
    registrar: { name: null, url: 'https://rdap.example', ianaId: null, abuseEmail: null, abusePhone: null, whoisServer: null },
    registryDomainId: null,
  };
  const m = mergeInfo(whoisParsed, rdapParsed, normCom);

  eq(m.expires, '2027-08-13T04:00:00.000Z', '到期时间应来自 WHOIS:');
  eq(m.dnssec, 'signed', 'DNSSEC 应以 WHOIS 为准:');
  eq(m.registrar.name, 'RESERVED-Internet Assigned Numbers Authority', '注册商名应来自 WHOIS:');
  eq(m.registrant.name, 'Example Org', '注册人应由 RDAP 补全:');
  eq(m.registrant.country, 'US', '注册人国家应由 RDAP 补全:');
  eq(m.sources, ['WHOIS', 'RDAP']);
});

test('冲突时 WHOIS 优先(RDAP 不覆盖已有值)', () => {
  const whoisParsed = parseWhois(FIXTURE_VERISIGN, 'example.com');
  const rdapParsed = {
    registered: true, statuses: [], nameServers: [], registrant: {}, registrantRedacted: false,
    registrar: { url: 'https://rdap.example' },
  };
  const m = mergeInfo(whoisParsed, rdapParsed, normCom);
  eq(m.registrar.url, 'http://res-dom.iana.org', 'WHOIS 已有网址时不应被 RDAP 覆盖:');
});

test('WHOIS 缺字段时由 RDAP 补全', () => {
  const whoisParsed = parseWhois('Domain Name: x.com\nRegistrar: A Registrar\n', 'x.com');
  const rdapParsed = {
    registered: true, statuses: [], nameServers: [], registrant: {}, registrantRedacted: false,
    registrar: { url: 'https://rdap.example', ianaId: '999' },
  };
  const m = mergeInfo(whoisParsed, rdapParsed, normalizeDomain('x.com'));
  eq(m.registrar.url, 'https://rdap.example');
  eq(m.registrar.ianaId, '999');
  eq(m.registrar.name, 'A Registrar');
});

test('状态去重且保留中文解释', () => {
  const whoisParsed = parseWhois(FIXTURE_VERISIGN, 'example.com');
  const rdapParsed = {
    statuses: ['clientTransferProhibited', 'client transfer prohibited', 'active'],
    nameServers: [], registrant: {}, registrar: {}, registered: true,
  };
  const m = mergeInfo(whoisParsed, rdapParsed, normCom);
  const codes = m.statuses.map((s) => s.code);
  ok(codes.includes('active'), '应保留 RDAP 独有的 active 状态');
  const transfer = m.statuses.filter((s) => /transfer/i.test(s.code));
  eq(transfer.length, 1, '重复的 transfer 状态应被去重:');
  eq(transfer[0].zh, '客户端禁止转移', '应保留 WHOIS 的中文解释:');
});

test('只有 WHOIS 时也能工作', () => {
  const m = mergeInfo(parseWhois(FIXTURE_VERISIGN, 'example.com'), null, normCom);
  eq(m.sources, ['WHOIS']);
  eq(m.created, '1995-08-14T04:00:00.000Z');
});

test('只有 RDAP 时也能工作', () => {
  const m = mergeInfo(null, {
    registered: true, created: '2020-01-01T00:00:00.000Z', expires: '2030-01-01T00:00:00.000Z',
    statuses: ['active'], nameServers: ['ns1.x.com'], registrar: { name: 'Reg' }, registrant: {},
  }, normalizeDomain('x.com'));
  eq(m.sources, ['RDAP']);
  eq(m.created, '2020-01-01T00:00:00.000Z');
  eq(m.registrar.name, 'Reg');
});

test('两者都为空时不抛异常', () => {
  const m = mergeInfo(null, null, normCom);
  eq(m.sources, []);
  eq(m.created, null);
  eq(m.nameServers, []);
});

/* ==================================================================
   7. RDAP 归一化
   ================================================================== */
section('7. RDAP 归一化 (lib/rdap.js)');

const RDAP_JSON = {
  objectClassName: 'domain',
  handle: '2336799_DOMAIN_COM-VRSN',
  ldhName: 'EXAMPLE.COM',
  status: ['client transfer prohibited', 'client delete prohibited'],
  events: [
    { eventAction: 'registration', eventDate: '1995-08-14T04:00:00Z' },
    { eventAction: 'expiration', eventDate: '2027-08-13T04:00:00Z' },
    { eventAction: 'last changed', eventDate: '2026-08-14T08:01:43Z' },
  ],
  nameservers: [{ ldhName: 'ELLIOTT.NS.CLOUDFLARE.COM' }, { ldhName: 'HERA.NS.CLOUDFLARE.COM' }],
  secureDNS: { delegationSigned: true },
  entities: [
    {
      roles: ['registrar'],
      vcardArray: ['vcard', [['fn', {}, 'text', 'Example Registrar Inc.'], ['email', {}, 'text', 'abuse@example.com']]],
      publicIds: [{ type: 'IANA Registrar ID', identifier: '1234' }],
      links: [{ href: 'https://example.com' }],
    },
    {
      roles: ['registrant'],
      vcardArray: ['vcard', [['fn', {}, 'text', 'John Doe'], ['adr', {}, 'text', ['', '', '', '', '', '', 'US']]]],
    },
  ],
};

test('RDAP:事件解析为注册/到期/更新', () => {
  const p = normalizeRdap(RDAP_JSON, 'example.com');
  eq(p.created, '1995-08-14T04:00:00Z');
  eq(p.expires, '2027-08-13T04:00:00Z');
  eq(p.updated, '2026-08-14T08:01:43Z');
});

test('RDAP:NS 小写去重', () => {
  const p = normalizeRdap(RDAP_JSON, 'example.com');
  eq(p.nameServers, ['elliott.ns.cloudflare.com', 'hera.ns.cloudflare.com']);
});

test('RDAP:注册商与注册人 vcard 解析', () => {
  const p = normalizeRdap(RDAP_JSON, 'example.com');
  eq(p.registrar.name, 'Example Registrar Inc.');
  eq(p.registrar.abuseEmail, 'abuse@example.com');
  eq(p.registrar.ianaId, '1234');
  eq(p.registrar.url, 'https://example.com');
  eq(p.registrant.name, 'John Doe');
  eq(p.registrant.country, 'US');
});

test('RDAP:DNSSEC 与 handle', () => {
  const p = normalizeRdap(RDAP_JSON, 'example.com');
  eq(p.dnssec, 'signed');
  eq(p.handle, '2336799_DOMAIN_COM-VRSN');
  eq(p.registered, true);
});

test('RDAP:空对象不抛异常', () => {
  const p = normalizeRdap({}, 'x.com');
  eq(p.domain, 'x.com');
  eq(p.nameServers, []);
  eq(p.statuses, []);
  eq(p.registrar.name, null);
});

/* ==================================================================
   8. 真实网络测试(可选)
   ================================================================== */
async function networkTests() {
  const { whoisLookup } = require('../lib/whois');
  const { rdapLookup } = require('../lib/rdap');
  const { dnsLookup } = require('../lib/dns');
  const { checkAvailability } = require('../lib/availability');

  section('8. 真实网络查询(--net)');

  await testAsync('WHOIS: example.com', async () => {
    const r = await whoisLookup('example.com', { deep: false });
    ok(r.ok, `查询失败: ${r.error}`);
    eq(r.found, true);
    ok(r.text.includes('EXAMPLE.COM') || r.text.includes('example.com'), '响应中应含域名');
  });

  await testAsync('WHOIS: 不存在的域名返回 found=false', async () => {
    const r = await whoisLookup('this-definitely-does-not-exist-9f8a7b6c5d.com', { deep: false });
    ok(r.ok, `查询失败: ${r.error}`);
    eq(r.found, false);
  });

  await testAsync('WHOIS: .cn 走 whois.cnnic.cn', async () => {
    const r = await whoisLookup('google.cn', { deep: false });
    ok(r.ok, `查询失败: ${r.error}`);
    eq(r.found, true);
    ok((r.servers || []).some((s) => s.includes('cnnic')), `服务器应为 cnnic,实际 ${JSON.stringify(r.servers)}`);
  });

  await testAsync('RDAP: example.com 结构化数据', async () => {
    const r = await rdapLookup('example.com');
    ok(r.ok, `查询失败: ${r.error}`);
    eq(r.found, true);
    ok(r.parsed.created, '应有注册时间');
  });

  await testAsync('DNS: example.com 有 NS 委派', async () => {
    const r = await dnsLookup('example.com', { types: ['NS', 'SOA'] });
    ok(r.hasDelegation, '应有 NS/SOA 委派');
  });

  await testAsync('可用性:已注册域名判为不可注册', async () => {
    const r = await checkAvailability('example.com');
    eq(r.available, false);
    eq(r.confidence, 'high');
  });

  await testAsync('可用性:不存在域名判为可注册', async () => {
    const r = await checkAvailability('this-definitely-does-not-exist-9f8a7b6c5d.com');
    eq(r.available, true);
    eq(r.confidence, 'high');
  });

  await testAsync('可用性:不受 DNS 劫持影响(A 记录不足以判定已注册)', async () => {
    // 即使本地 DNS 把不存在的域名解析到某个地址,也不应改变判定
    const r = await checkAvailability('another-fake-domain-3d4e5f6a7b.com');
    eq(r.available, true, `应判定为可注册,实际 evidence: ${JSON.stringify(r.evidence)}`);
  });
}

/* -------------------- 主流程 -------------------- */
(async () => {
  if (process.argv.includes('--net')) {
    await networkTests();
  } else {
    section('提示');
    process.stdout.write('  跳过网络测试。加 --net 参数可运行真实 WHOIS/RDAP/DNS 查询测试。\n');
  }

  process.stdout.write(`\n${'─'.repeat(60)}\n`);
  if (fail === 0) {
    process.stdout.write(`\x1b[32m\x1b[1m全部通过\x1b[0m  ${pass} 项测试\n\n`);
  } else {
    process.stdout.write(`\x1b[31m\x1b[1m${fail} 项失败\x1b[0m,${pass} 项通过\n`);
    for (const f of failures) process.stdout.write(`  \x1b[31m✗\x1b[0m ${f.name}\n    ${f.err.message}\n`);
    process.stdout.write('\n');
  }
  process.exit(fail === 0 ? 0 : 1);
})();
