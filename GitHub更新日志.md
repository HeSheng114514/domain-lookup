# GitHub 更新日志

本文件记录每次上传到 GitHub 的内容。仓库地址:
<https://github.com/HeSheng114514/domain-lookup>

---

## v1.1.0

**上传时间:** 2026-09-19
**发布:** <https://github.com/HeSheng114514/domain-lookup/releases/tag/v1.1.0>

### 发布产物

| 文件 | 大小 | 说明 |
|---|---|---|
| `domain-lookup-desktop-v1.1.0.zip` | 33.3 MB | 桌面版(轻量),复用系统 Edge/Chrome 内核 |
| `domain-lookup-web-v1.1.0.zip` | 33.3 MB | 网页版 |
| `domain-lookup-desktop-full-v1.1.0-win32-x64.zip` | 128.7 MB | 桌面版(完整),内置 Chromium |
| `SHA256SUMS.txt` | — | 校验和 |

### 本次更新内容:体积缩减

**问题**:桌面版 zip 有 139 MB,其中 73% 是打包进去的 Chromium。
实测各文件对压缩包的贡献:

| 文件 | 压缩后 | 占比 |
|---|---|---|
| `域名查询.exe`(Electron 核心) | 102.1 MB | 73.4% |
| `resources.pak` | 11.8 MB | 8.5% |
| `dxcompiler.dll` | 9.7 MB | 7.0% |
| `icudtl.dat` | 4.4 MB | 3.2% |
| 其余 | ~11 MB | ~8% |

结论:光删文件最多省 7%,真正的解法是**不打包 Chromium**。

**改动一:新增「桌面版(轻量)」—— 33.3 MB**

- `sea/entry.js` 增加 app 模式:起服务后用 Edge/Chrome 的 `--app` 打开界面,
  得到无标签栏、无地址栏的独立窗口,任务栏单独一项
- 使用独立的临时用户目录(`%TEMP%\domain-lookup-app-window`),不碰用户平时的浏览数据
- 找不到 Edge/Chrome 时自动回退到系统默认浏览器
- `tools/build-web.js` 重写:同一份代码通过 esbuild 的 `define` 注入模式常量,
  一次构建出 web 与 app 两个 exe

**改动二:完整桌面版裁剪 —— 139.1 MB → 128.7 MB**

- 删除 `dxcompiler.dll` + `dxil.dll`(WebGPU 着色器编译器,本应用不使用),
  删后 24 项桌面端自检全通过
- 实测发现 `ffmpeg.dll` 是 Electron 启动的**硬依赖**:删掉后进程能起来但窗口不出现,
  自检会挂死 —— 因此保留,并把这个结论写进代码注释

**改动三:文档**

- README 新增「关于体积」章节,拆解各组成部分的体积来源
- 下载表格改为三个包,并给出「该选哪个」的对照表

### 源码文件

本次上传共 38 个文件(不含 `node_modules/` 与 `dist/`)。

---

## v1.0.0

**上传时间:** 2026-09-19
**提交:** `a15211d`
**发布:** <https://github.com/HeSheng114514/domain-lookup/releases/tag/v1.0.0>

### 发布产物

| 文件 | 大小 | 说明 |
|---|---|---|
| `domain-lookup-desktop-v1.0.0-win32-x64.zip` | 139.1 MB | 桌面版,双击 `域名查询.exe` |
| `domain-lookup-web-v1.0.0.zip` | 33.3 MB | 网页版单文件,双击 `域名查询-web.exe` |
| `SHA256SUMS.txt` | — | 校验和 |

两个版本均为免安装,目标机器不需要安装 Node.js。

### 本次更新内容

**许可证变更**

- LICENSE 由 MIT 更换为 **GNU GPL v3.0 全文**
- `package.json` 的 license 字段标为 `GPL-3.0-or-later`
- README 补充许可说明与第三方组件清单(Node.js / Electron / esbuild / postject)
- 桌面版与网页版的打包产物内均附带 `LICENSE` 与 `说明.txt`

**新增:网页端单文件免安装版**

- 新增 `sea/entry.js` —— 单文件版入口:启动后自动打开浏览器、
  端口被占用时自动顺延、支持优雅退出
- 新增 `lib/assets.js` —— 静态资源读取层,SEA 构建时优先读内嵌资源、
  否则回退磁盘。`server.js` 无需分叉即可同时支持源码模式与单文件模式
- 新增 `tools/build-web.js` —— 构建流程:esbuild 打包 → 生成 SEA blob →
  剥离 node.exe 的 Authenticode 签名 → postject 注入,产出 89 MB 的免安装 exe
- 新增 `tests/verify-web.js` —— 15 项端到端验证(启动 exe、请求接口、发真实查询)

**发布流程工具**

- 新增 `tools/github-release.js` —— 分别压缩桌面端与网页端、生成
  `SHA256SUMS.txt`、创建 tag 并上传 Release
- `tools/github-publish.js` 支持 `GH_MESSAGE` 自定义提交信息,
  并跳过 `build/` 下的构建中间产物

**文档**

- README 重写:新增「下载」章节(说明两个版本的区别与选择建议)、
  「构建发布产物」章节(含 SEA 打包原理)
- 项目结构、测试说明同步更新

### 源码文件

本次上传共 35 个文件(不含 `node_modules/` 与 `dist/`)。

---

## 历史提交

| 时间 | 提交 | 内容 |
|---|---|---|
| 2026-09-19 | `a15211d` | 改为 GPL-3.0 开源,新增网页端单文件打包 |
| 2026-09-19 | `d4d0684` | 首次上传:WHOIS / RDAP / DNS 桌面版 + 网页版 + 命令行完整实现 |

---

## 待办 / 下次计划

- 无

---

> 说明:按照约定,后续对仓库的任何修改都会**先征得同意**再上传。
