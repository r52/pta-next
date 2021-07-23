import type { BrowserWindow } from 'electron';
import { ipcMain, clipboard } from 'electron';
import { join } from 'path';
import cfg from 'electron-cfg';
import winpoe from 'winpoe';
import log from 'electron-log';

import ClientMonitor from './clientmonitor';
import TradeManager from './trademanager';
import Config, { QuickPasteKey } from './config';
import type { TradeMsg } from '../../../types/trade';

const env = import.meta.env;

export class PTA {
  private entryURL: string;

  private settingsWindow: BrowserWindow | null = null;
  private cheatsheet: BrowserWindow | null = null;
  private clientmonitor: ClientMonitor;
  private trademanager: TradeManager;

  // persistent settings that gets accessed a lot
  private settings = {
    quickpaste: false,
    quickpastemod: QuickPasteKey.CTRL,
    qpmodHeld: false,
  };

  constructor(entryURL: string) {
    this.entryURL = entryURL;

    // Client Monitor
    this.clientmonitor = new ClientMonitor();

    // TradeManager
    this.trademanager = new TradeManager(entryURL);

    // Get/Set config root
    ipcMain.handle('get-config', async () => {
      const result = cfg.getAll();
      return result;
    });

    ipcMain.handle(
      'set-config',
      async (event, obj: Record<string, unknown>) => {
        cfg.setAll(obj);

        // 'hotkeys-changed'
        this.unregisterShortcuts();
        this.registerShortcuts();

        // 'clientlog-changed'
        const clientlog = cfg.get(
          Config.clientlogpath,
          Config.default.clientlogpath,
        ) as string;
        this.clientmonitor.setPath(clientlog);

        // 'tradeui-enabled'
        this.trademanager.tradeUIEnabledChanged();

        // 'set-stash-highlight'
        this.trademanager.stashHighlightEnabledChanged();
      },
    );

    ipcMain.on('open-settings', () => {
      this.createSettingsWindow();
    });

    ipcMain.on('open-cheatsheet-incursion', () => {
      this.openCheatSheet('incursion');
    });

    ipcMain.on('open-cheatsheet-betrayal', () => {
      this.openCheatSheet('betrayal');
    });

    // Initialize trade hooks
    this.clientmonitor.on('new-trade', (trademsg: TradeMsg) => {
      this.trademanager.handleNewTrade(trademsg);
    });

    this.clientmonitor.on('new-whisper', (name) => {
      this.trademanager.forwardPlayerEvent('new-whisper', name);
    });

    this.clientmonitor.on('entered-area', (name) => {
      this.trademanager.forwardPlayerEvent('entered-area', name);
    });

    this.clientmonitor.on('left-area', (name) => {
      this.trademanager.forwardPlayerEvent('left-area', name);
    });

    // TODO
    // uIOhook.on('keydown', event => {
    //   if (this.settings.quickpaste) {
    //     switch (this.settings.quickpastemod) {
    //       case QuickPasteKey.CTRL:
    //         this.settings.qpmodHeld = event.ctrlKey;
    //         break;
    //       case QuickPasteKey.SHIFT:
    //         this.settings.qpmodHeld = event.shiftKey;
    //         break;
    //     }
    //   }
    // });

    // uIOhook.on('keyup', event => {
    //   if (this.settings.quickpaste) {
    //     switch (this.settings.quickpastemod) {
    //       case QuickPasteKey.CTRL:
    //         this.settings.qpmodHeld = event.ctrlKey;
    //         break;
    //       case QuickPasteKey.SHIFT:
    //         this.settings.qpmodHeld = event.shiftKey;
    //         break;
    //     }
    //   }
    // });

    winpoe.on('clipboard', () => {
      if (this.settings.quickpaste && this.settings.qpmodHeld) {
        const cbtext = clipboard.readText();

        if (cbtext.startsWith('@') && winpoe.setPoEForeground()) {
          setTimeout(() => {
            winpoe.sendPaste();
          }, 250);
        }
      }
    });
  }

  public setup(): void {
    this.registerShortcuts();

    // setup native hooks
    winpoe.on('foreground', (isPoe: boolean) => {
      if (isPoe) {
        this.registerShortcuts();
      } else {
        this.unregisterShortcuts();
      }

      this.trademanager.handleForegroundChange(isPoe);
    });

    winpoe.start(env.MODE === 'development');
    // uIOhook.start(); TODO

    // setup trade manager
    this.trademanager.setup();
  }

  public shutdown(): void {
    this.unregisterShortcuts();

    winpoe.stop();
    //uIOhook.stop(); TODO
  }

  private registerShortcuts() {
    // quick paste
    const qpaste = cfg.get(
      Config.quickpaste,
      Config.default.quickpaste,
    ) as boolean;
    this.settings.quickpaste = qpaste;

    const qpastemod = cfg.get(
      Config.quickpastemod,
      Config.default.quickpastemod,
    ) as QuickPasteKey;
    this.settings.quickpastemod = qpastemod;
  }

  private unregisterShortcuts() {
    // TODO Does nothing?
  }

  public openTradeBar(): void {
    this.trademanager.showTradeBar();
  }

  public createSettingsWindow(): void {
    if (!this.settingsWindow) {
      this.settingsWindow = cfg.window({ name: 'settings' }).create({
        width: 1000,
        height: 600,
        frame: false,
        title: 'PTA-Next Settings',
        show: false,
        webPreferences: {
          preload: join(__dirname, '../../preload/dist/index.cjs'),
          contextIsolation: env.MODE !== 'test',
          enableRemoteModule: env.MODE === 'test',
        },
      });

      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });

      this.settingsWindow.on('ready-to-show', () => {
        this.settingsWindow?.show();
      });

      void this.settingsWindow.loadURL(this.entryURL + '#/settings');
    }
  }

  private openCheatSheet(type: string) {
    let path = '';

    switch (type) {
      case 'incursion':
        path = cfg.get(
          Config.cheatsheetincursion,
          Config.default.cheatsheetincursion,
        ) as string;

        path = path.trim();

        if (!path) {
          path = 'incursion';
        }
        break;
      case 'betrayal':
        path = cfg.get(
          Config.cheatsheetbetrayal,
          Config.default.cheatsheetbetrayal,
        ) as string;

        path = path.trim();

        if (!path) {
          path = 'betrayal';
        }
        break;
      default:
        log.error('Unsupported cheat sheet type:', type);
        return;
    }

    if (!this.cheatsheet) {
      this.cheatsheet = cfg.window({ name: 'cheatsheet' }).create({
        width: 1280,
        height: 720,
        alwaysOnTop: true,
        frame: false,
        resizable: true,
        title: 'Cheat Sheet',
        show: false,
        webPreferences: {
          preload: join(__dirname, '../../preload/dist/index.cjs'),
          contextIsolation: env.MODE !== 'test',
          enableRemoteModule: env.MODE === 'test',
        },
      });

      this.cheatsheet.on('closed', () => {
        this.cheatsheet = null;
      });

      this.cheatsheet.webContents.on('context-menu', () => {
        this.cheatsheet?.close();
      });

      this.cheatsheet.on('ready-to-show', () => {
        this.cheatsheet?.show();
      });

      this.cheatsheet.loadURL(this.entryURL + '#/cheatsheet').then(() => {
        setTimeout(() => {
          this.cheatsheet?.webContents.send('cheatsheet-type', type, path);
        }, 100);
      });
    } else {
      this.cheatsheet.show();
      this.cheatsheet.moveTop();

      this.cheatsheet.webContents.send('cheatsheet-type', type, path);
    }
  }
}
