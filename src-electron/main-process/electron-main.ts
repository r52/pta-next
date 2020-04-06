import { app, nativeTheme, Menu, Tray, Event } from 'electron';
import path from 'path';
import { PTA } from '../lib/pta';
import cfg from 'electron-cfg';
import log from 'electron-log';

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

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
declare const __statics: any;

if (process.env.PROD) {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\');
}

cfg.logger(log);

let tray: Tray | null = null;
global.pta = PTA.getInstance();

app.on('ready', () => {
  setTimeout(() => {
    global.pta.setup();
  }, 1000);

  tray = new Tray(path.join(__statics, '/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Tradebar',
      click: () => {
        global.pta.openTradeBar();
      },
    },
    {
      label: 'Settings',
      click: () => {
        global.pta.createSettingsWindow();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'About',
      click: () => {
        global.pta.createAboutWindow();
      },
    },
    {
      label: 'Exit',
      role: 'quit',
    },
  ]);
  tray.setContextMenu(contextMenu);
});

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  global.pta.shutdown();
});
