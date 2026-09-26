/* 域名查询工具 桌面版(轻量,系统浏览器内核) · 由 tools/build-web.js 生成 */
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// lib/tld-servers.js
var require_tld_servers = __commonJS({
  "lib/tld-servers.js"(exports2, module2) {
    "use strict";
    var TLDS = {
      // ---- 通用顶级域 gTLD ----
      com: "whois.verisign-grs.com",
      net: "whois.verisign-grs.com",
      org: "whois.pir.org",
      info: "whois.afilias.net",
      biz: "whois.nic.biz",
      name: "whois.nic.name",
      pro: "whois.afilias.net",
      mobi: "whois.nic.mobi",
      asia: "whois.nic.asia",
      tel: "whois.nic.tel",
      xxx: "whois.nic.xxx",
      travel: "whois.nic.travel",
      jobs: "whois.nic.jobs",
      cat: "whois.nic.cat",
      coop: "whois.nic.coop",
      aero: "whois.aero",
      museum: "whois.museum",
      // ---- 新通用顶级域 new gTLD ----
      app: "whois.nic.google",
      dev: "whois.nic.google",
      page: "whois.nic.google",
      new: "whois.nic.google",
      day: "whois.nic.google",
      how: "whois.nic.google",
      so: "whois.nic.so",
      xyz: "whois.nic.xyz",
      top: "whois.nic.top",
      club: "whois.nic.club",
      online: "whois.nic.online",
      site: "whois.nic.site",
      shop: "whois.nic.shop",
      store: "whois.nic.store",
      tech: "whois.nic.tech",
      space: "whois.nic.space",
      website: "whois.nic.website",
      press: "whois.nic.press",
      host: "whois.nic.host",
      fun: "whois.nic.fun",
      icu: "whois.nic.icu",
      vip: "whois.nic.vip",
      wang: "whois.nic.wang",
      ren: "whois.nic.ren",
      art: "whois.nic.art",
      blog: "whois.nic.blog",
      cloud: "whois.nic.cloud",
      design: "whois.nic.design",
      email: "whois.nic.email",
      live: "whois.nic.live",
      ltd: "whois.nic.ltd",
      media: "whois.nic.media",
      network: "whois.nic.network",
      news: "whois.nic.news",
      one: "whois.nic.one",
      pub: "whois.nic.pub",
      rocks: "whois.nic.rocks",
      run: "whois.nic.run",
      software: "whois.nic.software",
      studio: "whois.nic.studio",
      systems: "whois.nic.systems",
      today: "whois.nic.today",
      tools: "whois.nic.tools",
      wiki: "whois.nic.wiki",
      work: "whois.nic.work",
      world: "whois.nic.world",
      zone: "whois.nic.zone",
      agency: "whois.nic.agency",
      company: "whois.nic.company",
      digital: "whois.nic.digital",
      group: "whois.nic.group",
      life: "whois.nic.life",
      link: "whois.nic.link",
      money: "whois.nic.money",
      plus: "whois.nic.plus",
      team: "whois.nic.team",
      center: "whois.nic.center",
      city: "whois.nic.city",
      education: "whois.nic.education",
      finance: "whois.nic.finance",
      foundation: "whois.nic.foundation",
      institute: "whois.nic.institute",
      international: "whois.nic.international",
      marketing: "whois.nic.marketing",
      solutions: "whois.nic.solutions",
      support: "whois.nic.support",
      training: "whois.nic.training",
      ventures: "whois.nic.ventures",
      codes: "whois.nic.codes",
      computer: "whois.nic.computer",
      directory: "whois.nic.directory",
      graphics: "whois.nic.graphics",
      management: "whois.nic.management",
      photos: "whois.nic.photos",
      pictures: "whois.nic.pictures",
      services: "whois.nic.services",
      social: "whois.nic.social",
      tips: "whois.nic.tips",
      // ---- 国家/地区顶级域 ccTLD ----
      cn: "whois.cnnic.cn",
      "\u4E2D\u56FD": "whois.cnnic.cn",
      "\u516C\u53F8": "whois.cnnic.cn",
      "\u7F51\u7EDC": "whois.cnnic.cn",
      tw: "whois.twnic.net.tw",
      hk: "whois.hkirc.hk",
      mo: "whois.monic.mo",
      jp: "whois.jprs.jp",
      kr: "whois.kr",
      sg: "whois.sgnic.sg",
      my: "whois.mynic.my",
      th: "whois.thnic.co.th",
      vn: "whois.vnnic.vn",
      ph: "whois.dot.ph",
      id: "whois.id",
      in: "whois.registry.in",
      pk: "whois.pknic.net.pk",
      bd: "whois.btcl.net.bd",
      lk: "whois.nic.lk",
      np: "whois.nic.np",
      io: "whois.nic.io",
      ai: "whois.nic.ai",
      co: "whois.nic.co",
      me: "whois.nic.me",
      tv: "whois.nic.tv",
      cc: "ccwhois.verisign-grs.com",
      ws: "whois.website.ws",
      ly: "whois.nic.ly",
      us: "whois.nic.us",
      ca: "whois.cira.ca",
      mx: "whois.mx",
      br: "whois.registro.br",
      ar: "whois.nic.ar",
      cl: "whois.nic.cl",
      pe: "whois.rcp.net.pe",
      ve: "whois.nic.ve",
      uy: "whois.nic.org.uy",
      ru: "whois.tcinet.ru",
      su: "whois.tcinet.ru",
      ua: "whois.ua",
      by: "whois.by",
      kz: "whois.nic.kz",
      uz: "whois.cctld.uz",
      am: "whois.amnic.net",
      ge: "whois.nic.ge",
      az: "whois.az",
      tr: "whois.trabis.gov.tr",
      il: "whois.isoc.org.il",
      sa: "whois.nic.net.sa",
      ae: "whois.aeda.net.ae",
      qa: "whois.registry.qa",
      kw: "whois.kw",
      om: "whois.registry.om",
      bh: "whois.nic.bh",
      jo: "whois.nic.jo",
      lb: "whois.nic.lb",
      eg: "whois.ripe.net",
      za: "whois.registry.net.za",
      ng: "whois.nic.net.ng",
      ke: "whois.kenic.or.ke",
      gh: "whois.nic.gh",
      tz: "whois.tznic.or.tz",
      ug: "whois.co.ug",
      ma: "whois.registre.ma",
      tn: "whois.ati.tn",
      dz: "whois.nic.dz",
      eu: "whois.eu",
      uk: "whois.nic.uk",
      de: "whois.denic.de",
      fr: "whois.nic.fr",
      nl: "whois.domain-registry.nl",
      be: "whois.dns.be",
      it: "whois.nic.it",
      es: "whois.nic.es",
      pt: "whois.dns.pt",
      pl: "whois.dns.pl",
      cz: "whois.nic.cz",
      sk: "whois.sk-nic.sk",
      hu: "whois.nic.hu",
      ro: "whois.rotld.ro",
      bg: "whois.register.bg",
      gr: "whois.nic.gr",
      hr: "whois.dns.hr",
      si: "whois.si",
      rs: "whois.rnids.rs",
      ba: "whois.biz.ba",
      mk: "whois.marnet.mk",
      al: "whois.aknet.org.al",
      md: "whois.nic.md",
      lt: "whois.domreg.lt",
      lv: "whois.nic.lv",
      ee: "whois.tld.ee",
      fi: "whois.fi",
      se: "whois.iis.se",
      no: "whois.norid.no",
      dk: "whois.dk-hostmaster.dk",
      is: "whois.isnic.is",
      ie: "whois.weare.ie",
      ch: "whois.nic.ch",
      li: "whois.nic.li",
      at: "whois.nic.at",
      lu: "whois.dns.lu",
      mt: "whois.nic.org.mt",
      cy: "whois.nic.cy",
      au: "whois.auda.org.au",
      nz: "whois.srs.net.nz",
      // ---- 基础设施 ----
      arpa: "whois.iana.org",
      int: "whois.iana.org",
      edu: "whois.educause.edu",
      gov: "whois.dotgov.gov",
      mil: "whois.nic.mil"
    };
    var QUERY_PREFIX = {
      "whois.denic.de": "-T dn,ace ",
      "whois.nic.fr": "",
      "whois.dns.be": "",
      "whois.nic.it": "",
      "whois.nic.cz": ""
    };
    var REFERRAL_FOLLOW = /* @__PURE__ */ new Set([
      "whois.verisign-grs.com",
      "whois.pir.org",
      "whois.nic.io",
      "whois.nic.co",
      "whois.nic.me",
      "whois.nic.tv",
      "ccwhois.verisign-grs.com",
      "whois.nic.us",
      "whois.afilias.net",
      "whois.nic.biz"
    ]);
    var REGISTRY_ONLY = /* @__PURE__ */ new Set([
      "whois.verisign-grs.com",
      "ccwhois.verisign-grs.com",
      "whois.pir.org",
      "whois.nic.io",
      "whois.nic.co",
      "whois.nic.me",
      "whois.nic.tv"
    ]);
    module2.exports = { TLDS, QUERY_PREFIX, REFERRAL_FOLLOW, REGISTRY_ONLY };
  }
});

// lib/domain.js
var require_domain = __commonJS({
  "lib/domain.js"(exports2, module2) {
    "use strict";
    var { domainToASCII, domainToUnicode } = require("url");
    var { TLDS } = require_tld_servers();
    var MULTI_SUFFIXES = /* @__PURE__ */ new Set([
      "com.cn",
      "net.cn",
      "org.cn",
      "gov.cn",
      "edu.cn",
      "ac.cn",
      "mil.cn",
      "bj.cn",
      "sh.cn",
      "gd.cn",
      "zj.cn",
      "js.cn",
      "sd.cn",
      "hb.cn",
      "hn.cn",
      "sc.cn",
      "fj.cn",
      "ah.cn",
      "jx.cn",
      "ln.cn",
      "jl.cn",
      "hl.cn",
      "sx.cn",
      "gs.cn",
      "qh.cn",
      "nx.cn",
      "xj.cn",
      "xz.cn",
      "yn.cn",
      "gz.cn",
      "gx.cn",
      "hi.cn",
      "tj.cn",
      "cq.cn",
      "he.cn",
      "nm.cn",
      "mo.cn",
      "tw.cn",
      "hk.cn",
      "co.uk",
      "org.uk",
      "me.uk",
      "ac.uk",
      "gov.uk",
      "ltd.uk",
      "plc.uk",
      "net.uk",
      "sch.uk",
      "com.au",
      "net.au",
      "org.au",
      "edu.au",
      "gov.au",
      "id.au",
      "asn.au",
      "co.jp",
      "ne.jp",
      "or.jp",
      "ac.jp",
      "go.jp",
      "ad.jp",
      "ed.jp",
      "gr.jp",
      "lg.jp",
      "co.kr",
      "ne.kr",
      "or.kr",
      "re.kr",
      "pe.kr",
      "go.kr",
      "ac.kr",
      "mil.kr",
      "com.tw",
      "net.tw",
      "org.tw",
      "edu.tw",
      "gov.tw",
      "idv.tw",
      "club.tw",
      "com.hk",
      "net.hk",
      "org.hk",
      "edu.hk",
      "gov.hk",
      "idv.hk",
      "com.sg",
      "net.sg",
      "org.sg",
      "edu.sg",
      "gov.sg",
      "per.sg",
      "com.my",
      "net.my",
      "org.my",
      "edu.my",
      "gov.my",
      "com.br",
      "net.br",
      "org.br",
      "gov.br",
      "edu.br",
      "com.mx",
      "net.mx",
      "org.mx",
      "edu.mx",
      "gob.mx",
      "co.nz",
      "net.nz",
      "org.nz",
      "govt.nz",
      "ac.nz",
      "geek.nz",
      "school.nz",
      "co.za",
      "net.za",
      "org.za",
      "gov.za",
      "ac.za",
      "web.za",
      "com.ar",
      "net.ar",
      "org.ar",
      "gov.ar",
      "edu.ar",
      "com.tr",
      "net.tr",
      "org.tr",
      "gov.tr",
      "edu.tr",
      "web.tr",
      "co.in",
      "net.in",
      "org.in",
      "gen.in",
      "firm.in",
      "ind.in",
      "ac.in",
      "edu.in",
      "gov.in",
      "res.in",
      "com.pk",
      "net.pk",
      "org.pk",
      "edu.pk",
      "gov.pk",
      "com.vn",
      "net.vn",
      "org.vn",
      "edu.vn",
      "gov.vn",
      "co.th",
      "in.th",
      "ac.th",
      "go.th",
      "or.th",
      "net.th",
      "com.ph",
      "net.ph",
      "org.ph",
      "edu.ph",
      "gov.ph",
      "co.id",
      "or.id",
      "ac.id",
      "go.id",
      "web.id",
      "sch.id",
      "my.id",
      "com.ua",
      "net.ua",
      "org.ua",
      "edu.ua",
      "gov.ua",
      "in.ua",
      "com.ru",
      "net.ru",
      "org.ru",
      "msk.ru",
      "spb.ru",
      "com.pl",
      "net.pl",
      "org.pl",
      "edu.pl",
      "gov.pl",
      "waw.pl",
      "co.il",
      "org.il",
      "net.il",
      "ac.il",
      "gov.il",
      "muni.il",
      "com.sa",
      "net.sa",
      "org.sa",
      "edu.sa",
      "gov.sa",
      "med.sa",
      "com.eg",
      "net.eg",
      "org.eg",
      "edu.eg",
      "gov.eg",
      "co.ke",
      "or.ke",
      "ne.ke",
      "go.ke",
      "ac.ke",
      "com.ng",
      "net.ng",
      "org.ng",
      "edu.ng",
      "gov.ng",
      "com.gh",
      "net.gh",
      "org.gh",
      "edu.gh",
      "gov.gh",
      "co.tz",
      "or.tz",
      "ne.tz",
      "go.tz",
      "ac.tz",
      "com.et",
      "com.co",
      "com.pe",
      "com.ve",
      "com.uy",
      "com.ec",
      "com.bo",
      "co.at",
      "or.at",
      "ac.at",
      "gv.at",
      "co.hu",
      "org.hu",
      "com.es",
      "nom.es",
      "org.es",
      "gob.es",
      "edu.es",
      "com.pt",
      "org.pt",
      "edu.pt",
      "gov.pt",
      "net.pt",
      "com.gr",
      "org.gr",
      "net.gr",
      "edu.gr",
      "gov.gr",
      "com.ro",
      "org.ro",
      "nt.ro",
      "nom.ro",
      "info.ro",
      "com.hr",
      "com.si",
      "com.ba",
      "org.ba",
      "gov.ba",
      "co.rs",
      "org.rs",
      "edu.rs",
      "in.rs",
      "com.mo",
      "org.mo",
      "net.mo",
      "edu.mo",
      "gov.mo",
      "com.kw",
      "com.qa",
      "com.om",
      "com.bh",
      "com.jo",
      "com.lb",
      "co.ae",
      "net.ae",
      "org.ae",
      "ac.ae",
      "gov.ae",
      "sch.ae",
      "com.np",
      "com.bd",
      "com.lk",
      "com.mm",
      "com.kh",
      "com.la",
      "co.jp",
      "ne.jp",
      "com.mt",
      "com.cy",
      "com.is",
      "gouv.fr",
      "asso.fr",
      "com.fr",
      "tm.fr",
      "prd.fr",
      "presse.fr"
    ]);
    function isTwoLetterCc(s) {
      return /^[a-z]{2}$/.test(s);
    }
    function normalizeDomain(input) {
      if (typeof input !== "string") return { ok: false, error: "\u8F93\u5165\u5FC5\u987B\u662F\u5B57\u7B26\u4E32" };
      let s = input.trim();
      if (!s) return { ok: false, error: "\u57DF\u540D\u4E3A\u7A7A" };
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
        try {
          s = new URL(s).hostname;
        } catch {
          s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
        }
      }
      s = s.split("/")[0].split("?")[0].split("#")[0];
      s = s.split("@").pop();
      s = s.replace(/:\d+$/, "");
      s = s.replace(/^\.+|\.+$/g, "");
      s = s.trim();
      if (!s) return { ok: false, error: "\u65E0\u6CD5\u4ECE\u8F93\u5165\u4E2D\u89E3\u6790\u51FA\u57DF\u540D" };
      const ascii = domainToASCII(s);
      if (!ascii) return { ok: false, error: `\u57DF\u540D "${input}" \u4E0D\u662F\u5408\u6CD5\u7684\u56FD\u9645\u5316\u57DF\u540D` };
      const lower = ascii.toLowerCase();
      if (lower.length > 253) return { ok: false, error: "\u57DF\u540D\u603B\u957F\u5EA6\u8D85\u8FC7 253 \u4E2A\u5B57\u7B26" };
      const labels = lower.split(".");
      if (labels.length < 2) return { ok: false, error: "\u8BF7\u8F93\u5165\u5B8C\u6574\u57DF\u540D(\u4F8B\u5982 example.com)" };
      for (const lab of labels) {
        if (!lab) return { ok: false, error: "\u57DF\u540D\u4E2D\u5B58\u5728\u8FDE\u7EED\u7684\u70B9" };
        if (lab.length > 63) return { ok: false, error: `\u6807\u7B7E "${lab}" \u8D85\u8FC7 63 \u4E2A\u5B57\u7B26` };
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(lab)) {
          return { ok: false, error: `\u6807\u7B7E "${lab}" \u542B\u975E\u6CD5\u5B57\u7B26(\u53EA\u5141\u8BB8\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26,\u4E14\u4E0D\u80FD\u4EE5\u8FDE\u5B57\u7B26\u5F00\u5934\u6216\u7ED3\u5C3E)` };
        }
      }
      if (!/^[a-z0-9-]+$/.test(labels[labels.length - 1])) {
        return { ok: false, error: "\u9876\u7EA7\u57DF\u4E0D\u5408\u6CD5" };
      }
      if (/^\d+$/.test(labels[labels.length - 1])) {
        return { ok: false, error: "\u9876\u7EA7\u57DF\u4E0D\u80FD\u662F\u7EAF\u6570\u5B57" };
      }
      const last2 = labels.slice(-2).join(".");
      let suffixLen = 1;
      if (MULTI_SUFFIXES.has(last2)) suffixLen = 2;
      const tld = labels.slice(-1)[0];
      const sld = labels.slice(-2)[0];
      const sub = labels.length > suffixLen + 1 ? labels.slice(0, labels.length - suffixLen - 1).join(".") : "";
      const registrable = labels.slice(-(suffixLen + 1)).join(".");
      let unicode = lower;
      try {
        unicode = domainToUnicode(lower);
      } catch {
      }
      const tldUnicode = unicode.split(".").pop();
      return {
        ok: true,
        ascii: lower,
        unicode,
        tld,
        tldUnicode: tldUnicode !== tld ? tldUnicode : null,
        sld,
        sub,
        registrable
      };
    }
    function hasKnownTld(tld) {
      return Object.prototype.hasOwnProperty.call(TLDS, tld);
    }
    function splitInputList(text) {
      return String(text || "").split(/[\s,;\r\n\t]+/).map((x) => x.trim()).filter(Boolean);
    }
    module2.exports = { normalizeDomain, hasKnownTld, splitInputList, MULTI_SUFFIXES, isTwoLetterCc };
  }
});

// lib/whois.js
var require_whois = __commonJS({
  "lib/whois.js"(exports2, module2) {
    "use strict";
    var net = require("net");
    var { TLDS, QUERY_PREFIX, REGISTRY_ONLY } = require_tld_servers();
    var DEFAULT_TIMEOUT = 15e3;
    var MAX_RESPONSE = 2 * 1024 * 1024;
    var MIN_INTERVAL = 900;
    var hostState = /* @__PURE__ */ new Map();
    function throttle(host) {
      const st = hostState.get(host) || { last: 0, chain: Promise.resolve() };
      const wait = Math.max(0, st.last - Date.now() + MIN_INTERVAL);
      const p = st.chain.then(() => new Promise((r) => setTimeout(r, wait)));
      st.chain = p.catch(() => {
      });
      st.last = Date.now() + wait;
      hostState.set(host, st);
      return p;
    }
    function rawWhois(host, query, { timeout = DEFAULT_TIMEOUT, port = 43 } = {}) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        let settled = false;
        const done = (fn, arg) => {
          if (!settled) {
            settled = true;
            fn(arg);
          }
        };
        const socket = net.createConnection({ host, port });
        socket.setTimeout(timeout);
        socket.on("connect", () => {
          const prefix = QUERY_PREFIX[host] ?? "";
          socket.write(`${prefix}${query}\r
`);
        });
        socket.on("data", (buf) => {
          total += buf.length;
          if (total > MAX_RESPONSE) {
            socket.destroy();
            return done(resolve, Buffer.concat(chunks).toString("utf8"));
          }
          chunks.push(buf);
        });
        socket.on("end", () => done(resolve, Buffer.concat(chunks).toString("utf8")));
        socket.on("close", () => done(resolve, Buffer.concat(chunks).toString("utf8")));
        socket.on("timeout", () => {
          socket.destroy();
          done(reject, new Error(`\u8FDE\u63A5 ${host} \u8D85\u65F6(${timeout}ms)`));
        });
        socket.on("error", (err) => {
          socket.destroy();
          done(reject, new Error(`\u8FDE\u63A5 ${host} \u5931\u8D25: ${err.message}`));
        });
      });
    }
    function isNotFound(text, tld) {
      if (!text) return false;
      const t = text.toLowerCase();
      const patterns = [
        /no match for/,
        /^not found/,
        /\nnot found/,
        /no data found/,
        /domain not found/,
        /is not registered/,
        /not registered/,
        /no entries found/,
        /no object found/,
        /status:\s*free/,
        /% no entries found/,
        /no information available/,
        /the queried object does not exist/,
        /domain .* not found/,
        /object does not exist/,
        /no matching record/,
        /nothing found/
      ];
      if (patterns.some((re) => re.test(t))) return true;
      if (tld === "cn" && /no matching record/.test(t)) return true;
      return false;
    }
    function isRateLimited(text) {
      if (!text) return false;
      return /(connection limit exceeded|too many requests|rate limit|quota exceeded|exceeded the maximum|try again later|access denied for frequent|blocked)/i.test(text);
    }
    function findReferral(text, tld) {
      const lines = String(text || "").split(/\r?\n/);
      const candidates = [];
      for (const line of lines) {
        const m = line.match(/^\s*(refer|whois server|registrar whois server|whois)\s*:\s*(\S+)/i);
        if (m) {
          const host = m[2].trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          if (host && host.includes(".") && !/^(whois\.)?iana\.org$/.test(host)) {
            if (/registrar whois server/i.test(m[1])) candidates.unshift(host);
            else candidates.push(host);
          }
        }
      }
      return candidates[0] || null;
    }
    function extractWhoisServerField(text) {
      const m = String(text || "").match(/^\s*(?:registrar )?whois server\s*:\s*(\S+)/im);
      return m ? m[1].trim().toLowerCase() : null;
    }
    async function whoisLookup(domain, opts = {}) {
      const { maxHops = 3, deep = true, timeout = DEFAULT_TIMEOUT } = opts;
      const tld = domain.split(".").pop();
      const steps = [];
      let server = TLDS[tld] || null;
      let text = "";
      let hops = 0;
      let rateLimitRetries = 0;
      const visited = /* @__PURE__ */ new Set();
      if (!server) {
        try {
          const ianaText = await rawWhois("whois.iana.org", domain, { timeout });
          steps.push({ server: "whois.iana.org", role: "iana", ok: true, bytes: ianaText.length });
          server = findReferral(ianaText, tld);
          if (!server) {
            return {
              ok: false,
              domain,
              steps,
              error: `IANA \u672A\u63D0\u4F9B .${tld} \u7684 WHOIS \u670D\u52A1\u5668(\u8BE5\u540E\u7F00\u53EF\u80FD\u4E0D\u652F\u6301 WHOIS \u67E5\u8BE2,\u53EF\u5C1D\u8BD5 RDAP)`
            };
          }
        } catch (err) {
          steps.push({ server: "whois.iana.org", role: "iana", ok: false, error: err.message });
          return { ok: false, domain, steps, error: `\u65E0\u6CD5\u8FDE\u63A5 IANA WHOIS:${err.message}` };
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
          steps.push({ server, role: hops === 1 ? "registry" : "registrar", ok: false, error: err.message });
          if (hops === 1) {
            try {
              const ianaText = await rawWhois("whois.iana.org", domain, { timeout });
              const alt = findReferral(ianaText, tld);
              if (alt && alt !== server) {
                steps.push({ server: "whois.iana.org", role: "iana", ok: true, bytes: ianaText.length });
                server = alt;
                continue;
              }
            } catch {
            }
          }
          return { ok: false, domain, steps, error: err.message };
        }
        if (isRateLimited(resp) && rateLimitRetries < 2) {
          rateLimitRetries += 1;
          steps.push({ server, role: hops === 1 ? "registry" : "registrar", ok: false, error: "\u88AB\u9650\u6D41,\u91CD\u8BD5\u4E2D" });
          await new Promise((r) => setTimeout(r, 1500 * rateLimitRetries));
          hops -= 1;
          visited.delete(server);
          continue;
        }
        steps.push({
          server,
          role: hops === 1 ? "registry" : "registrar",
          ok: true,
          bytes: resp.length,
          rateLimited: isRateLimited(resp) || void 0
        });
        text = text ? `${text}

${"-".repeat(60)}

${resp}` : resp;
        if (isNotFound(resp, tld)) {
          return { ok: true, domain, found: false, server, text, steps, raw: resp };
        }
        if (isRateLimited(resp)) {
          return { ok: true, domain, found: null, server, text, steps, raw: resp, notice: "\u6CE8\u518C\u5C40\u9650\u6D41,\u7ED3\u679C\u53EF\u80FD\u4E0D\u5B8C\u6574" };
        }
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
        steps
      };
    }
    module2.exports = { whoisLookup, rawWhois, isNotFound, isRateLimited, findReferral };
  }
});

// lib/parse.js
var require_parse = __commonJS({
  "lib/parse.js"(exports2, module2) {
    "use strict";
    var ALIASES = {
      domain: ["domain name", "domain", "domainname", "domain name:", "ascii domain", "domain names"],
      registrar: ["registrar", "sponsoring registrar", "registrar name", "registrar organization", "record maintained by"],
      registrarUrl: ["registrar url", "registrar website", "registrarurl"],
      registrarIanaId: ["registrar iana id", "iana id", "registrar id"],
      registrarAbuseEmail: ["registrar abuse contact email", "abuse contact email", "abuse-mailbox"],
      registrarAbusePhone: ["registrar abuse contact phone", "abuse contact phone", "abuse phone"],
      created: [
        "creation date",
        "created",
        "created on",
        "created date",
        "registration date",
        "registration time",
        "registered on",
        "registered",
        "domain registration date",
        "created date:",
        "activation date",
        "registered date"
      ],
      updated: [
        "updated date",
        "last updated",
        "last update",
        "modified",
        "changed",
        "updated",
        "last modified",
        "last update date",
        "domain last updated date"
      ],
      expires: [
        "registry expiry date",
        "registrar registration expiration date",
        "expiry date",
        "expiration date",
        "expiration time",
        "expires",
        "expire date",
        "expiry",
        "paid-till",
        "renewal date",
        "valid until",
        "domain expiration date"
      ],
      status: ["domain status", "status", "registration status", "domain statuses", "state", "domain state"],
      nameServer: ["name server", "nserver", "nameserver", "name servers", "nameservers", "ns"],
      dnssec: ["dnssec", "dnssec status", "ds record"],
      registrant: [
        "registrant",
        "registrant name",
        "registrant organization",
        "registrant org",
        "registrant contact",
        "registrant name (english)",
        "holder",
        "org"
      ],
      registrantEmail: ["registrant email", "registrant contact email", "email"],
      registrantCountry: ["registrant country", "registrant country/economy", "country"],
      registrarWhois: ["registrar whois server", "whois server", "refer"],
      registryDomainId: ["registry domain id", "domain id"],
      domainAge: ["domain age"]
    };
    function buildLookup() {
      const map = /* @__PURE__ */ new Map();
      for (const [field, names] of Object.entries(ALIASES)) {
        for (const n of names) map.set(n.toLowerCase().replace(/[_\s]+/g, " ").replace(/:$/, "").trim(), field);
      }
      return map;
    }
    var KEYMAP = buildLookup();
    function normKey(k) {
      return k.replace(/^\[|\]$/g, "").replace(/[_\s]+/g, " ").replace(/:+$/, "").trim().toLowerCase();
    }
    function tokenize(text) {
      const out = [];
      const lines = String(text || "").split(/\r?\n/);
      let pendingBracketKey = null;
      for (const rawLine of lines) {
        const line = rawLine.replace(/\u0000/g, "").trimEnd();
        if (!line.trim()) continue;
        if (/^[%#>]/.test(line.trim()) && !/^%\s*\w+\s*:/.test(line)) continue;
        if (/^>>>|^NOTICE:|^TERMS OF USE|^URL of the ICANN|^For more information on Whois/i.test(line.trim())) continue;
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
          if (!value && pendingBracketKey) {
            out.push({ key: pendingBracketKey, value: "", raw: m[1].trim() });
          }
          out.push({ key, value, raw: m[1].trim() });
          if (key) pendingBracketKey = null;
          continue;
        }
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
    var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    function parseDate(input) {
      if (!input) return null;
      let s = String(input).replace(/\(.*?\)/g, "").trim();
      if (!s || /^(not disclosed|redacted|n\/a|none|null|-+)$/i.test(s)) return null;
      if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?/.test(s)) {
        let iso = s.replace(" ", "T");
        const dateOnly = iso.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!/T\d{2}:\d{2}/.test(iso)) {
          iso = `${dateOnly[1]}T00:00:00Z`;
        } else if (!/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) {
          iso += "Z";
        }
        const d2 = new Date(iso);
        if (!Number.isNaN(d2.getTime())) return d2;
      }
      let m = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{2,4})/);
      if (m) {
        const day = +m[1];
        const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
        let year = +m[3];
        if (year < 100) year += year > 70 ? 1900 : 2e3;
        if (mon !== void 0) {
          const tm = s.match(/(\d{2}:\d{2}(:\d{2})?)/);
          const [hh, mm, ss] = tm ? tm[1].split(":").map(Number) : [0, 0, 0];
          return new Date(Date.UTC(year, mon, day, hh || 0, mm || 0, ss || 0));
        }
      }
      m = s.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})/);
      if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      m = s.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})/);
      if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
      m = s.match(/^(\d{4})$/);
      if (m) return new Date(Date.UTC(+m[1], 0, 1));
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    var EPP_STATUS = {
      "client transfer prohibited": { zh: "\u5BA2\u6237\u7AEF\u7981\u6B62\u8F6C\u79FB", desc: "\u57DF\u540D\u6301\u6709\u4EBA/\u6CE8\u518C\u5546\u9501\u5B9A\u4E86\u8F6C\u79FB,\u9632\u6B62\u88AB\u6076\u610F\u8F6C\u51FA", type: "ok" },
      "client update prohibited": { zh: "\u5BA2\u6237\u7AEF\u7981\u6B62\u66F4\u65B0", desc: "\u7981\u6B62\u4FEE\u6539\u57DF\u540D\u4FE1\u606F", type: "ok" },
      "client delete prohibited": { zh: "\u5BA2\u6237\u7AEF\u7981\u6B62\u5220\u9664", desc: "\u7981\u6B62\u5220\u9664\u8BE5\u57DF\u540D", type: "ok" },
      "client renew prohibited": { zh: "\u5BA2\u6237\u7AEF\u7981\u6B62\u7EED\u8D39", desc: "\u7981\u6B62\u7EED\u8D39\u8BE5\u57DF\u540D", type: "ok" },
      "client hold": { zh: "\u5BA2\u6237\u7AEF\u6682\u505C\u89E3\u6790", desc: "\u57DF\u540D\u88AB\u6682\u505C,\u4E0D\u89E3\u6790 DNS(\u901A\u5E38\u56E0\u672A\u9A8C\u8BC1\u90AE\u7BB1\u6216\u6B20\u8D39)", type: "warn" },
      "server transfer prohibited": { zh: "\u6CE8\u518C\u5C40\u7981\u6B62\u8F6C\u79FB", desc: "\u6CE8\u518C\u5C40\u5C42\u9762\u7981\u6B62\u8F6C\u79FB", type: "ok" },
      "server update prohibited": { zh: "\u6CE8\u518C\u5C40\u7981\u6B62\u66F4\u65B0", desc: "\u6CE8\u518C\u5C40\u5C42\u9762\u7981\u6B62\u4FEE\u6539", type: "ok" },
      "server delete prohibited": { zh: "\u6CE8\u518C\u5C40\u7981\u6B62\u5220\u9664", desc: "\u6CE8\u518C\u5C40\u5C42\u9762\u7981\u6B62\u5220\u9664", type: "ok" },
      "server renew prohibited": { zh: "\u6CE8\u518C\u5C40\u7981\u6B62\u7EED\u8D39", desc: "\u6CE8\u518C\u5C40\u5C42\u9762\u7981\u6B62\u7EED\u8D39", type: "ok" },
      "server hold": { zh: "\u6CE8\u518C\u5C40\u6682\u505C\u89E3\u6790", desc: "\u6CE8\u518C\u5C40\u6682\u505C\u4E86\u57DF\u540D\u89E3\u6790", type: "warn" },
      "pending create": { zh: "\u5F85\u521B\u5EFA", desc: "\u57DF\u540D\u521B\u5EFA\u4E2D", type: "info" },
      "pending delete": { zh: "\u5F85\u5220\u9664", desc: "\u57DF\u540D\u5373\u5C06\u88AB\u5220\u9664\u91CA\u653E", type: "warn" },
      "pending renew": { zh: "\u5F85\u7EED\u8D39", desc: "\u7EED\u8D39\u5904\u7406\u4E2D", type: "info" },
      "pending transfer": { zh: "\u5F85\u8F6C\u79FB", desc: "\u8F6C\u79FB\u5904\u7406\u4E2D", type: "info" },
      "pending update": { zh: "\u5F85\u66F4\u65B0", desc: "\u66F4\u65B0\u5904\u7406\u4E2D", type: "info" },
      "redemption period": { zh: "\u8D4E\u56DE\u671F", desc: "\u57DF\u540D\u5DF2\u8FC7\u671F,\u5904\u4E8E\u9AD8\u4EF7\u8D4E\u56DE\u671F,\u539F\u6301\u6709\u4EBA\u53EF\u8D4E\u56DE", type: "warn" },
      "auto renew period": { zh: "\u81EA\u52A8\u7EED\u8D39\u5BBD\u9650\u671F", desc: "\u6CE8\u518C\u5C40\u81EA\u52A8\u7EED\u8D39\u540E\u7684\u5BBD\u9650\u671F", type: "info" },
      "add period": { zh: "\u65B0\u589E\u5BBD\u9650\u671F", desc: "\u65B0\u6CE8\u518C\u540E\u7684\u53EF\u5220\u9664\u5BBD\u9650\u671F", type: "info" },
      "renew period": { zh: "\u7EED\u8D39\u5BBD\u9650\u671F", desc: "\u7EED\u8D39\u540E\u7684\u53EF\u5220\u9664\u5BBD\u9650\u671F", type: "info" },
      "transfer period": { zh: "\u8F6C\u79FB\u5BBD\u9650\u671F", desc: "\u8F6C\u79FB\u540E\u7684\u53EF\u5220\u9664\u5BBD\u9650\u671F", type: "info" },
      "inactive": { zh: "\u672A\u6FC0\u6D3B", desc: "\u57DF\u540D\u6CA1\u6709\u914D\u7F6E\u53EF\u7528\u7684\u57DF\u540D\u670D\u52A1\u5668", type: "warn" },
      "active": { zh: "\u6B63\u5E38", desc: "\u57DF\u540D\u72B6\u6001\u6B63\u5E38", type: "ok" },
      "ok": { zh: "\u6B63\u5E38", desc: "\u57DF\u540D\u72B6\u6001\u6B63\u5E38", type: "ok" },
      "connect": { zh: "\u5DF2\u8FDE\u63A5", desc: ".cn \u57DF\u540D\u7684\u6B63\u5E38\u72B6\u6001", type: "ok" },
      "free": { zh: "\u672A\u6CE8\u518C", desc: "\u8BE5\u57DF\u540D\u53EF\u6CE8\u518C", type: "info" },
      "blocked": { zh: "\u88AB\u4FDD\u7559", desc: "\u8BE5\u57DF\u540D\u88AB\u6CE8\u518C\u5C40\u4FDD\u7559,\u4E0D\u53EF\u6CE8\u518C", type: "warn" },
      "reserved": { zh: "\u4FDD\u7559", desc: "\u57DF\u540D\u88AB\u4FDD\u7559", type: "warn" },
      "registered": { zh: "\u5DF2\u6CE8\u518C", desc: "\u57DF\u540D\u5DF2\u6CE8\u518C", type: "ok" },
      "suspended": { zh: "\u5DF2\u6682\u505C", desc: "\u57DF\u540D\u88AB\u6682\u505C", type: "warn" },
      "no_object": { zh: "\u4E0D\u5B58\u5728", desc: ".uk \u57DF\u540D\u672A\u6CE8\u518C", type: "info" },
      "available": { zh: "\u53EF\u6CE8\u518C", desc: "\u57DF\u540D\u53EF\u6CE8\u518C", type: "info" }
    };
    function normalizeStatusToken(s) {
      return String(s).replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, "").replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
    }
    function explainStatus(s) {
      const code = String(s).replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, "").replace(/[()]/g, "").replace(/\s{2,}/g, " ").trim();
      const key = normalizeStatusToken(code);
      for (const [k, v] of Object.entries(EPP_STATUS)) {
        if (key === normalizeStatusToken(k)) return { code, ...v };
      }
      for (const [k, v] of Object.entries(EPP_STATUS)) {
        if (key.includes(normalizeStatusToken(k))) return { code, ...v };
      }
      return { code, zh: code, desc: "", type: "info" };
    }
    function clean(v) {
      if (v === void 0 || v === null) return "";
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
    function parseWhois(text, domain = "") {
      const tokens = tokenize(text);
      const fields = {};
      const multi = {};
      for (const { key, value, raw } of tokens) {
        const field = KEYMAP.get(key) || KEYMAP.get(normKey(raw));
        if (!field) continue;
        const v = clean(value);
        if (!v) continue;
        if (field === "status" || field === "nameServer") {
          multi[field] = multi[field] || [];
          const parts = v.split(/\s+(?=[a-z]*[A-Z])/).map((x) => x.trim()).filter(Boolean);
          for (const p of parts) {
            const cleaned = p.replace(/\(?\s*https?:\/\/[^\s)]+\)?/gi, "").replace(/[()[\]]/g, "").replace(/\s{2,}/g, " ").trim();
            if (!cleaned || !/[A-Za-z0-9]/.test(cleaned)) continue;
            if (!multi[field].includes(cleaned)) multi[field].push(cleaned);
          }
        } else {
          if (fields[field] === void 0) fields[field] = v;
        }
      }
      const nameServers = (multi.nameServer || []).map((ns) => ns.split(/\s+/)[0].toLowerCase().replace(/\.$/, "")).filter((ns) => ns.includes(".")).filter((ns, i, a) => a.indexOf(ns) === i);
      const statusSeen = /* @__PURE__ */ new Set();
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
      const daysLeft = expires ? Math.floor((expires.getTime() - now) / 864e5) : null;
      const ageDays = created ? Math.floor((now - created.getTime()) / 864e5) : null;
      const registrant = {};
      for (const k of ["registrant", "registrantEmail", "registrantCountry"]) {
        if (fields[k] && !isRedacted(fields[k])) {
          registrant[k === "registrant" ? "name" : k === "registrantEmail" ? "email" : "country"] = fields[k];
        }
      }
      const registrantRedacted = fields.registrant ? isRedacted(fields.registrant) : false;
      let registered = null;
      if (/no match|not found|no matching record|status:\s*free|no object found|no entries found/i.test(text)) {
        registered = false;
      } else if (created || fields.registrar || nameServers.length || statuses.length) {
        registered = true;
      }
      const dnssec = fields.dnssec && !/unsigned|no|none|absent/i.test(fields.dnssec) ? "signed" : fields.dnssec ? "unsigned" : null;
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
          whoisServer: clean(fields.registrarWhois) || null
        },
        registryDomainId: clean(fields.registryDomainId) || null,
        rawFields: fields
      };
    }
    module2.exports = { parseWhois, parseDate, explainStatus, tokenize, EPP_STATUS };
  }
});

// lib/rdap.js
var require_rdap = __commonJS({
  "lib/rdap.js"(exports2, module2) {
    "use strict";
    var BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
    var BOOTSTRAP_TTL = 24 * 60 * 60 * 1e3;
    var bootstrapCache = { at: 0, map: null };
    var FALLBACK = {
      com: "https://rdap.verisign.com/com/v1",
      net: "https://rdap.verisign.com/net/v1",
      org: "https://rdap.publicinterestregistry.org/rdap",
      info: "https://rdap.identitydigital.services/rdap",
      biz: "https://rdap.nic.biz",
      io: "https://rdap.nic.io",
      co: "https://rdap.nic.co",
      me: "https://rdap.nic.me",
      tv: "https://rdap.nic.tv",
      cc: "https://rdap.verisign.com/cc/v1",
      xyz: "https://rdap.centralnic.com/xyz",
      app: "https://rdap.nic.google",
      dev: "https://rdap.nic.google",
      page: "https://rdap.nic.google",
      cn: "https://rdap.cnnic.cn/rdap",
      uk: "https://rdap.nominet.uk/uk",
      de: "https://rdap.denic.de",
      nl: "https://rdap.dnsbelgium.be/domain",
      fr: "https://rdap.nic.fr",
      eu: "https://rdap.eu",
      it: "https://rdap.nic.it",
      es: "https://rdap.nic.es",
      pl: "https://rdap.dns.pl",
      cz: "https://rdap.nic.cz",
      se: "https://rdap.iis.se",
      no: "https://rdap.norid.no",
      dk: "https://rdap.dk-hostmaster.dk",
      fi: "https://rdap.fi",
      ch: "https://rdap.nic.ch",
      at: "https://rdap.nic.at",
      be: "https://rdap.dnsbelgium.be/domain",
      jp: "https://rdap.jprs.jp",
      kr: "https://rdap.kr",
      tw: "https://rdap.twnic.tw",
      hk: "https://rdap.hkirc.hk",
      sg: "https://rdap.sgnic.sg",
      in: "https://rdap.registry.in",
      au: "https://rdap.auda.org.au",
      nz: "https://rdap.srs.net.nz",
      ca: "https://rdap.ca.fury.ca/rdap",
      br: "https://rdap.registro.br",
      mx: "https://rdap.mx",
      ai: "https://rdap.identitydigital.services/rdap",
      id: "https://rdap.pandi.id",
      vn: "https://rdap.vnnic.vn",
      th: "https://rdap.thnic.net",
      ru: "https://rdap.tcinet.ru",
      ua: "https://rdap.ua",
      tr: "https://rdap.trabis.gov.tr",
      il: "https://rdap.isoc.org.il",
      za: "https://rdap.registry.net.za",
      us: "https://rdap.nic.us",
      top: "https://rdap.centralnic.com/top",
      site: "https://rdap.centralnic.com/site",
      online: "https://rdap.centralnic.com/online",
      club: "https://rdap.centralnic.com/club",
      shop: "https://rdap.centralnic.com/shop",
      store: "https://rdap.centralnic.com/store",
      tech: "https://rdap.centralnic.com/tech",
      space: "https://rdap.centralnic.com/space",
      website: "https://rdap.centralnic.com/website",
      press: "https://rdap.centralnic.com/press",
      host: "https://rdap.centralnic.com/host",
      fun: "https://rdap.centralnic.com/fun",
      icu: "https://rdap.centralnic.com/icu",
      vip: "https://rdap.centralnic.com/vip",
      wang: "https://rdap.centralnic.com/wang",
      ren: "https://rdap.centralnic.com/ren"
    };
    async function loadBootstrap() {
      if (bootstrapCache.map && Date.now() - bootstrapCache.at < BOOTSTRAP_TTL) {
        return bootstrapCache.map;
      }
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1e4);
        const res = await fetch(BOOTSTRAP_URL, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const map = {};
        for (const [tlds, urls] of json.services || []) {
          const base = (urls || []).find((u) => u.startsWith("https://")) || (urls || [])[0];
          if (!base) continue;
          for (const t of tlds) map[String(t).toLowerCase()] = base.replace(/\/$/, "");
        }
        bootstrapCache = { at: Date.now(), map };
        return map;
      } catch {
        return null;
      }
    }
    async function findRdapServer(tld) {
      const boot = await loadBootstrap();
      if (boot && boot[tld]) return { base: boot[tld], source: "iana-bootstrap" };
      if (FALLBACK[tld]) return { base: FALLBACK[tld], source: "builtin" };
      return null;
    }
    function parseVcard(vcardArray) {
      const out = {};
      if (!Array.isArray(vcardArray) || !Array.isArray(vcardArray[1])) return out;
      for (const item of vcardArray[1]) {
        if (!Array.isArray(item) || item.length < 4) continue;
        const [name, , , value] = item;
        if (name === "fn" || name === "org") out[name === "fn" ? "name" : "org"] = Array.isArray(value) ? value.join(" ") : value;
        if (name === "email") out.email = value;
        if (name === "tel") out.phone = value;
        if (name === "adr") {
          const arr = Array.isArray(value) ? value : [];
          out.country = arr[arr.length - 1] || arr[6] || "";
          out.address = arr.filter(Boolean).join(", ");
        }
      }
      return out;
    }
    function normalizeRdap(json, domain) {
      const events = {};
      for (const e of json.events || []) {
        if (e && e.eventAction) events[e.eventAction] = e.eventDate;
      }
      const created = events.registration || null;
      const expires = events.expiration || null;
      const updated = events["last changed"] || events["last update of RDAP database"] || null;
      const now = Date.now();
      const daysLeft = expires ? Math.floor((new Date(expires).getTime() - now) / 864e5) : null;
      const ageDays = created ? Math.floor((now - new Date(created).getTime()) / 864e5) : null;
      const nameServers = [...new Set((json.nameservers || []).map((n) => String(n.ldhName || "").toLowerCase().replace(/\.$/, "")).filter((n) => n.includes(".")))];
      const statuses = (json.status || []).map((s) => String(s));
      let registrar = { name: null, url: null, ianaId: null, abuseEmail: null, abusePhone: null, whoisServer: null };
      let registrant = {};
      let registrantRedacted = false;
      for (const ent of json.entities || []) {
        const roles = ent.roles || [];
        const vc = parseVcard(ent.vcardArray);
        if (roles.includes("registrar")) {
          registrar = {
            name: vc.name || vc.org || null,
            url: (ent.links || []).map((l) => l.href).find(Boolean) || null,
            ianaId: (ent.publicIds || []).map((p) => p.identifier).find(Boolean) || null,
            abuseEmail: vc.email || null,
            abusePhone: vc.phone || null,
            whoisServer: null
          };
        }
        if (roles.includes("registrant")) {
          const redacted = JSON.stringify(ent).includes("redacted");
          if (redacted && !vc.name && !vc.org) {
            registrantRedacted = true;
          }
          registrant = {
            name: vc.name || vc.org || null,
            email: vc.email || null,
            country: vc.country || null
          };
        }
      }
      const secureDNS = json.secureDNS;
      const dnssec = secureDNS ? secureDNS.delegationSigned ? "signed" : "unsigned" : null;
      return {
        source: "RDAP",
        domain: json.ldhName ? String(json.ldhName).toLowerCase() : domain,
        registered: json.objectClassName === "domain" ? true : null,
        created,
        expires,
        updated,
        daysLeft,
        ageDays,
        statuses,
        nameServers,
        dnssec,
        registrant,
        registrantRedacted,
        registrar,
        registryDomainId: json.handle || null,
        handle: json.handle || null
      };
    }
    async function rdapLookup(domain, opts = {}) {
      const { timeout = 12e3 } = opts;
      const tld = domain.split(".").pop();
      const server = await findRdapServer(tld);
      if (!server) {
        return { ok: false, domain, error: `\u672A\u627E\u5230 .${tld} \u7684 RDAP \u670D\u52A1\u5730\u5740` };
      }
      const url = `${server.base}/domain/${encodeURIComponent(domain)}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { accept: "application/rdap+json, application/json" }
        });
        clearTimeout(timer);
        if (res.status === 404) {
          let body = null;
          try {
            body = await res.json();
          } catch {
          }
          return { ok: true, domain, found: false, source: "RDAP", server: server.base, url, errorCode: body && body.errorCode };
        }
        if (!res.ok) {
          let body = null;
          try {
            body = await res.json();
          } catch {
          }
          return {
            ok: false,
            domain,
            server: server.base,
            url,
            error: `RDAP \u8FD4\u56DE HTTP ${res.status}${body && body.title ? `: ${body.title}` : ""}`
          };
        }
        const json = await res.json();
        const parsed = normalizeRdap(json, domain);
        return { ok: true, domain, found: true, server: server.base, serverSource: server.source, url, json, parsed };
      } catch (err) {
        clearTimeout(timer);
        const msg = err.name === "AbortError" ? `RDAP \u8BF7\u6C42\u8D85\u65F6(${timeout}ms)` : `RDAP \u8BF7\u6C42\u5931\u8D25: ${err.message}`;
        return { ok: false, domain, server: server.base, url, error: msg };
      }
    }
    module2.exports = { rdapLookup, findRdapServer, loadBootstrap, normalizeRdap, FALLBACK };
  }
});

// lib/dns.js
var require_dns = __commonJS({
  "lib/dns.js"(exports2, module2) {
    "use strict";
    var dns = require("dns");
    var { Resolver } = dns;
    var TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV", "PTR"];
    function makeResolver(servers) {
      if (!servers || !servers.length) return dns.promises;
      const r = new Resolver({ timeout: 5e3, tries: 2 });
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
        reverse: (n) => r.reverse(n)
      };
    }
    function explainDnsError(code) {
      switch (code) {
        case "ENOTFOUND":
          return "\u8BB0\u5F55\u4E0D\u5B58\u5728";
        case "ENODATA":
          return "\u8BE5\u7C7B\u578B\u65E0\u8BB0\u5F55";
        case "NXDOMAIN":
          return "\u57DF\u540D\u4E0D\u5B58\u5728";
        case "SERVFAIL":
          return "DNS \u670D\u52A1\u5668\u8FD4\u56DE SERVFAIL";
        case "REFUSED":
          return "DNS \u670D\u52A1\u5668\u62D2\u7EDD\u67E5\u8BE2";
        case "ETIMEOUT":
        case "ETIMEDOUT":
          return "DNS \u67E5\u8BE2\u8D85\u65F6";
        case "ECONNREFUSED":
          return "\u65E0\u6CD5\u8FDE\u63A5 DNS \u670D\u52A1\u5668";
        case "ESERVFAIL":
          return "DNS \u670D\u52A1\u5668\u89E3\u6790\u5931\u8D25";
        default:
          return code || "\u672A\u77E5\u9519\u8BEF";
      }
    }
    function isNotFoundCode(code) {
      return code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN";
    }
    async function queryType(resolver, domain, type) {
      try {
        let records;
        switch (type) {
          case "A":
            records = await resolver.resolve4(domain);
            break;
          case "AAAA":
            records = await resolver.resolve6(domain);
            break;
          case "CNAME":
            records = await resolver.resolveCname(domain);
            break;
          case "MX":
            records = (await resolver.resolveMx(domain)).sort((a, b) => a.priority - b.priority);
            break;
          case "NS":
            records = (await resolver.resolveNs(domain)).sort();
            break;
          case "TXT":
            records = (await resolver.resolveTxt(domain)).map((chunks) => chunks.join(""));
            break;
          case "SOA": {
            const s = await resolver.resolveSoa(domain);
            records = [s];
            break;
          }
          case "CAA": {
            const c2 = await resolver.resolveCaa(domain);
            records = c2.map((x) => `${x.critical ? "critical " : ""}${x.issue ? `issue="${x.issue}"` : ""}${x.issuewild ? `issuewild="${x.issuewild}"` : ""}${x.iodef ? `iodef="${x.iodef}"` : ""}`.trim());
            break;
          }
          case "SRV":
            records = await resolver.resolveSrv(domain);
            break;
          case "PTR":
            records = await resolver.reverse(domain);
            break;
          default:
            return { type, ok: false, records: [], error: `\u4E0D\u652F\u6301\u7684\u8BB0\u5F55\u7C7B\u578B ${type}` };
        }
        return { type, ok: true, records: records || [] };
      } catch (err) {
        return {
          type,
          ok: false,
          records: [],
          code: err.code,
          error: explainDnsError(err.code),
          notFound: isNotFoundCode(err.code)
        };
      }
    }
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
      const addrList = [...records.A || [], ...records.AAAA || []];
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
        nxdomain: results.some((r) => r.code === "ENOTFOUND" || r.code === "NXDOMAIN"),
        servers: opts.servers && opts.servers.length ? opts.servers : "system",
        elapsedMs: Date.now() - started
      };
    }
    async function resolveChain(domain, opts = {}) {
      const resolver = makeResolver(opts.servers);
      const chain = [];
      let current = domain;
      const seen = /* @__PURE__ */ new Set();
      for (let i = 0; i < 10; i += 1) {
        if (seen.has(current)) {
          chain.push({ name: current, note: "CNAME \u94FE\u5B58\u5728\u73AF" });
          break;
        }
        seen.add(current);
        const [cname, a, aaaa] = await Promise.all([
          queryType(resolver, current, "CNAME"),
          queryType(resolver, current, "A"),
          queryType(resolver, current, "AAAA")
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
        if (!hop.a && !hop.aaaa) hop.note = cname.notFound !== false ? "\u65E0\u89E3\u6790\u8BB0\u5F55" : "\u89E3\u6790\u5931\u8D25";
        chain.push(hop);
        break;
      }
      return { ok: true, domain, chain };
    }
    function systemServers() {
      try {
        return dns.getServers();
      } catch {
        return [];
      }
    }
    var NON_PUBLIC_PATTERNS = [
      /^10\./,
      /^127\./,
      /^0\./,
      /^169\.254\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^198\.1[89]\./,
      /^192\.0\.(0|2)\./,
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
      /^::1$/,
      /^::$/,
      /^fe80:/i,
      /^f[cd][0-9a-f]{2}:/i
    ];
    function ipIsNonPublic(ip) {
      const s = String(ip || "").trim().toLowerCase();
      if (!s) return false;
      return NON_PUBLIC_PATTERNS.some((re) => re.test(s));
    }
    module2.exports = {
      dnsLookup,
      queryType,
      resolveChain,
      systemServers,
      explainDnsError,
      ipIsNonPublic,
      TYPES,
      makeResolver
    };
  }
});

// lib/availability.js
var require_availability = __commonJS({
  "lib/availability.js"(exports2, module2) {
    "use strict";
    var { whoisLookup } = require_whois();
    var { parseWhois } = require_parse();
    var { rdapLookup } = require_rdap();
    var { dnsLookup } = require_dns();
    async function checkAvailability(domain, opts = {}) {
      const useDns = opts.useDns !== false;
      const useRdap = opts.useRdap !== false;
      const evidence = [];
      let voteRegistered = 0;
      let voteFree = 0;
      let note = null;
      let whoisResult = null;
      let parsed = null;
      try {
        whoisResult = await whoisLookup(domain, { deep: false });
        if (whoisResult.ok) {
          parsed = parseWhois(whoisResult.text, domain);
          if (whoisResult.found === false || parsed.registered === false) {
            voteFree += 1;
            evidence.push({ source: "WHOIS", verdict: "available", detail: `${whoisResult.server} \u672A\u627E\u5230\u8BE5\u57DF\u540D\u7684\u6CE8\u518C\u8BB0\u5F55` });
          } else if (parsed.registered === true) {
            voteRegistered += 1;
            evidence.push({
              source: "WHOIS",
              verdict: "registered",
              detail: parsed.created ? `\u6CE8\u518C\u4E8E ${parsed.created.slice(0, 10)}` : "\u5B58\u5728\u6CE8\u518C\u8BB0\u5F55"
            });
          } else {
            evidence.push({ source: "WHOIS", verdict: "unknown", detail: "\u54CD\u5E94\u65E0\u6CD5\u660E\u786E\u5224\u5B9A" });
          }
        } else {
          evidence.push({ source: "WHOIS", verdict: "error", detail: whoisResult.error });
        }
      } catch (err) {
        evidence.push({ source: "WHOIS", verdict: "error", detail: err.message });
      }
      let dnsResult = null;
      if (useDns) {
        try {
          dnsResult = await dnsLookup(domain, { types: ["NS", "SOA", "A"] });
          const nsRecs = dnsResult.records.NS || [];
          const soaRecs = dnsResult.records.SOA || [];
          const nsLookup = (dnsResult.details || []).find((d) => d.type === "NS");
          const soaLookup = (dnsResult.details || []).find((d) => d.type === "SOA");
          if (nsRecs.length || soaRecs.length) {
            voteRegistered += 1;
            const what = nsRecs.length ? `${nsRecs.length} \u6761 NS \u59D4\u6D3E` : "SOA \u8BB0\u5F55";
            evidence.push({ source: "DNS", verdict: "registered", detail: `\u5B58\u5728 ${what}(\u57DF\u540D\u5DF2\u5728\u6CE8\u518C\u5C40\u5B8C\u6210\u59D4\u6D3E)` });
          } else if (nsLookup && nsLookup.notFound && soaLookup && soaLookup.notFound) {
            voteFree += 1;
            evidence.push({ source: "DNS", verdict: "available", detail: "NS \u4E0E SOA \u5747\u8FD4\u56DE NXDOMAIN \u2014\u2014 \u8BE5\u57DF\u540D\u672A\u5728 DNS \u4E2D\u59D4\u6D3E" });
          } else if (dnsResult.hijackSuspect) {
            evidence.push({
              source: "DNS",
              verdict: "unknown",
              detail: `A \u8BB0\u5F55\u6307\u5411\u975E\u516C\u7F51\u5730\u5740(${dnsResult.nonPublicIps.join(", ")}),\u7591\u4F3C DNS \u52AB\u6301/NXDOMAIN \u91CD\u5B9A\u5411,\u4E0D\u4F5C\u4E3A\u6CE8\u518C\u4F9D\u636E`
            });
          } else {
            evidence.push({ source: "DNS", verdict: "unknown", detail: "\u65E0 NS/SOA \u59D4\u6D3E\u8BB0\u5F55(\u53EF\u80FD\u5DF2\u6CE8\u518C\u4F46\u672A\u914D\u7F6E\u89E3\u6790)" });
          }
        } catch (err) {
          evidence.push({ source: "DNS", verdict: "error", detail: err.message });
        }
      }
      let rdapResult = null;
      if (useRdap) {
        try {
          rdapResult = await rdapLookup(domain);
          if (rdapResult.ok) {
            if (rdapResult.found === false) {
              voteFree += 1;
              evidence.push({ source: "RDAP", verdict: "available", detail: "\u6CE8\u518C\u5C40 RDAP \u8FD4\u56DE 404(\u5BF9\u8C61\u4E0D\u5B58\u5728)" });
            } else {
              voteRegistered += 1;
              evidence.push({ source: "RDAP", verdict: "registered", detail: `handle=${rdapResult.parsed.handle || "-"}` });
            }
          } else {
            evidence.push({ source: "RDAP", verdict: "unknown", detail: rdapResult.error });
          }
        } catch (err) {
          evidence.push({ source: "RDAP", verdict: "error", detail: err.message });
        }
      }
      let available = null;
      let confidence = "unknown";
      if (voteRegistered > 0) {
        available = false;
        confidence = voteFree > 0 ? "medium" : "high";
        if (voteFree > 0) note = '\u4E0D\u540C\u6570\u636E\u6E90\u7ED3\u8BBA\u4E0D\u4E00\u81F4(\u901A\u5E38\u662F DNS \u5C1A\u672A\u751F\u6548\u6216 WHOIS \u9650\u6D41),\u5DF2\u6309"\u5DF2\u6CE8\u518C"\u5904\u7406';
      } else if (voteFree > 0) {
        available = true;
        confidence = voteFree >= 2 ? "high" : "medium";
        if (voteFree === 1) note = "\u4EC5\u5355\u4E00\u6570\u636E\u6E90\u786E\u8BA4\u672A\u6CE8\u518C,\u5EFA\u8BAE\u4EE5\u6CE8\u518C\u5546\u5B9E\u65F6\u7ED3\u679C\u4E3A\u51C6";
      } else {
        available = null;
        confidence = "unknown";
        note = "\u6240\u6709\u6570\u636E\u6E90\u5747\u672A\u80FD\u7ED9\u51FA\u660E\u786E\u7ED3\u8BBA";
      }
      const rawText = whoisResult && whoisResult.text ? whoisResult.text : "";
      if (/reserved|blocked|premium|not available for registration/i.test(rawText)) {
        note = (note ? `${note};` : "") + "\u6CE8\u518C\u5C40\u63D0\u793A\u8BE5\u57DF\u540D\u4E3A\u4FDD\u7559/\u6EA2\u4EF7\u57DF\u540D,\u53EF\u80FD\u65E0\u6CD5\u4EE5\u666E\u901A\u4EF7\u683C\u6CE8\u518C";
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
          records: dnsResult.records
        } : null,
        rdap: rdapResult ? { ok: rdapResult.ok, found: rdapResult.found, error: rdapResult.error } : null
      };
    }
    async function bulkAvailability(domains, opts = {}) {
      const concurrency = Math.max(1, Math.min(opts.concurrency || 4, 10));
      const results = new Array(domains.length);
      let cursor = 0;
      let done = 0;
      async function worker() {
        for (; ; ) {
          const i = cursor;
          cursor += 1;
          if (i >= domains.length) return;
          try {
            results[i] = await checkAvailability(domains[i], opts);
          } catch (err) {
            results[i] = { domain: domains[i], available: null, confidence: "unknown", error: err.message, evidence: [] };
          }
          done += 1;
          if (typeof opts.onProgress === "function") {
            try {
              opts.onProgress(done, domains.length, results[i]);
            } catch {
            }
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(concurrency, domains.length) }, worker));
      return results;
    }
    module2.exports = { checkAvailability, bulkAvailability };
  }
});

// lib/merge.js
var require_merge = __commonJS({
  "lib/merge.js"(exports2, module2) {
    "use strict";
    var pick = (a, b) => a !== null && a !== void 0 && a !== "" && !(Array.isArray(a) && !a.length) ? a : b;
    function mergeInfo(parsed, rdap, norm) {
      const out = {
        domain: norm.ascii,
        unicode: norm.unicode,
        tld: norm.tld,
        tldUnicode: norm.tldUnicode || null,
        registrable: norm.registrable,
        sub: norm.sub || null,
        registered: parsed ? parsed.registered : rdap ? rdap.registered : null,
        created: null,
        updated: null,
        expires: null,
        daysLeft: null,
        ageDays: null,
        statuses: [],
        nameServers: [],
        dnssec: null,
        registrant: {},
        registrantRedacted: false,
        registrar: { name: null, url: null, ianaId: null, abuseEmail: null, abusePhone: null, whoisServer: null },
        registryDomainId: null,
        sources: []
      };
      if (parsed) out.sources.push("WHOIS");
      if (rdap) out.sources.push("RDAP");
      out.created = pick(parsed && parsed.created, rdap && rdap.created);
      out.updated = pick(parsed && parsed.updated, rdap && rdap.updated);
      out.expires = pick(parsed && parsed.expires, rdap && rdap.expires);
      out.dnssec = pick(parsed && parsed.dnssec, rdap && rdap.dnssec);
      out.registryDomainId = pick(parsed && parsed.registryDomainId, rdap && rdap.registryDomainId);
      out.registrantRedacted = !!(parsed && parsed.registrantRedacted) || !!(rdap && rdap.registrantRedacted);
      out.nameServers = pick(parsed && parsed.nameServers, rdap && rdap.nameServers) || [];
      const seen = /* @__PURE__ */ new Set();
      for (const s of [...parsed && parsed.statuses || [], ...rdap && rdap.statuses || []]) {
        const code = typeof s === "string" ? s : s.code;
        const k = String(code || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.statuses.push(typeof s === "string" ? { code: s, zh: s, desc: "", type: "info" } : s);
      }
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
        org: pick(null, rdap && rdap.registrant && rdap.registrant.org)
      };
      const now = Date.now();
      if (out.expires) {
        const t = new Date(out.expires).getTime();
        if (!Number.isNaN(t)) out.daysLeft = Math.floor((t - now) / 864e5);
      }
      if (out.created) {
        const t = new Date(out.created).getTime();
        if (!Number.isNaN(t)) out.ageDays = Math.floor((now - t) / 864e5);
      }
      return out;
    }
    module2.exports = { mergeInfo };
  }
});

// lib/assets.js
var require_assets = __commonJS({
  "lib/assets.js"(exports2, module2) {
    "use strict";
    var path2 = require("path");
    var sea = null;
    try {
      sea = require("node:sea");
    } catch {
    }
    var isSeaBuild2 = !!(sea && typeof sea.isSea === "function" && sea.isSea());
    var keyCache = null;
    function embeddedKeys() {
      if (!isSeaBuild2) return [];
      if (!keyCache) {
        try {
          keyCache = new Set(sea.getAssetKeys());
        } catch {
          keyCache = /* @__PURE__ */ new Set();
        }
      }
      return [...keyCache];
    }
    function hasEmbedded(key) {
      if (!isSeaBuild2) return false;
      if (keyCache) return keyCache.has(key);
      return embeddedKeys().includes(key);
    }
    var TEXT_EXT = /* @__PURE__ */ new Set([".html", ".css", ".js", ".json", ".txt", ".md", ".svg", ".map", ".xml"]);
    function getEmbedded(key) {
      if (!isSeaBuild2) return null;
      const normalized = key.split(path2.sep).join("/");
      if (!hasEmbedded(normalized)) return null;
      try {
        const buf = sea.getRawAsset(normalized);
        return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
      } catch {
        return null;
      }
    }
    function getEmbeddedText(key) {
      const buf = getEmbedded(key);
      return buf ? buf.toString("utf8") : null;
    }
    function readStatic(publicDir, relPath) {
      const rel = relPath.split(path2.sep).join("/").replace(/^\/+/, "");
      const embedded = getEmbedded(`public/${rel}`);
      if (embedded) return { data: embedded, source: "embedded" };
      try {
        const fs2 = require("fs");
        const full = path2.join(publicDir, rel);
        if (!full.startsWith(publicDir)) return null;
        return { data: fs2.readFileSync(full), source: "disk" };
      } catch {
        return null;
      }
    }
    module2.exports = {
      isSeaBuild: isSeaBuild2,
      getEmbedded,
      getEmbeddedText,
      hasEmbedded,
      embeddedKeys,
      readStatic,
      TEXT_EXT
    };
  }
});

// package.json
var require_package = __commonJS({
  "package.json"(exports2, module2) {
    module2.exports = {
      name: "domain-lookup",
      productName: "\u57DF\u540D\u67E5\u8BE2",
      version: "1.0.0",
      description: "\u57DF\u540D\u67E5\u8BE2\u5DE5\u5177:WHOIS / RDAP / DNS / \u53EF\u7528\u6027\u68C0\u6D4B\u3002\u96F6\u4F9D\u8D56 Node.js \u5B9E\u73B0,\u63D0\u4F9B\u684C\u9762\u7248\u4E0E\u7F51\u9875\u7248\u3002",
      main: "electron/main.js",
      bin: {
        "domain-lookup": "cli.js"
      },
      scripts: {
        start: "node server.js",
        desktop: "electron .",
        cli: "node cli.js",
        test: "node tests/run.js",
        icon: "node tools/make-icon.js",
        "build:desktop": "node tools/build-desktop.js",
        "build:web": "node tools/build-web.js",
        "build:all": "node tools/build-web.js && node tools/build-desktop.js",
        shortcut: "node tools/make-shortcut.js",
        release: "node tools/github-release.js"
      },
      engines: {
        node: ">=20.12"
      },
      keywords: [
        "whois",
        "rdap",
        "dns",
        "domain",
        "\u57DF\u540D\u67E5\u8BE2"
      ],
      license: "GPL-3.0-or-later",
      author: "HeSheng",
      private: true,
      devDependencies: {
        "@electron/packager": "^20.3.0",
        electron: "^44.4.3",
        esbuild: "^0.28.2",
        postject: "^1.0.0-alpha.6"
      }
    };
  }
});

// server.js
var require_server = __commonJS({
  "server.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var fs2 = require("fs");
    var fsp = require("fs/promises");
    var path2 = require("path");
    var { URL: URL2 } = require("url");
    var { normalizeDomain, splitInputList, MULTI_SUFFIXES } = require_domain();
    var { whoisLookup } = require_whois();
    var { parseWhois, parseDate } = require_parse();
    var { rdapLookup, findRdapServer, loadBootstrap } = require_rdap();
    var { dnsLookup, resolveChain, systemServers, TYPES } = require_dns();
    var { checkAvailability, bulkAvailability } = require_availability();
    var { TLDS } = require_tld_servers();
    var { mergeInfo } = require_merge();
    var { getEmbedded, isSeaBuild: IsSeaBuild } = require_assets();
    var pkg = require_package();
    var PUBLIC_DIR = path2.join(__dirname, "public");
    var MIME = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".png": "image/png",
      ".woff2": "font/woff2",
      ".map": "application/json; charset=utf-8"
    };
    function sendJson(res, status, obj) {
      const body = JSON.stringify(obj, null, 2);
      res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "content-length": Buffer.byteLength(body),
        "cache-control": "no-store"
      });
      res.end(body);
    }
    function sendText(res, status, text, type = "text/plain; charset=utf-8") {
      res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
      res.end(text);
    }
    function readDomain(url, param = "domain") {
      const raw = url.searchParams.get(param) || "";
      if (!raw) return { ok: false, status: 400, error: "\u7F3A\u5C11 domain \u53C2\u6570" };
      const norm = normalizeDomain(raw);
      if (!norm.ok) return { ok: false, status: 400, error: norm.error };
      return { ok: true, norm };
    }
    var routes = {
      /** GET /api/full?domain=x —— 一次性拿到 WHOIS + DNS + RDAP */
      async full(req, res, url) {
        const d = readDomain(url);
        if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
        const { norm } = d;
        const noDns = url.searchParams.get("dns") === "0";
        const noRdap = url.searchParams.get("rdap") === "0";
        const t0 = Date.now();
        const [whoisRes, dnsRes, rdapRes] = await Promise.all([
          whoisLookup(norm.ascii).catch((e) => ({ ok: false, domain: norm.ascii, error: e.message, steps: [] })),
          noDns ? Promise.resolve(null) : dnsLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message, records: {} })),
          noRdap ? Promise.resolve(null) : rdapLookup(norm.ascii).catch((e) => ({ ok: false, error: e.message }))
        ]);
        const parsed = whoisRes.ok ? parseWhois(whoisRes.text, norm.ascii) : null;
        const merged = mergeInfo(parsed, rdapRes && rdapRes.ok ? rdapRes.parsed : null, norm);
        return sendJson(res, 200, {
          ok: true,
          query: { input: url.searchParams.get("domain"), ...norm },
          elapsedMs: Date.now() - t0,
          summary: merged,
          whois: whoisRes.ok ? { ok: true, found: whoisRes.found, servers: whoisRes.servers, steps: whoisRes.steps, text: whoisRes.text } : { ok: false, error: whoisRes.error, steps: whoisRes.steps || [] },
          parsed,
          rdap: rdapRes ? rdapRes.ok ? { ok: true, found: rdapRes.found, server: rdapRes.server, serverSource: rdapRes.serverSource, url: rdapRes.url, parsed: rdapRes.parsed, json: rdapRes.json } : { ok: false, error: rdapRes.error, server: rdapRes.server } : null,
          dns: dnsRes
        });
      },
      /** GET /api/whois?domain=x */
      async whois(req, res, url) {
        const d = readDomain(url);
        if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
        const { norm } = d;
        const deep = url.searchParams.get("deep") !== "0";
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
          text: r.text
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
        const typesParam = url.searchParams.get("types");
        const types = typesParam ? typesParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean) : TYPES;
        const bad = types.filter((t) => !TYPES.includes(t));
        if (bad.length) return sendJson(res, 400, { ok: false, error: `\u4E0D\u652F\u6301\u7684\u8BB0\u5F55\u7C7B\u578B: ${bad.join(", ")}`, supported: TYPES });
        const chain = url.searchParams.get("chain") === "1";
        const [records, chainRes] = await Promise.all([
          dnsLookup(d.norm.ascii, { types }),
          chain ? resolveChain(d.norm.ascii) : Promise.resolve(null)
        ]);
        return sendJson(res, 200, { ...records, chain: chainRes });
      },
      /** GET /api/check?domain=x —— 可用性检测 */
      async check(req, res, url) {
        const d = readDomain(url);
        if (!d.ok) return sendJson(res, d.status, { ok: false, error: d.error });
        const r = await checkAvailability(d.norm.ascii, {
          useDns: url.searchParams.get("dns") !== "0",
          useRdap: url.searchParams.get("rdap") !== "0"
        });
        return sendJson(res, 200, { ok: true, ...r });
      },
      /** GET /api/bulk?domains=a.com,b.net —— SSE 流式返回每个结果 */
      async bulk(req, res, url) {
        const raw = url.searchParams.get("domains") || "";
        const inputs = splitInputList(raw).slice(0, 200);
        if (!inputs.length) return sendJson(res, 400, { ok: false, error: "\u6CA1\u6709\u63D0\u4F9B\u8981\u67E5\u8BE2\u7684\u57DF\u540D" });
        const items = inputs.map((x) => ({ input: x, norm: normalizeDomain(x) }));
        res.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-store",
          connection: "keep-alive",
          "x-accel-buffering": "no"
        });
        const send = (event, data) => {
          if (res.writableEnded) return;
          res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
        };
        send("start", { total: items.length });
        let closed = false;
        req.on("close", () => {
          closed = true;
        });
        let done = 0;
        const concurrency = Math.max(1, Math.min(Number(url.searchParams.get("c") || 4), 8));
        let cursor = 0;
        async function worker() {
          for (; ; ) {
            if (closed) return;
            const i = cursor;
            cursor += 1;
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
                  summary: mergeInfo(parsed, rdapParsed, it.norm)
                };
              } catch (err) {
                result = { input: it.input, ok: false, error: err.message };
              }
            }
            done += 1;
            send("result", { index: i, done, ...result });
          }
        }
        await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
        send("done", { total: items.length, done });
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
          multiSuffixes: [...MULTI_SUFFIXES].length
        });
      },
      /** GET /api/tlds?q=co */
      async tlds(req, res, url) {
        const q = (url.searchParams.get("q") || "").toLowerCase();
        const list = Object.keys(TLDS).filter((t) => !q || t.includes(q));
        return sendJson(res, 200, { ok: true, total: Object.keys(TLDS).length, tlds: list });
      },
      /** GET /api/health */
      async health(req, res) {
        return sendJson(res, 200, { ok: true, time: (/* @__PURE__ */ new Date()).toISOString(), uptime: Math.round(process.uptime()) });
      }
    };
    async function serveStatic(req, res, url) {
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/" || rel === "") rel = "/index.html";
      const safe = path2.normalize(rel).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
      const filePath = path2.join(PUBLIC_DIR, safe);
      if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, 403, "403 Forbidden");
      if (IsSeaBuild) {
        const emb = getEmbedded(`public/${safe.split(path2.sep).join("/")}`);
        if (emb) {
          const ext = path2.extname(safe).toLowerCase();
          res.writeHead(200, {
            "content-type": MIME[ext] || "application/octet-stream",
            "content-length": emb.length,
            "cache-control": "no-cache"
          });
          return res.end(emb);
        }
      }
      try {
        const stat = await fsp.stat(filePath);
        if (stat.isDirectory()) return serveStatic(req, res, new URL2(`${rel}/index.html`, url.origin));
        const ext = path2.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "content-type": MIME[ext] || "application/octet-stream",
          "content-length": stat.size,
          "cache-control": "no-cache"
        });
        fs2.createReadStream(filePath).pipe(res);
      } catch {
        try {
          const idx = path2.join(PUBLIC_DIR, "index.html");
          const html = await fsp.readFile(idx);
          res.writeHead(200, { "content-type": MIME[".html"] });
          res.end(html);
        } catch {
          sendText(res, 404, "404 Not Found");
        }
      }
      return void 0;
    }
    function createServer2() {
      return http.createServer(async (req, res) => {
        const url = new URL2(req.url, `http://${req.headers.host || "127.0.0.1"}`);
        const cors = {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET,POST,OPTIONS"
        };
        for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          return res.end();
        }
        if (url.pathname.startsWith("/api/")) {
          const name = url.pathname.slice(5).replace(/\/$/, "");
          const handler = routes[name];
          if (!handler) return sendJson(res, 404, { ok: false, error: `\u672A\u77E5\u63A5\u53E3 /api/${name}` });
          try {
            return await handler(req, res, url);
          } catch (err) {
            if (!res.writableEnded) sendJson(res, 500, { ok: false, error: err.message, stack: process.env.DSH_DEBUG ? err.stack : void 0 });
            return void 0;
          }
        }
        if (req.method !== "GET" && req.method !== "HEAD") return sendText(res, 405, "405 Method Not Allowed");
        return serveStatic(req, res, url);
      });
    }
    module2.exports = { createServer: createServer2, mergeInfo };
    if (require.main === module2) {
      const port = Number(process.env.PORT || process.argv[2] || 8420);
      const host = process.env.HOST || "127.0.0.1";
      const server = createServer2();
      server.listen(port, host, () => {
        const shown = host === "0.0.0.0" ? "127.0.0.1" : host;
        console.log("");
        console.log("  \u57DF\u540D\u67E5\u8BE2\u5DE5\u5177\u5DF2\u542F\u52A8");
        console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        console.log(`  \u672C\u673A\u8BBF\u95EE:  http://${shown}:${port}`);
        console.log(`  \u76D1\u542C\u5730\u5740:  ${host}:${port}`);
        console.log(`  Node \u7248\u672C: ${process.version}`);
        console.log("  \u6309 Ctrl+C \u505C\u6B62");
        console.log("");
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`
\u7AEF\u53E3 ${port} \u5DF2\u88AB\u5360\u7528\u3002\u8BF7\u6362\u4E00\u4E2A\u7AEF\u53E3,\u4F8B\u5982:
  node server.js 8421
`);
        } else {
          console.error("\u542F\u52A8\u5931\u8D25:", err.message);
        }
        process.exit(1);
      });
    }
  }
});

// sea/entry.js
var { spawn } = require("child_process");
var fs = require("fs");
var path = require("path");
var { createServer } = require_server();
var { isSeaBuild } = require_assets();
var MODE = true ? "app" : "web";
var BASE_PORT = Number(process.env.PORT || 8420);
var HOST = process.env.DL_HOST || "127.0.0.1";
var AUTO_OPEN = process.env.DL_NO_OPEN !== "1";
var MAX_PORT_TRIES = 20;
var useColor = process.stdout.isTTY && !process.env.NO_COLOR;
var c = (code) => (s) => useColor ? `\x1B[${code}m${s}\x1B[0m` : String(s);
var bold = c("1");
var dim = c("2");
var cyan = c("36");
var green = c("32");
var yellow = c("33");
function findChromium() {
  if (process.env.DL_BROWSER && fs.existsSync(process.env.DL_BROWSER)) {
    return process.env.DL_BROWSER;
  }
  if (process.platform !== "win32") return null;
  const pf = process.env["ProgramFiles"] || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const local = process.env.LOCALAPPDATA || "";
  const candidates = [
    path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    local && path.join(local, "Google", "Chrome", "Application", "chrome.exe")
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
    }
  }
  return null;
}
function spawnDetached(cmd, args) {
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
function openBrowser(url) {
  if (process.platform === "win32") {
    return spawnDetached("cmd", ["/c", "start", "", url]);
  }
  if (process.platform === "darwin") return spawnDetached("open", [url]);
  return spawnDetached("xdg-open", [url]);
}
function openAppWindow(url) {
  const browser = findChromium();
  if (!browser) return { ok: false };
  const args = [
    `--app=${url}`,
    "--window-size=1280,860",
    "--no-first-run",
    "--no-default-browser-check",
    // 独立的用户数据目录:一来让窗口有自己的身份,二来不碰用户平时的浏览数据。
    // 放在临时目录里,不会污染用户配置。
    `--user-data-dir=${path.join(require("os").tmpdir(), "domain-lookup-app-window")}`
  ];
  const ok = spawnDetached(browser, args);
  return { ok, browser: path.basename(browser) };
}
function banner(port) {
  const shown = HOST === "0.0.0.0" ? "<\u672C\u673A IP>" : HOST;
  const url = `http://${shown === "<\u672C\u673A IP>" ? "127.0.0.1" : HOST}:${port}`;
  const lines = [
    "",
    `  ${bold("\u57DF\u540D\u67E5\u8BE2\u5DE5\u5177")} ${dim(MODE === "app" ? "\xB7 \u684C\u9762\u7248(\u8F7B\u91CF)" : "\xB7 \u7F51\u9875\u7AEF")}`,
    `  ${dim("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")}`,
    `  \u8BBF\u95EE\u5730\u5740:  ${cyan(url)}`,
    `  \u76D1\u542C\u5730\u5740:  ${HOST}:${port}`,
    `  \u6253\u5F00\u65B9\u5F0F:  ${MODE === "app" ? "\u7CFB\u7EDF\u6D4F\u89C8\u5668\u7684\u72EC\u7ACB\u5E94\u7528\u7A97\u53E3" : "\u7CFB\u7EDF\u9ED8\u8BA4\u6D4F\u89C8\u5668"}`,
    `  \u8FD0\u884C\u65B9\u5F0F:  ${isSeaBuild ? "\u5355\u6587\u4EF6\u514D\u5B89\u88C5\u7248(\u5185\u5D4C Node.js)" : "Node.js \u6E90\u7801\u6A21\u5F0F"}`,
    `  Node \u7248\u672C: ${process.version}`,
    "",
    `  ${dim("\u6309 Ctrl+C \u505C\u6B62\u670D\u52A1")}`,
    ""
  ];
  console.log(lines.join("\n"));
}
function listen(server, port, attemptsLeft) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListening);
      if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.log(`  ${yellow("!")} \u7AEF\u53E3 ${port} \u88AB\u5360\u7528,\u6539\u7528 ${port + 1}`);
        resolve(listen(server, port + 1, attemptsLeft - 1));
      } else {
        reject(err);
      }
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve(port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}
(async () => {
  const server = createServer();
  let port;
  try {
    port = await listen(server, BASE_PORT, MAX_PORT_TRIES);
  } catch (err) {
    console.error("");
    console.error(`  ${c("31")("\u542F\u52A8\u5931\u8D25:")} ${err.message}`);
    if (err.code === "EACCES") {
      console.error("  \u8BE5\u7AEF\u53E3\u88AB\u7CFB\u7EDF\u4FDD\u7559,\u6362\u4E00\u4E2A\u7AEF\u53E3\u518D\u8BD5,\u4F8B\u5982:");
      console.error(`    set PORT=9000 && \u57DF\u540D\u67E5\u8BE2-web.exe`);
    }
    console.error("");
    process.exitCode = 1;
    return;
  }
  banner(port);
  if (AUTO_OPEN) {
    const url = `http://127.0.0.1:${port}/`;
    let opened = false;
    if (MODE === "app") {
      const r = openAppWindow(url);
      opened = r.ok;
      if (r.ok) {
        console.log(`  ${dim(`\u5DF2\u7528 ${r.browser} \u6253\u5F00\u72EC\u7ACB\u7A97\u53E3`)}`);
      } else {
        console.log(`  ${yellow("!")} \u6CA1\u627E\u5230 Edge \u6216 Chrome,\u6539\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u6D4F\u89C8\u5668`);
      }
    }
    if (!opened) opened = openBrowser(url);
    if (!opened) {
      console.log(`  ${dim("\u6CA1\u80FD\u81EA\u52A8\u6253\u5F00\u6D4F\u89C8\u5668,\u8BF7\u624B\u52A8\u8BBF\u95EE\u4E0A\u9762\u7684\u5730\u5740")}`);
    }
  }
  const shutdown = () => {
    console.log(`
  ${green("\u2713")} \u670D\u52A1\u5DF2\u505C\u6B62
`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1e3).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})().catch((err) => {
  console.error(`
  \u542F\u52A8\u5F02\u5E38: ${err && err.message ? err.message : err}
`);
  process.exit(1);
});
