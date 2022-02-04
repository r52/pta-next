import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron';
import './security-restrictions';
import { join } from 'path';
import { URL } from 'url';
import { PTA } from './pta';

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}

app.disableHardwareAcceleration();

// Install "Vue.js devtools"
if (import.meta.env.MODE === 'development') {
  app
    .whenReady()
    .then(() => import('electron-devtools-installer'))
    .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
      installExtension(VUEJS3_DEVTOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    )
    .catch((e) => console.error('Failed install extension:', e));
}

let tray: Tray | null = null;
let splash: BrowserWindow | null = null;
let about: BrowserWindow | null = null;

/**
 * URL for app entry.
 * Vite dev server for development.
 * `file://../renderer/index.html` for production and test
 */
const pageUrl =
  import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ? import.meta.env.VITE_DEV_SERVER_URL
    : new URL('../renderer/dist/index.html', 'file://' + __dirname).toString();

const pta = new PTA(pageUrl);

ipcMain.on('close-current-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

ipcMain.handle('get-version', async () => {
  const result = app.getVersion();
  return result;
});

const createSplash = async () => {
  splash = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true,
    title: 'PTA-Next',
    show: false, // Use 'ready-to-show' event to show window
    webPreferences: {
      nativeWindowOpen: true,
      preload: join(__dirname, '../../preload/dist/index.cjs'),
    },
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  splash.on('ready-to-show', () => {
    splash?.show();

    // if (env.MODE === 'development') {
    //   mainWindow?.webContents.openDevTools();
    // }
  });

  splash.webContents.on('did-finish-load', () => {
    // Kill it after 2.5s
    setTimeout(() => {
      splash?.close();
    }, 2500);
  });

  await splash.loadURL(pageUrl + '#/splash');
};

const createAbout = async () => {
  about = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    title: 'About PTA-Next',
    show: false,
    webPreferences: {
      nativeWindowOpen: true,
      preload: join(__dirname, '../../preload/dist/index.cjs'),
    },
  });

  about.on('ready-to-show', () => {
    about?.show();
  });

  about.on('closed', () => {
    about = null;
  });

  await about.loadURL(pageUrl + '#/about');
};

const createTray = async () => {
  tray = new Tray(join(__dirname, '../../../logo.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Tradebar',
      click: () => {
        pta.openTradeBar();
      },
    },
    {
      label: 'Settings',
      click: () => {
        pta.createSettingsWindow();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'About',
      click: () => {
        if (!about) {
          createAbout();
        }
      },
    },
    {
      label: 'Exit',
      role: 'quit',
    },
  ]);
  tray.setContextMenu(contextMenu);
};

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  pta.shutdown();
});

app
  .whenReady()
  .then(createSplash)
  .then(createTray)
  .then(() => {
    pta.setup();
  })
  .catch((e) => console.error('Failed create window:', e));

// Auto-updates
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error('Failed check updates:', e));
}
