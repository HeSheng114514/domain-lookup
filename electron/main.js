'use strict';

/**
 * Electron 主进程 —— 把域名查询工具变成桌面软件。
 *
 * 设计要点:
 *  - HTTP 服务直接跑在主进程里,绑定 127.0.0.1 的随机空闲端口,
 *    这样不会和别的程序抢端口,也从网络上不可达(只监听回环地址)。
 *  - 渲染进程关闭 nodeIntegration、开启 contextIsolation,只当成普通网页。
 *  - 窗口大小/位置会记住。
 */

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');

const ROOT = path.join(__dirname, '..');
const ICON_ICO = path.join(ROOT, 'build', 'icon.ico');
const ICON_PNG = path.join(ROOT, 'build', 'icon.png');

const APP_TITLE = '域名查询工具';
const APP_ID = 'com.domainlookup.desktop';

/** 运行期状态 */
const state = {
  server: null,
  port: null,
  win: null,
  meta: null,
};

/* ============================ 窗口状态记忆 ============================ */

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const fallback = { width: 1280, height: 900, maximized: false };
  try {
    const raw = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (!raw || typeof raw !== 'object') return fallback;
    return {
      width: Math.max(900, raw.width || fallback.width),
      height: Math.max(600, raw.height || fallback.height),
      x: Number.isInteger(raw.x) ? raw.x : undefined,
      y: Number.isInteger(raw.y) ? raw.y : undefined,
      maximized: !!raw.maximized,
    };
  } catch {
    return fallback;
  }
}

function saveWindowState() {
  if (!state.win || state.win.isDestroyed()) return;
  try {
    const maximized = state.win.isMaximized();
    // 最大化时保存"还原后"的尺寸,否则下次启动会变成全屏
    const b = maximized ? state.win.getNormalBounds() : state.win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({
      width: b.width, height: b.height, x: b.x, y: b.y, maximized,
    }, null, 2));
  } catch { /* 写不进去就算了 */ }
}

/* ============================ 启动内嵌服务 ============================ */

function startServer() {
  return new Promise((resolve, reject) => {
    let createServer;
    try {
      ({ createServer } = require(path.join(ROOT, 'server.js')));
    } catch (err) {
      reject(new Error(`加载服务模块失败:${err.message}`));
      return;
    }

    const server = createServer();
    server.on('error', (err) => reject(new Error(`服务启动失败:${err.message}`)));

    // 端口传 0 让系统分配一个空闲端口,只监听回环地址
    server.listen(0, '127.0.0.1', () => {
      state.server = server;
      state.port = server.address().port;
      resolve(state.port);
    });
  });
}

/* ============================ 菜单 ============================ */

/** 在渲染进程里执行一段 JS(用于菜单项触发界面动作) */
function runInPage(js) {
  if (state.win && !state.win.isDestroyed()) {
    state.win.webContents.executeJavaScript(js).catch(() => {});
  }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: '文件',
      submenu: [
        {
          label: '新建查询',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            runInPage(`
              document.getElementById('domainInput').value = '';
              document.getElementById('clearBtn').click();
              document.getElementById('domainInput').focus();
            `);
          },
        },
        {
          label: '导出当前结果为 TXT',
          accelerator: 'CmdOrCtrl+S',
          click: () => runInPage(`document.getElementById('exportTxt')?.click()`),
        },
        {
          label: '导出当前结果为 CSV',
          click: () => runInPage(`document.getElementById('exportCsv')?.click()`),
        },
        {
          label: '复制结果摘要',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => runInPage(`document.getElementById('copyBtn')?.click()`),
        },
        { type: 'separator' },
        {
          label: '打印 / 另存为 PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => runInPage(`window.print()`),
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
        { type: 'separator' },
        {
          label: '查找域名',
          accelerator: 'CmdOrCtrl+F',
          click: () => runInPage(`document.getElementById('domainInput').focus()`),
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', click: () => state.win?.reload() },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', click: () => state.win?.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
        { role: 'toggleDevTools', label: '开发者工具' },
      ],
    },
    {
      label: '工具',
      submenu: [
        {
          label: '在浏览器中打开本机服务',
          click: () => {
            if (state.port) shell.openExternal(`http://127.0.0.1:${state.port}/`);
          },
        },
        {
          label: '打开数据目录',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { type: 'separator' },
        {
          label: '可用性检测(批量)',
          click: () => runInPage(`
            const d = document.getElementById('bulkDetails');
            d.open = true;
            d.scrollIntoView({ behavior: 'smooth', block: 'start' });
          `),
        },
        {
          label: '切换深色 / 浅色主题',
          accelerator: 'CmdOrCtrl+D',
          click: () => runInPage(`document.getElementById('themeToggle')?.click()`),
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用说明',
          accelerator: 'F1',
          click: openHelpWindow,
        },
        { type: 'separator' },
        {
          label: `关于 ${APP_TITLE}`,
          click: showAbout,
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** 打开应用内的使用说明窗口 */
function openHelpWindow() {
  if (!state.port) return;
  // 已经开着就聚焦,不重复开
  const existing = BrowserWindow.getAllWindows().find((w) => w.__isHelp);
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return;
  }

  const help = new BrowserWindow({
    width: 940,
    height: 820,
    minWidth: 600,
    minHeight: 400,
    title: `使用说明 · ${APP_TITLE}`,
    parent: state.win || undefined,
    icon: fs.existsSync(ICON_ICO) ? ICON_ICO : undefined,
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  help.__isHelp = true;

  help.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  help.loadURL(`http://127.0.0.1:${state.port}/help.html`);
}

function showAbout() {
  const m = state.meta || {};
  dialog.showMessageBox(state.win, {
    type: 'info',
    title: `关于 ${APP_TITLE}`,
    message: `${APP_TITLE}`,
    detail: [
      `版本 ${app.getVersion()}`,
      '',
      '直接通过 WHOIS 协议(TCP 43)与 RDAP(HTTPS)',
      '向全球注册局查询域名信息,不经过任何第三方接口。',
      '',
      `支持后缀:WHOIS ${m.whoisTldCount || '—'} 个 · RDAP ${m.rdapTldCount || '—'} 个`,
      `DNS 记录类型:${(m.dnsTypes || []).length || '—'} 种`,
      `本机服务端口:${state.port || '—'}(仅监听 127.0.0.1)`,
      '',
      `Electron ${process.versions.electron}`,
      `Chromium ${process.versions.chrome}`,
      `Node.js ${process.versions.node}`,
    ].join('\n'),
    buttons: ['确定'],
    icon: fs.existsSync(ICON_PNG) ? ICON_PNG : undefined,
    noLink: true,
  }).catch(() => {});
}

/* ============================ 主窗口 ============================ */

function createWindow(port, { show = true } = {}) {
  const ws = loadWindowState();

  const win = new BrowserWindow({
    width: ws.width,
    height: ws.height,
    x: ws.x,
    y: ws.y,
    minWidth: 900,
    minHeight: 600,
    title: APP_TITLE,
    icon: fs.existsSync(ICON_ICO) ? ICON_ICO : undefined,
    backgroundColor: '#0d1117',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      // 自检模式需要 executeJavaScript,保持默认即可
    },
  });

  state.win = win;

  if (ws.maximized && show) win.maximize();

  win.once('ready-to-show', () => {
    if (show) {
      win.show();
      win.focus();
    }
  });

  // 页面里的外链一律用系统浏览器打开,不在应用内导航走
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (target.hostname !== '127.0.0.1' && target.hostname !== 'localhost') {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('close', saveWindowState);
  win.on('closed', () => { state.win = null; });

  win.loadURL(`http://127.0.0.1:${port}/`);

  return win;
}

/* ============================ 应用生命周期 ============================ */

// 只允许运行一个实例,再次启动时聚焦已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (state.win) {
      if (state.win.isMinimized()) state.win.restore();
      state.win.show();
      state.win.focus();
    }
  });

  // Windows 任务栏图标分组需要显式设置 AppUserModelID
  if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

  app.whenReady().then(async () => {
    try {
      const port = await startServer();

      // 顺手把服务端能力信息取回来,给"关于"用
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/meta`);
        state.meta = await res.json();
      } catch { /* 拿不到也不影响 */ }

      buildMenu();

      const selftest = process.env.DL_SELFTEST === '1';
      const win = createWindow(port, { show: !selftest });

      if (selftest) {
        // 自检模式:跑完完整流程后按结果退出
        const { runSelfTest } = require('./selftest');
        runSelfTest(win, port)
          .then((code) => app.exit(code))
          .catch((err) => {
            console.log('自检异常:', err && err.message);
            app.exit(1);
          });
        return;
      }

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
      });
    } catch (err) {
      dialog.showErrorBox(`${APP_TITLE} 启动失败`, String(err && err.message ? err.message : err));
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    // 关掉窗口就退出(Windows/Linux 的习惯)
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    saveWindowState();
    if (state.server) {
      try { state.server.close(); } catch { /* ignore */ }
      state.server = null;
    }
  });
}

// 兜底:任何未捕获异常都不要让窗口无声消失
process.on('uncaughtException', (err) => {
  try {
    dialog.showErrorBox('发生未预期的错误', String(err && err.stack ? err.stack : err));
  } catch { /* ignore */ }
});
