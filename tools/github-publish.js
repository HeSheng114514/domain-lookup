'use strict';

/**
 * 把项目发布到 GitHub —— node tools/github-publish.js
 *
 * 不依赖 git(这台机器上没装),直接用 GitHub 的 Git Data API:
 *   创建 blob -> 组装 tree -> 创建 commit -> 更新 ref
 * 所有文件放在同一个 commit 里,不会产生一堆"添加文件"的碎提交。
 *
 * Token 从环境变量 GH_TOKEN 读取,任何情况下都不会被打印出来。
 *
 * 环境变量:
 *   GH_TOKEN   必填,Personal Access Token
 *   GH_OWNER   可选,仓库所属账号(默认用 token 对应的账号)
 *   GH_REPO    可选,仓库名(默认 domain-lookup)
 *   GH_PRIVATE 可选,设为 1 则创建私有仓库
 *   GH_DESC    可选,仓库描述
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GH_REPO || 'domain-lookup';
const PRIVATE = process.env.GH_PRIVATE === '1';
/** 强制把仓库历史压成单条提交(用于整理刚建好的仓库) */
const SQUASH = process.env.GH_SQUASH === '1';
const DESCRIPTION = process.env.GH_DESC
  || '域名查询工具:WHOIS / RDAP / DNS / 可用性检测。零依赖 Node.js 实现,带桌面版、网页版和命令行。';

/** 这些目录不进仓库 */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'out', '.git', '.cache']);
/** 这些文件名不进仓库 */
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
/**
 * 这些相对路径不进仓库。
 * 注意用通配而不是写死文件名 —— 构建脚本改一次产物命名,写死的规则就会失效,
 * 之前就因此把 blob 传上去过。
 */
const SKIP_PATTERNS = [
  /^build\/.*-bundle\.cjs$/,
  /^build\/.*-sea-config\.json$/,
  /^build\/.*-prep\.blob$/,
  /^build\/web-bundle\.cjs$/,
  /^build\/sea-config\.json$/,
  /^build\/sea-prep\.blob$/,
  /^build\/tmp\//,
  // 更新日志按约定只保留在本地
  /^GitHub更新日志\.md$/,
];

/**
 * 需要从仓库里删掉的路径(之前误传上去的)。
 * GitHub 的 tree API 用 base_tree 时,不提到的文件会保留,
 * 所以删除必须显式地把 sha 设成 null。
 */
const DELETE_PATHS = [
  'build/web-bundle.cjs',
  'build/sea-config.json',
  'build/sea-prep.blob',
  'build/app-bundle.cjs',
  'build/app-prep.blob',
  'build/app-sea-config.json',
  'build/web-prep.blob',
  'build/web-sea-config.json',
  'GitHub更新日志.md',
];

/** 大文件保护:超过这个大小就拒绝上传(正常文件都远小于它) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

if (!TOKEN) {
  console.error('缺少环境变量 GH_TOKEN');
  process.exit(1);
}

/* -------------------- GitHub API 封装 -------------------- */

async function gh(apiPath, options = {}) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'domain-lookup-publisher',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 非 JSON 响应 */ }

  if (!res.ok) {
    const msg = (json && json.message) || String(text).slice(0, 200) || '(无错误信息)';
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    err.detail = json && json.errors ? JSON.stringify(json.errors) : '';
    throw err;
  }
  return json;
}

/* -------------------- 收集文件 -------------------- */

function collectFiles(dir, base = dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectFiles(full, base, acc);
      continue;
    }
    if (!entry.isFile()) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    if (SKIP_PATTERNS.some((re) => re.test(rel))) {
      console.log(`  跳过构建中间产物: ${rel}`);
      continue;
    }
    if (/token/i.test(entry.name)) {
      console.log(`  跳过疑似凭据文件: ${rel}`);
      continue;
    }

    const stat = fs.statSync(full);
    if (stat.size > MAX_FILE_SIZE) {
      console.log(`  跳过超大文件(${(stat.size / 1048576).toFixed(1)} MB): ${rel}`);
      continue;
    }
    acc.push({ full, rel, size: stat.size });
  }
  return acc;
}

/* -------------------- 主流程 -------------------- */

(async () => {
  // ---- 1. 确认身份 ----
  const me = await gh('/user');
  const owner = process.env.GH_OWNER || me.login;
  console.log('');
  console.log('  发布到 GitHub');
  console.log('  ──────────────────────────────────────────────');
  console.log(`  账号:     ${me.login}`);
  console.log(`  仓库:     ${owner}/${REPO}`);
  console.log(`  可见性:   ${PRIVATE ? '私有' : '公开'}`);
  console.log('');

  // ---- 2. 创建仓库(已存在就复用) ----
  let repoInfo = null;
  try {
    repoInfo = await gh(`/repos/${owner}/${REPO}`);
    console.log(`  仓库已存在,将更新其中的文件`);
  } catch (err) {
    if (err.status !== 404) throw err;
    console.log('  正在创建仓库…');
    repoInfo = await gh('/user/repos', {
      method: 'POST',
      body: {
        name: REPO,
        description: DESCRIPTION,
        private: PRIVATE,
        has_issues: true,
        has_wiki: false,
        has_projects: false,
        auto_init: false,
      },
    });
    console.log(`  ✓ 仓库已创建`);
  }
  const defaultBranch = repoInfo.default_branch || 'main';

  // ---- 3. 收集文件 ----
  const files = collectFiles(ROOT).sort((a, b) => a.rel.localeCompare(b.rel));
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  console.log('');
  console.log(`  待上传 ${files.length} 个文件,共 ${(totalBytes / 1024).toFixed(1)} KB`);

  // ---- 4. 确认仓库非空 ----
  // GitHub 的 Git Data API 在"完全没有提交"的仓库上会直接返回
  // 409 Git Repository is empty,连 blob 都不让建。
  // 所以空仓库要先通过 Contents API 播种一个初始提交,拿到 ref 之后再继续。
  let parentSha = null;
  let baseTree;
  let baseTreePaths = [];
  let seeded = false;

  try {
    const ref = await gh(`/repos/${owner}/${REPO}/git/ref/heads/${defaultBranch}`);
    parentSha = ref.object.sha;
    const parentCommit = await gh(`/repos/${owner}/${REPO}/git/commits/${parentSha}`);
    baseTree = parentCommit.tree.sha;
    // 取回仓库现有文件列表,后面用来提示哪些文件会因为"以本地为准"而被移除
    try {
      const bt = await gh(`/repos/${owner}/${REPO}/git/trees/${baseTree}?recursive=1`);
      baseTreePaths = (bt.tree || []).filter((e) => e.type === 'blob').map((e) => e.path);
    } catch { /* 拿不到就算了,只是个提示 */ }
    console.log(`  基于已有提交 ${parentSha.slice(0, 7)} 更新(仓库现有 ${baseTreePaths.length} 个文件)`);
  } catch (err) {
    if (err.status !== 404 && err.status !== 409) throw err;
    console.log('  空仓库,先播种一个初始提交(GitHub 不允许在空仓库上建 blob)');
    const readme = files.find((f) => f.rel === 'README.md');
    const seed = readme
      ? fs.readFileSync(readme.full).toString('base64')
      : Buffer.from(`# ${REPO}\n`).toString('base64');
    await gh(`/repos/${owner}/${REPO}/contents/README.md`, {
      method: 'PUT',
      body: { message: '初始化仓库', content: seed, branch: defaultBranch },
    });
    // 播种之后分支已经存在了,取回它的 sha,这样最后一步会走"强制更新"
    // 而不是"新建引用"(后者会因为引用已存在而报 422)。
    const seededRef = await gh(`/repos/${owner}/${REPO}/git/ref/heads/${defaultBranch}`);
    parentSha = seededRef.object.sha;
    seeded = true;
    console.log('  ✓ 初始提交已创建');
  }

  // ---- 5. 逐个创建 blob ----
  console.log('');
  console.log('  正在创建 blob…');
  const treeEntries = [];
  let done = 0;
  for (const f of files) {
    const content = fs.readFileSync(f.full).toString('base64');
    const blob = await gh(`/repos/${owner}/${REPO}/git/blobs`, {
      method: 'POST',
      body: { content, encoding: 'base64' },
    });
    treeEntries.push({ path: f.rel, mode: '100644', type: 'blob', sha: blob.sha });
    done += 1;
    process.stdout.write(`\r    [${String(done).padStart(2)}/${files.length}] ${f.rel.padEnd(42).slice(0, 42)}`);
  }
  process.stdout.write('\n');
  console.log(`  ✓ ${treeEntries.length} 个 blob 创建完成`);

  // ---- 6. 组装 tree ----
  // 这里**不带 base_tree**,而是用本地文件列表组成一棵完整的树。
  // 原因:用 base_tree 时没提到的路径会保留,要删文件就得把 sha 设成 null,
  // 而 GitHub 对那种写法的支持不太稳(实测会报 GitRPC::BadObjectState)。
  // 直接用完整树,仓库内容就等于本地文件列表,不多不少,也不需要"删除"这个概念。
  const removed = baseTreePaths.filter((p) => !files.some((f) => f.rel === p));

  const tree = await gh(`/repos/${owner}/${REPO}/git/trees`, {
    method: 'POST',
    body: { tree: treeEntries },
  });
  console.log(`  ✓ tree 创建完成 ${tree.sha.slice(0, 7)}`);
  if (removed.length) {
    console.log(`  ✓ 仓库内容以本地为准,移除 ${removed.length} 个多余文件:`);
    for (const p of removed.slice(0, 12)) console.log(`      - ${p}`);
    if (removed.length > 12) console.log(`      … 等共 ${removed.length} 个`);
  }

  // ---- 7. 创建 commit ----
  // 如果刚才为了播种建过一个提交,这里就建一个"无父提交"的 commit,
  // 然后把分支强制指过来 —— 这样仓库历史里只有这一个干净的提交,
  // 而不是"初始化仓库" + "正式提交"两条。
  // GH_SQUASH=1 可以强制把已有历史也压成单条提交。
  const useParent = parentSha && !seeded && !SQUASH;

  const message = useParent
    ? (process.env.GH_MESSAGE || '更新项目文件\n\n由 tools/github-publish.js 发布')
    : `域名查询工具:WHOIS / RDAP / DNS 完整实现

- WHOIS 协议客户端:TCP 43 直连注册局,206 个 TLD 映射 + IANA 自动转介,
  并跟随 Registrar WHOIS Server 二次查询拿注册商信息,带服务端节流与限流退避
- WHOIS 文本解析器:兼容 Verisign / CNNIC / DENIC / JPRS 等 20+ 种注册局格式
- RDAP 客户端:IANA bootstrap 动态获取 1200+ 个后缀的服务地址
- DNS 查询:10 种记录类型 + NXDOMAIN 劫持检测
- 可用性检测:WHOIS / DNS / RDAP 三源交叉验证,带置信度
- 桌面版(Electron):独立窗口、中文菜单、应用内使用说明
- 网页版与命令行版:零第三方依赖
- 测试:65 项离线单元测试 + 8 项真实网络测试 + 24 项桌面版自检`;

  const commit = await gh(`/repos/${owner}/${REPO}/git/commits`, {
    method: 'POST',
    body: { message, tree: tree.sha, parents: useParent ? [parentSha] : [] },
  });
  console.log(`  ✓ commit 创建完成 ${commit.sha.slice(0, 7)}`);

  // ---- 8. 更新分支引用 ----
  if (parentSha) {
    await gh(`/repos/${owner}/${REPO}/git/refs/heads/${defaultBranch}`, {
      method: 'PATCH',
      body: { sha: commit.sha, force: true },
    });
  } else {
    await gh(`/repos/${owner}/${REPO}/git/refs`, {
      method: 'POST',
      body: { ref: `refs/heads/${defaultBranch}`, sha: commit.sha },
    });
  }
  console.log(`  ✓ 分支 ${defaultBranch} 已更新`);

  // ---- 9. 汇总 ----
  console.log('');
  console.log('  ──────────────────────────────────────────────');
  console.log(`  完成!`);
  console.log(`  仓库地址:  ${repoInfo.html_url}`);
  console.log(`  提交:      ${commit.sha.slice(0, 7)}`);
  console.log(`  分支:      ${defaultBranch}`);
  console.log(`  文件数:    ${treeEntries.length}`);
  console.log('');
})().catch((err) => {
  console.error('');
  console.error(`  发布失败: ${err.message}`);
  if (err.detail) console.error(`  详情: ${err.detail}`);
  if (err.status === 401) console.error('  → token 无效或已过期');
  if (err.status === 403) console.error('  → token 权限不足(经典 PAT 需要 repo 权限;细粒度 PAT 需要 Contents 和 Administration 的写权限)');
  if (err.status === 422) console.error('  → 仓库名可能已被占用,或分支已存在(脚本会强制更新已有分支)');
  console.error('');
  process.exit(1);
});
