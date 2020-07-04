/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
import { app, nativeTheme, Menu, Tray, Event, BrowserWindow } from 'electron';
import path from 'path';
import { PTA } from '../lib/pta';
import cfg from 'electron-cfg';
import log from 'electron-log';

app.allowRendererProcessReuse = true;

try {
  if (
    process.platform === 'win32' &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    );
  }
} catch (_) {
  // do nothing
}

declare const __statics: string;

if (process.env.PROD) {
  global.__statics = __dirname;
}

cfg.logger(log);

let tray: Tray | null = null;

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 400,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    title: 'PTA-Next',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  void splash.loadURL((process.env.APP_URL as string) + '#/splash');

  return splash;
}

app.on('ready', () => {
  const splash = createSplashWindow();

  splash?.webContents.on('did-finish-load', () => {
    global.pta = PTA.getInstance(splash);

    setTimeout(() => {
      global.pta.setup();
    }, 1000);

    tray = new Tray(path.join(__statics, '/icon.png'));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Tradebar',
        click: () => {
          global.pta.openTradeBar();
        }
      },
      {
        label: 'Settings',
        click: () => {
          global.pta.createSettingsWindow();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'About',
        click: () => {
          global.pta.createAboutWindow();
        }
      },
      {
        label: 'Exit',
        role: 'quit'
      }
    ]);
    tray.setContextMenu(contextMenu);
  });
});

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  global.pta.shutdown();
});
