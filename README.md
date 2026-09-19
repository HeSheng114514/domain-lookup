# 域名查询工具

一个**零依赖**的域名信息查询工具,支持 WHOIS、RDAP、DNS 记录查询和域名可用性检测。
有**桌面软件**、**本地网页**和**命令行**三种用法。

所有查询都是**直接走协议**:WHOIS 用 TCP 43 端口直连注册局,RDAP 用 HTTPS 直连注册局,
不经过任何第三方网站的接口或爬虫,所以没有速率陷阱,数据也最原始可靠。

```
┌─────────────────────────────────────────────────────────────┐
│  域名查询工具                                                │
│  WHOIS · RDAP · DNS · 可用性检测                             │
├─────────────────────────────────────────────────────────────┤
│  [ example.com                                    ] [查询]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 方式一:桌面软件(推荐)

打包好的程序在 **`dist/域名查询-win32-x64/`**,双击里面的 **`域名查询.exe`** 即可启动。

- 独立的桌面窗口,有自己的任务栏图标,不是浏览器标签页
- **不需要安装 Node.js**,整个文件夹拷到任何 Windows 10/11 电脑上都能直接跑
- 桌面和开始菜单里已经有快捷方式了

如果还没打包,或者想重新生成:

```bash
npm install                 # 安装 Electron(仅打包需要,运行时不需要)
node tools/build-desktop.js # 打包成免安装程序 → dist/
node tools/make-shortcut.js # 创建桌面 + 开始菜单快捷方式
```

> 第一次 `npm install` 要下载约 150MB 的 Electron 二进制。如果卡住或失败,
> 可以指定国内镜像加速:
> ```bash
> set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> npm install
> ```

### 方式二:本地网页

不想要桌面版的话,也可以只跑 Web 服务:

```bash
node server.js
```

然后浏览器打开 **http://127.0.0.1:8420**

Windows 用户可以双击 **`启动.bat`**,它会自动打开浏览器(默认端口 8420,可传参换端口):

```cmd
启动.bat 9000
```

### 方式三:命令行

```bash
node cli.js example.com                  # WHOIS + DNS 概览
node cli.js example.com --raw            # 只看 WHOIS 原始响应
node cli.js example.com --dns            # 只看 DNS 记录
node cli.js example.com --json           # 输出 JSON,方便脚本处理
node cli.js a.com b.net --check          # 批量可用性检测
node cli.js --tlds co                    # 搜索内置支持的顶级域
node cli.js --help                       # 完整帮助
```

命令行和本地网页**只需要 Node.js 18+,不需要任何第三方依赖**。Electron 只是打包桌面版时
才用到的开发依赖。


---

## 功能

### 1. WHOIS 查询

这是工具的核心。完整的查询流程:

1. **确定注册局服务器** —— 先查内置的 206 个 TLD 映射表;表里没有的后缀,自动向
   `whois.iana.org` 查询 `refer:` 字段动态发现注册局服务器。所以**绝大多数后缀都能查**,
   不只是常见的 `.com`/`.cn`。
2. **连接注册局** —— 通过 TCP 43 端口直连。
3. **跟随转介** —— 很多注册局(如 Verisign 的 `.com`)只返回"薄"数据,真正的注册商信息需要
   再查一次。工具会读取响应里的 `Registrar WHOIS Server:` 字段,**自动跳到注册商服务器**
   再查一次,把注册人、滥用举报邮箱等信息也拿回来。
4. **限流保护** —— 同一个 WHOIS 服务器两次查询之间强制间隔 900ms;如果响应里出现
   `connection limit exceeded` 之类的限流提示,会自动退避重试。

查询结果会被解析成结构化字段:**注册商、注册/到期/更新日期、域名年龄、剩余天数、
EPP 状态码、域名服务器、DNSSEC 状态、注册人信息**。

### 2. EPP 状态码中文解释

WHOIS 返回的状态码是 `clientTransferProhibited` 这种驼峰英文,工具内置了对照表,
显示时自动翻译并解释含义:

| 状态码 | 中文 | 含义 |
|---|---|---|
| `clientTransferProhibited` | 客户端禁止转移 | 域名持有人锁定了转移,防止被恶意转出 |
| `clientHold` | 客户端暂停解析 | 域名被暂停,不解析 DNS(通常因未验证邮箱或欠费) |
| `serverHold` | 注册局暂停解析 | 注册局暂停了域名解析 |
| `redemptionPeriod` | 赎回期 | 域名已过期,处于高价赎回期 |
| `pendingDelete` | 待删除 | 域名即将被删除释放 |
| `active` / `ok` | 正常 | 域名状态正常 |

### 3. RDAP 查询

RDAP 是 WHOIS 的现代替代协议,返回结构化 JSON,由 ICANN 强制要求所有 gTLD 注册局提供。
工具从 IANA 官方 bootstrap 文件(`https://data.iana.org/rdap/dns.json`)动态获取
**1200+ 个后缀**的 RDAP 服务地址,并带内置映射兜底。

WHOIS 和 RDAP 的结果会自动合并:**WHOIS 优先**(它有中文状态解释),RDAP 用来补全
WHOIS 缺失的字段。两者都失败时也不影响单独使用。

### 4. DNS 记录查询

支持 `A`、`AAAA`、`CNAME`、`MX`、`NS`、`TXT`、`SOA`、`CAA`、`SRV`、`PTR` 全部常见类型,
可以指定自定义 DNS 服务器:

```bash
node cli.js example.com --dns --type=MX,TXT --server=8.8.8.8
```

### 5. 域名可用性检测

判断一个域名能不能注册看起来简单,实际上**单一数据源都不可靠**:

- WHOIS 说 "not found",可能只是被限流了
- DNS 查不到记录,不代表没注册(注册了但没配解析)
- RDAP 有很多 ccTLD 根本不提供

所以工具用**三个数据源交叉验证**,并给出置信度:

| 数据源 | 判为"已注册"的依据 | 判为"可注册"的依据 |
|---|---|---|
| WHOIS | 存在注册记录 | 返回 `no match` / `not found` |
| DNS | 存在 **NS 或 SOA 委派** | NS 和 SOA 均返回 NXDOMAIN |
| RDAP | 返回域名对象 | 返回 404 |

**关于 DNS 判定的一点说明:** 这里刻意**不使用 A/AAAA 记录**作为"已注册"的依据。
因为 NXDOMAIN 劫持很常见 —— 部分运营商和企业 DNS 会把不存在的域名解析到自己的
广告页或保留地址段(如 `198.18.0.0/15`),凭空造出一条 A 记录。已注册的域名一定有
NS 委派,而劫持不会有。工具会检测这种异常并在界面上提示。

批量检测通过 SSE 实时流式返回结果,支持 200 个域名、可调并发:

```bash
node cli.js --bulk domains.txt --check --concurrency=6
```

### 6. 国际化域名(IDN)

自动做 punycode 转换,中文、日文、emoji 域名都能查:

```
输入:  中国互联网络信息中心.中国
转换:  xn--fiqa61au8b7zevnm8ak20mc4a87e.xn--fiqs8s
结果:  已注册 · 注册商 北京新网数码信息技术有限公司 · 注册人 中国互联网络信息中心
```

界面上会同时显示 Unicode 形式和 punycode 形式。

### 7. 其他

- **导** —— 结果可导出 JSON / CSV / TXT,或一键复制摘要
- **分享链接** —— 查询后地址栏会变成 `?domain=example.com`,可以直接分享
- **域名解析** —— 自动识别 `https://example.com/path?a=1` 这种 URL 输入,连端口和用户名也能剥离
- **子域识别** —— 内置 296 条多级公共后缀规则,能正确算出 `.com.cn`、`.co.uk`、`.com.au`
  这类域名的"可注册主体"
- **深色/浅色主题** —— 右上角切换,记忆在 localStorage

---

## 项目结构

```
域名查询/
├── server.js               HTTP 服务 + REST API + 静态资源
├── cli.js                  命令行工具
├── 启动.bat                Windows 一键启动网页版
├── package.json
├── electron/               桌面版(仅打包时用到 Electron)
│   ├── main.js             主进程:内嵌服务、窗口、菜单、单实例
│   └── selftest.js         桌面版自检
├── tools/
│   ├── make-icon.js        生成图标(手写 PNG/ICO 编码器)
│   ├── build-desktop.js    打包成免安装 exe
│   ├── make-shortcut.js    创建桌面/开始菜单快捷方式
│   └── github-publish.js   发布到 GitHub(不需要装 git)
├── lib/
│   ├── tld-servers.js      TLD → WHOIS 服务器映射表(206 个)
│   ├── domain.js           域名规范化 / punycode / 公共后缀解析
│   ├── whois.js            WHOIS 协议客户端(TCP 43 + 转介 + 限流)
│   ├── parse.js            WHOIS 文本解析器(兼容 20+ 种注册局格式)
│   ├── rdap.js             RDAP 客户端 + IANA bootstrap + JSON 归一化
│   ├── dns.js              DNS 查询 + 劫持检测
│   ├── availability.js     三源交叉验证可用性检测
│   └── merge.js            WHOIS/RDAP 结果合并策略
├── public/
│   ├── index.html          界面结构
│   ├── help.html           应用内使用说明
│   ├── style.css           样式(深色/浅色主题)
│   └── app.js              前端逻辑
├── build/                  生成的应用图标
└── tests/
    ├── run.js              测试套件
    └── manual.js           手工联调脚本
```

---

## 桌面版细节

### 它是怎么工作的

桌面版本质上是一个 Electron 外壳:**HTTP 服务直接跑在主进程里**,绑定
`127.0.0.1` 上的**随机空闲端口**,窗口再加载这个本地地址。

这样做的好处:

- 不占用固定端口,不会和别的程序冲突
- 服务**只监听回环地址**,局域网和公网都访问不到,不暴露任何信息
- 渲染进程关闭了 `nodeIntegration`、开启 `contextIsolation`,网页里拿不到任何系统权限
- 页面里的外链一律交给系统默认浏览器打开,不在应用内导航

窗口大小和位置会记住;第二次启动时会聚焦已有窗口而不是开新的。

### 菜单功能

| 菜单 | 功能 |
|---|---|
| 文件 | 新建查询、导出 TXT / CSV、复制摘要、打印/另存为 PDF |
| 编辑 | 撤销/重做/复制/粘贴,聚焦查询框 |
| 视图 | 重新加载、缩放、全屏、开发者工具 |
| 工具 | 在浏览器中打开本机服务、打开数据目录、跳转批量检测、切换主题 |
| 帮助 | 使用说明(F1)、关于 |

### 自己验证桌面版

桌面版带一个自检模式,会在**真实的 Electron 运行时**里跑完整流程:
加载窗口 → 启动内嵌服务 → 执行前端脚本 → 发真实 WHOIS 查询 → 校验界面渲染。

```bash
set DL_SELFTEST=1
npm run desktop
```

打包后的 exe 是 GUI 程序,控制台看不到输出,报告会同时写进文件
(路径见环境变量 `DL_SELFTEST_OUT`,默认在系统临时目录):

```cmd
set DL_SELFTEST=1
set DL_SELFTEST_OUT=%TEMP%\report.txt
dist\域名查询-win32-x64\域名查询.exe
```

当前打包产物通过 **24/24** 项自检。

---

## HTTP API

桌面版和网页版背后是同一套简洁的 REST API,可以直接调用:

| 接口 | 说明 |
|---|---|
| `GET /api/full?domain=x` | 一次拿全 WHOIS + DNS + RDAP(界面主接口) |
| `GET /api/whois?domain=x` | 只查 WHOIS,`deep=0` 可关闭注册商二次查询 |
| `GET /api/rdap?domain=x` | 只查 RDAP |
| `GET /api/dns?domain=x&types=A,MX` | 只查 DNS,`chain=1` 附带 CNAME 解析链 |
| `GET /api/check?domain=x` | 可用性检测 |
| `GET /api/bulk?domains=a.com,b.net` | 批量检测,SSE 流式返回 |
| `GET /api/meta` | 运行环境信息(支持的 TLD 数、DNS 服务器等) |
| `GET /api/tlds?q=co` | 搜索支持的顶级域 |

示例:

```bash
curl "http://127.0.0.1:8420/api/check?domain=example.com"
```

```json
{
  "available": false,
  "confidence": "high",
  "votes": { "registered": 3, "available": 0 },
  "evidence": [
    { "source": "WHOIS", "verdict": "registered", "detail": "注册于 1995-08-14" },
    { "source": "DNS",   "verdict": "registered", "detail": "存在 2 条 NS 委派(域名已在注册局完成委派)" },
    { "source": "RDAP",  "verdict": "registered", "detail": "handle=2336799_DOMAIN_COM-VRSN" }
  ]
}
```

> 桌面版用的是随机端口,想看实际端口可以打开「帮助 → 关于」。

---


## 测试

```bash
node tests/run.js          # 离线单元测试(65 项,不联网)
node tests/run.js --net    # 加上真实网络测试(共 73 项)
node tests/manual.js example.com google.cn    # 手工联调,打印解析细节
```

离线测试覆盖域名规范化、11 种日期格式解析、5 种注册局 WHOIS 格式解析
(Verisign / CNNIC / DENIC / JPRS)、未注册判定、转介提取、IP 分类、结果合并、RDAP 归一化。

网络测试会真实查询 WHOIS、RDAP 和 DNS,并验证可用性判定不受 DNS 劫持影响。

桌面版另有 24 项自检(见上一节)。

---

## 发布到 GitHub

`tools/github-publish.js` 可以把项目发布到 GitHub,**不需要本机安装 git** ——
它直接用 GitHub 的 Git Data API(blob → tree → commit → ref),所有文件放在同一个提交里。

```bash
set GH_TOKEN=你的token
node tools/github-publish.js
```

| 环境变量 | 说明 |
|---|---|
| `GH_TOKEN` | 必填,Personal Access Token(需要 `repo` / `public_repo` 权限) |
| `GH_REPO` | 仓库名,默认 `domain-lookup` |
| `GH_OWNER` | 仓库所属账号,默认取 token 对应的账号 |
| `GH_PRIVATE` | 设为 `1` 创建私有仓库 |
| `GH_SQUASH` | 设为 `1` 把已有历史压成单条提交 |

脚本会自动跳过 `node_modules/`、`dist/` 和任何文件名含 `token` 的文件,
不会把凭据或几百 MB 的构建产物推上去。

> **注意**:GitHub 不允许在完全没有提交的仓库上创建 blob(会返回
> `409 Git Repository is empty`)。脚本遇到空仓库会先用 README 播种一个初始提交,
> 最后再把分支强制指向正式提交,所以历史里只会看到一条干净的提交。



---

## 已知限制

- **不是所有后缀都支持 WHOIS** —— 少数后缀(如部分新的 gTLD)只有 RDAP。工具会自动降级。
- **注册人信息大多已脱敏** —— 受 GDPR 和 ICANN 临时政策影响,绝大多数域名的注册人姓名、
  邮箱、地址都不再公开,这是行业现状而非工具问题。工具会明确提示"信息已脱敏"。
- **WHOIS 限流** —— 注册局对同一 IP 有频率限制。工具已做节流和退避重试,但短时间内
  大量查询仍可能触发限流,此时结果会标注"注册局限流,结果可能不完整"。
- **可用性仅供参考** —— 交叉验证能大幅提高准确率,但最终能否注册还取决于注册商的实时
  状态(溢价域名、保留域名等)。批量结果请以注册商为准。
- **日期时区** —— 注册局返回不带时区的时间一律按 UTC 解释(这是注册局数据的惯例)。
  极少数注册局可能用本地时间,这种情况下时间可能偏差几小时。

---

## 实现要点

几个值得说明的技术决策:

**为什么不用现成的 npm 包?** `whois` 之类的包质量参差,而且这个工具的核心价值恰恰在于
对各家注册局格式差异的处理 —— 这需要自己掌控解析逻辑。零依赖还有个好处:不需要
`npm install`,拷贝走就能跑。

**为什么 WHOIS 优先于 RDAP?** RDAP 的 JSON 更规整,但覆盖不全,而且状态码没有中文解释。
WHOIS 是注册局的第一手数据。合并时以 WHOIS 为主、RDAP 补空,兼顾准确性和完整性。

**为什么可用性检测不用 A 记录?** 见上文"关于 DNS 判定的一点说明" —— 这是实践中踩出来的
教训:NXDOMAIN 劫持会凭空造出 A 记录,而 NS 委派不会。

**为什么解析器要处理这么多格式?** 各家注册局的 WHOIS 输出格式毫无统一标准:
Verisign 用 `Key: Value`,DENIC 用全小写无缩进,JPRS 用 `[Key] Value` 方括号,
RIPE 风格用小写 key。解析器同时支持这几种,并对每个字段维护了别名表。

---

## 许可

MIT
