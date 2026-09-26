'use strict';

/**
 * 打包并发布到 GitHub Release —— node tools/github-release.js
 *
 * 做三件事:
 *   1. 把 dist/域名查询-web 和 dist/域名查询-win32-x64 分别压成 zip
 *   2. 生成 SHA256 校验文件
 *   3. 创建 tag + release,并把三个产物传上去
 *
 * 环境变量:
 *   GH_TOKEN    必填
 *   GH_OWNER    可选,默认取 token 对应的账号
 *   GH_REPO     可选,默认 domain-lookup
 *   GH_TAG      可选,默认 v<package.json 的 version>
 *   GH_SKIP_ZIP 设为 1 则复用已存在的 zip,不重新压缩
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GH_REPO || 'domain-lookup';
const pkg = require(path.join(ROOT, 'package.json'));
const TAG = process.env.GH_TAG || `v${pkg.version}`;
const SKIP_ZIP = process.env.GH_SKIP_ZIP === '1';

if (!TOKEN) {
  console.error('缺少环境变量 GH_TOKEN');
  process.exit(1);
}

/** 要发布的包 */
const PACKAGES = [
  {
    key: 'desktop',
    dir: path.join(DIST, '域名查询-轻量版'),
    zipName: `domain-lookup-desktop-${TAG}.zip`,
    label: '桌面版(轻量)',
  },
  {
    key: 'web',
    dir: path.join(DIST, '域名查询-web'),
    zipName: `domain-lookup-web-${TAG}.zip`,
    label: '网页版',
  },
  {
    key: 'desktop-full',
    dir: path.join(DIST, '域名查询-win32-x64'),
    zipName: `domain-lookup-desktop-full-${TAG}-win32-x64.zip`,
    label: '桌面版(完整 · Electron)',
  },
];

/* -------------------- GitHub API -------------------- */

async function gh(apiPath, options = {}) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'domain-lookup-release',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 非 JSON */ }
  if (!res.ok) {
    const msg = (json && json.message) || String(text).slice(0, 200);
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** 上传单个资源(流式,避免把几百兆读进内存) */
async function uploadAsset(uploadUrl, filePath, assetName) {
  const size = fs.statSync(filePath).size;
  const res = await fetch(`${uploadUrl}?name=${encodeURIComponent(assetName)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/zip',
      'Content-Length': String(size),
      'User-Agent': 'domain-lookup-release',
    },
    body: fs.createReadStream(filePath),
    duplex: 'half',
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(`上传 ${assetName} 失败: HTTP ${res.status} ${json && json.message ? json.message : text.slice(0, 150)}`);
  }
  return json;
}

/* -------------------- 压缩 -------------------- */

function psQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/** 用 .NET 的 ZipFile 压缩(比 Compress-Archive 快很多) */
function zipDir(srcDir, outFile) {
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  const script = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  ${psQuote(srcDir)},
  ${psQuote(outFile)},
  [System.IO.Compression.CompressionLevel]::Optimal,
  $true
)
Write-Output "OK"
`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  const buf = fs.readFileSync(file);
  hash.update(buf);
  return hash.digest('hex');
}

const fmtMB = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

/* -------------------- Release 说明 -------------------- */

function buildReleaseNotes(assets) {
  const desktop = assets.find((a) => a.key === 'desktop');
  const web = assets.find((a) => a.key === 'web');
  const full = assets.find((a) => a.key === 'desktop-full');

  return `## 本次变化:体积大幅缩减

上一版桌面版要 139 MB(里面 73% 是打包进去的 Chromium)。
这一版把桌面界面改成**复用系统自带的 Edge/Chrome 内核**,
同一个窗口体验,下载体积从 **139 MB 降到 ${fmtMB(desktop.size)}**(约 1/4)。

想要完全不依赖浏览器的原生版,下载量最大的那个 \`${full.name}\`。

---

## 下载

三个包都是**免安装**的,解压后直接双击,**不需要安装 Node.js**。

| 版本 | 文件 | 大小 | 说明 |
|---|---|---|---|
| 🖥️ **桌面版(轻量)** | \`${desktop.name}\` | ${fmtMB(desktop.size)} | 独立应用窗口,无标签栏无地址栏,任务栏单独一项 |
| 🌐 **网页版** | \`${web.name}\` | ${fmtMB(web.size)} | 打开系统默认浏览器的标签页 |
| 🖥️ **桌面版(完整)** | \`${full.name}\` | ${fmtMB(full.size)} | 内置 Chromium 和原生菜单,不依赖任何浏览器 |

**该选哪个?**

| 你的情况 | 选它 |
|---|---|
| 想要桌面程序,但不想下 100 多 MB | **桌面版(轻量)** |
| 只想在浏览器里查一下 | **网页版** |
| 机器上没装 Edge/Chrome,或者想要原生菜单栏 | **桌面版(完整)** |
| 喜欢命令行 | 拿源码跑 \`node cli.js example.com\`,零依赖 |

### 桌面版(轻量)

解压 \`${desktop.name}\` 后双击 **\`域名查询.exe\`**。

程序会在本机起服务,然后用 Edge(或 Chrome)的**应用窗口模式**打开界面 ——
没有标签栏、没有地址栏,在任务栏里是独立的一项,和一个原生程序一样。
用的是独立的临时用户目录,不会碰你平时的浏览记录和书签。

需要机器上装过 Microsoft Edge 或 Chrome(Windows 10/11 默认自带 Edge)。
两者都没有的话会自动回退到默认浏览器。

### 网页版

解压 \`${web.name}\` 后双击 **\`域名查询-web.exe\`**,自动用默认浏览器打开。

### 桌面版(完整)

解压 \`${full.name}\` 后双击 **\`域名查询.exe\`**。这是内置 Chromium 的版本,
窗口大小和位置会记住,菜单栏里有导出、批量检测、主题切换和内置使用说明(\`F1\`)。

体积大是因为里面打包了整个 Chromium —— 如果不介意下载量,这个版本的体验最完整。

### 端口

三个版本默认都用 8420,被占用会自动往后找。想指定端口:
\`\`\`cmd
set PORT=9000 && 域名查询.exe
\`\`\`

---

## 功能

- **WHOIS 查询** —— 通过 TCP 43 端口**直连注册局**,不是抓网页。
  内置 206 个顶级域映射表,冷门后缀会自动向 IANA 查询转介服务器;
  遇到只返回"薄"数据的注册局(如 Verisign 的 \`.com\`)会自动跟随
  \`Registrar WHOIS Server\` 跳到注册商再查一次,把注册人、滥用举报邮箱也拿回来。
- **RDAP 查询** —— 从 IANA 官方 bootstrap 动态获取 **1200+ 个后缀**的服务地址。
- **DNS 记录** —— A / AAAA / CNAME / MX / NS / TXT / SOA / CAA / SRV / PTR,还能解析 CNAME 链。
- **可用性检测** —— WHOIS + DNS + RDAP **三源交叉验证**并给出置信度。
  刻意不用 A 记录判断,因为 NXDOMAIN 劫持会凭空造出 A 记录,而 NS 委派不会。
- **批量查询** —— 一次最多 200 个域名,结果 SSE 实时流式返回。
- **中文域名** —— 自动 punycode 转换,同时显示 Unicode 与 ASCII 形式。
- **导出** —— JSON / CSV / TXT,也可以直接打印成 PDF。

## 系统要求

- Windows 10 / 11 (x64)
- 需要能访问外网(WHOIS 用 43 端口,RDAP 用 443 端口)

## 隐私

所有查询都由你的电脑**直接发往注册局**,不经过任何第三方网站或接口。
本地服务只监听 \`127.0.0.1\`,局域网和公网都访问不到。

## 校验

下载后可对照 \`SHA256SUMS.txt\` 校验完整性:

\`\`\`
${assets.map((a) => `${a.sha256}  ${a.name}`).join('\n')}
\`\`\`

## 许可证

以 **GNU General Public License v3.0 或更新版本**发布。
完整文本见包内的 \`LICENSE\`,源代码在 [本仓库](https://github.com/${process.env.GH_OWNER || 'HeSheng114514'}/${REPO})。
本程序不提供任何担保。
`;
}

/* -------------------- 主流程 -------------------- */

(async () => {
  const me = await gh('/user');
  const owner = process.env.GH_OWNER || me.login;

  console.log('');
  console.log('  发布 Release');
  console.log('  ──────────────────────────────────────────────');
  console.log(`  仓库:  ${owner}/${REPO}`);
  console.log(`  标签:  ${TAG}`);
  console.log('');

  // ---- 1. 检查产物 ----
  for (const p of PACKAGES) {
    if (!fs.existsSync(p.dir)) {
      console.error(`  缺少构建产物: ${p.dir}`);
      console.error('  请先运行: npm run build:all');
      process.exit(1);
    }
  }

  // ---- 2. 压缩 ----
  const assets = [];
  for (const p of PACKAGES) {
    const zipPath = path.join(DIST, p.zipName);
    if (SKIP_ZIP && fs.existsSync(zipPath)) {
      console.log(`  复用已有压缩包: ${p.zipName}`);
    } else {
      const t0 = Date.now();
      process.stdout.write(`  压缩 ${p.label} … `);
      zipDir(p.dir, zipPath);
      console.log(`完成 (${((Date.now() - t0) / 1000).toFixed(1)} 秒)`);
    }
    const size = fs.statSync(zipPath).size;
    assets.push({ ...p, path: zipPath, name: p.zipName, size, sha256: sha256(zipPath) });
    console.log(`    ${p.zipName}  ${fmtMB(size)}`);
  }

  // ---- 3. 校验文件 ----
  const sumsPath = path.join(DIST, 'SHA256SUMS.txt');
  const sums = `${assets.map((a) => `${a.sha256}  ${a.name}`).join('\n')}\n`;
  fs.writeFileSync(sumsPath, sums);
  console.log(`    SHA256SUMS.txt`);
  console.log('');

  // ---- 4. 创建 release ----
  console.log('  创建 Release…');
  let release;
  try {
    release = await gh(`/repos/${owner}/${REPO}/releases/tags/${TAG}`);
    console.log(`  Release ${TAG} 已存在,将复用并补充资源`);
  } catch (err) {
    if (err.status !== 404) throw err;
    release = await gh(`/repos/${owner}/${REPO}/releases`, {
      method: 'POST',
      body: {
        tag_name: TAG,
        target_commitish: 'main',
        name: `${TAG} · 域名查询工具`,
        body: buildReleaseNotes(assets),
        draft: false,
        prerelease: false,
      },
    });
    console.log(`  ✓ Release 已创建`);
  }

  // ---- 5. 上传资源 ----
  // 已存在的同名资源先删掉,避免重复
  const existing = await gh(`/repos/${owner}/${REPO}/releases/${release.id}/assets`);
  const toUpload = [
    ...assets.map((a) => ({ path: a.path, name: a.name, label: a.label })),
    { path: sumsPath, name: 'SHA256SUMS.txt', label: '校验文件' },
  ];

  for (const item of toUpload) {
    const dup = existing.find((e) => e.name === item.name);
    if (dup) {
      await gh(`/repos/${owner}/${REPO}/releases/assets/${dup.id}`, { method: 'DELETE' });
      console.log(`  (覆盖已存在的 ${item.name})`);
    }
  }

  console.log('');
  for (const item of toUpload) {
    const size = fs.statSync(item.path).size;
    process.stdout.write(`  上传 ${item.name} (${fmtMB(size)}) … `);
    const t0 = Date.now();
    const uploaded = await uploadAsset(release.upload_url.split('{')[0], item.path, item.name);
    const secs = (Date.now() - t0) / 1000;
    const speed = size / 1048576 / (secs || 1);
    console.log(`完成 (${secs.toFixed(1)} 秒, ${speed.toFixed(1)} MB/s)`);
    void uploaded;
  }

  // ---- 6. 汇总 ----
  console.log('');
  console.log('  ──────────────────────────────────────────────');
  console.log('  发布完成!');
  console.log(`  Release:  ${release.html_url}`);
  console.log(`  标签:     ${TAG}`);
  console.log('');
  console.log('  资源清单:');
  for (const a of assets) {
    console.log(`    ${a.name.padEnd(46)} ${fmtMB(a.size).padStart(9)}`);
  }
  console.log(`    ${'SHA256SUMS.txt'.padEnd(46)} ${fmtMB(fs.statSync(sumsPath).size).padStart(9)}`);
  console.log('');
})().catch((err) => {
  console.error('');
  console.error(`  发布失败: ${err.message}`);
  if (err.status === 401) console.error('  → token 无效或已过期');
  if (err.status === 403) console.error('  → token 权限不足,需要 Contents 写权限');
  if (err.status === 404) console.error('  → 仓库不存在或无权限');
  console.error('');
  process.exit(1);
});
