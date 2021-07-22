import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import { join } from 'path';
import cfg from 'electron-cfg';
import winpoe from 'winpoe';

import ClientMonitor from './clientmonitor';
import TradeManager from './trademanager';
import Config, { QuickPasteKey } from './config';

const env = import.meta.env;

export class PTA {
  private entryURL: string;

  private settingsWindow: BrowserWindow | null = null;
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

    // TODO

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

    // ipcMain.on('open-cheatsheet-incursion', () => {
    //   this.openCheatSheet('incursion');
    // });

    // ipcMain.on('open-cheatsheet-betrayal', () => {
    //   this.openCheatSheet('betrayal');
    // });

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
    // TODO
    winpoe.stop();
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
}
