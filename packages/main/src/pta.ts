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

        // TODO change events
        // ipcRenderer.send('hotkeys-changed');
        // ipcRenderer.send('clientlog-changed', logpath);
        // ipcRenderer.send('tradeui-enabled', settings.tradeui.enabled);
        // ipcRenderer.send('set-stash-highlight', settings.tradeui.highlight);
      },
    );
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
        //frame: false, TODO change
        title: 'PTA-Next Settings',
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
