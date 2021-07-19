import type { BrowserWindow } from 'electron';
import { join } from 'path';
import cfg from 'electron-cfg';

import TradeManager from './trademanager';

const env = import.meta.env;

export class PTA {
  private entryURL: string;

  private settingsWindow: BrowserWindow | null = null;
  private trademanager: TradeManager;

  constructor(entryURL: string) {
    // TODO
    this.entryURL = entryURL;

    // TradeManager
    this.trademanager = new TradeManager(entryURL);
  }

  public shutdown(): void {
    // TODO
  }

  public openTradeBar(): void {
    this.trademanager.showTradeBar();
  }

  public createSettingsWindow(): void {
    if (!this.settingsWindow) {
      this.settingsWindow = cfg.window({ name: 'settings' }).create({
        width: 1000,
        height: 600,
        //frame: false,
        title: 'PTA-Next Settings',
        webPreferences: {
          preload: join(__dirname, '../../preload/dist/index.cjs'),
          contextIsolation: env.MODE !== 'test',
          enableRemoteModule: env.MODE === 'test',
        },
      });

      this.settingsWindow.loadURL(this.entryURL + '#/settings');

      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });
    }
  }
}
