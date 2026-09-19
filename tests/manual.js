'use strict';
/* 手动联调脚本:node tests/manual.js [domain...] */

const path = require('path');
const { whoisLookup } = require(path.join(__dirname, '..', 'lib', 'whois'));
const { parseWhois } = require(path.join(__dirname, '..', 'lib', 'parse'));
const { normalizeDomain } = require(path.join(__dirname, '..', 'lib', 'domain'));

(async () => {
  const domains = process.argv.slice(2);
  const list = domains.length ? domains : ['example.com', 'google.cn', 'github.io'];

  for (const raw of list) {
    const norm = normalizeDomain(raw);
    console.log(`\n===== ${raw} =====`);
    if (!norm.ok) { console.log('规范化失败:', norm.error); continue; }
    console.log(`ascii=${norm.ascii} tld=${norm.tld} registrable=${norm.registrable}`);

    const t0 = Date.now();
    let r;
    try {
      r = await whoisLookup(norm.ascii);
    } catch (e) {
      console.log('查询抛错:', e.message);
      continue;
    }
    console.log(`ok=${r.ok} found=${r.found} 耗时=${Date.now() - t0}ms servers=${JSON.stringify(r.servers || [])}`);
    if (!r.ok) { console.log('错误:', r.error); continue; }

    const p = parseWhois(r.text, norm.ascii);
    console.log(JSON.stringify({
      registered: p.registered,
      created: p.created,
      expires: p.expires,
      daysLeft: p.daysLeft,
      ageDays: p.ageDays,
      registrar: p.registrar.name,
      registrarWhois: p.registrar.whoisServer,
      dnssec: p.dnssec,
      nameServers: p.nameServers.slice(0, 5),
      statuses: p.statuses.map((s) => s.code).slice(0, 5),
      registrantRedacted: p.registrantRedacted,
    }, null, 1));
  }
})();
