import { BrowserWindow, clipboard, ipcMain, Rectangle } from 'electron';
import cfg from 'electron-cfg';
import winpoe from 'winpoe';

import Config from '../lib/config';

function getTradeVariable(trade: TradeMsg, token: string) {
  switch (token) {
    case 'item':
      return trade.item;
    case 'price':
      return trade.price;
    case 'currency':
      return trade.currency;
  }

  return null;
}

export default class TradeManager {
  private tradeBar: BrowserWindow | null = null;
  private tradeNotification: BrowserWindow | null = null;
  private stashSetup: BrowserWindow | null = null;
  private stashHighlight: BrowserWindow | null = null;
  private stashHighlightTimeout: NodeJS.Timeout | null = null;
  private tradeHistory: TradeMsg[] = [];
  private tradeHistoryWindow: BrowserWindow | null = null;

  constructor() {
    ipcMain.on('tradeui-enabled', (event, enabled) => {
      const showtradebar = cfg.get(
        Config.tradebar,
        Config.default.tradebar
      ) as boolean;

      if (enabled) {
        if (showtradebar) {
          this.showTradeBar();
        }
      } else {
        this.closeTradeBar();

        if (this.tradeNotification) {
          this.tradeNotification.close();
        }

        this.tradeNotification = null;
      }
    });

    ipcMain.on('set-stash-highlight', (event, enabled) => {
      if (enabled) {
        this.openStashHighlighter();
      } else {
        if (this.stashHighlight) {
          this.stashHighlight.close();
        }
      }
    });

    ipcMain.on('test-trade-notification', () => {
      const tradeobj = {
        name: 'SomePlayer',
        type: 'incoming',
        item: 'Bramble Ruin Medium Cluster Jewel',
        price: 69,
        currency: 'exalted',
        league: 'Delirium',
        tab: 'Trade',
        x: 3,
        y: 5,
        time: Date.now()
      } as TradeMsg;

      if (process.env.DEV) {
        this.handleNewTrade(tradeobj);
      } else {
        this.showNewTrade(tradeobj);
      }
    });

    ipcMain.on('trade-command', (event, trade, command) => {
      this.handleTradeCommand(event, trade, command);
    });

    ipcMain.on('trade-custom-command', (event, trade, command) => {
      this.handleTradeCustomCommand(event, trade, command);
    });

    ipcMain.on('stash-setup', () => {
      this.toggleStashSetup();
    });

    ipcMain.on(
      'highlight-stash',
      (event, name: string, x: number, y: number) => {
        const quads = cfg.get(
          Config.tradestashquad,
          Config.default.tradestashquad
        ) as string[];

        const tabinfo = {
          name: name,
          x: x,
          y: y,
          quad: quads.includes(name)
        };

        this.highlightStash(tabinfo);
      }
    );

    ipcMain.on('stop-highlight-stash', () => {
      this.stophighlightStash();
    });

    ipcMain.on('open-trade-history', () => {
      this.openTradeHistory();
    });

    ipcMain.on('delete-history', (event, trade) => {
      this.tradeHistory.splice(this.tradeHistory.indexOf(trade), 1);

      event.reply('trade-history', this.tradeHistory);
    });

    ipcMain.on('restore-history', (event, trade) => {
      this.showNewTrade(trade);
    });

    ipcMain.on('trade-bar-ignore-mouse', (event, enabled) => {
      if (this.tradeBar) {
        if (enabled) {
          this.tradeBar.setIgnoreMouseEvents(true, { forward: true });
        } else {
          this.tradeBar.setIgnoreMouseEvents(false);
        }
      }
    });
  }

  public setup(): void {
    const showtradebar = cfg.get(
      Config.tradebar,
      Config.default.tradebar
    ) as boolean;

    if (showtradebar) {
      this.showTradeBar();
    }

    const stashhighlight = cfg.get(
      Config.tradestashhighlight,
      Config.default.tradestashhighlight
    ) as boolean;

    if (stashhighlight) {
      this.openStashHighlighter();
    }
  }

  public isEnabled(): boolean {
    const enabled = cfg.get(Config.tradeui, Config.default.tradeui) as boolean;
    return enabled;
  }

  public handleForegroundChange(ispoe: boolean): void {
    if (!ispoe) {
      this.tradeBar?.hide();

      this.tradeNotification?.hide();
    } else {
      this.tradeBar?.show();

      this.tradeNotification?.show();
    }
  }

  public forwardPlayerEvent(event: string, name: string): void {
    if (this.tradeNotification) {
      this.tradeNotification.webContents.send(event, name);
    }
  }

  public handleNewTrade(trade: TradeMsg): void {
    this.tradeHistory.push(trade);

    // limit to 30 for now
    if (this.tradeHistory.length > 30) {
      this.tradeHistory.shift();
    }

    // Send it
    this.tradeHistoryWindow?.webContents.send(
      'trade-history',
      this.tradeHistory
    );

    // Show it
    this.showNewTrade(trade);
  }

  private showNewTrade(trade: TradeMsg) {
    const notification = {
      ...trade,
      commands:
        trade.type == 'incoming'
          ? (cfg.get(
              Config.tradeuiincoming,
              Config.default.tradeuiincoming
            ) as TradeCommand[])
          : (cfg.get(
              Config.tradeuioutgoing,
              Config.default.tradeuioutgoing
            ) as TradeCommand[]),
      curtime: '',
      newwhisper: false,
      enteredarea: false
    } as TradeNotification;

    if (!this.tradeNotification) {
      this.tradeNotification = cfg.window({ name: 'trade' }).create({
        width: 400,
        height: 180,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        focusable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true
        }
      });

      void this.tradeNotification.loadURL(
        (process.env.APP_URL as string) + '#/trade'
      );

      this.tradeNotification.webContents.once('did-finish-load', () => {
        this.tradeNotification?.webContents.send('trade', notification);
      });

      this.tradeNotification.on('closed', () => {
        this.tradeNotification = null;
      });
    } else {
      this.tradeNotification?.webContents.send('trade', notification);
    }
  }

  public showTradeBar(): void {
    if (this.isEnabled()) {
      if (!this.tradeBar) {
        const wincfg = cfg.window({ name: 'tradebar' });
        const opts = wincfg.options() as Rectangle;

        opts.width = 350;
        opts.height = 100;

        this.tradeBar = new BrowserWindow({
          alwaysOnTop: true,
          frame: false,
          transparent: true,
          backgroundColor: '#00000000',
          resizable: false,
          focusable: false,
          skipTaskbar: true,
          webPreferences: {
            nodeIntegration: true
          },
          ...opts
        });

        wincfg.assign(this.tradeBar);

        void this.tradeBar.loadURL(
          (process.env.APP_URL as string) + '#/tradebar'
        );

        this.tradeBar.on('closed', () => {
          this.tradeBar = null;
        });
      }
    }
  }

  private closeTradeBar() {
    if (this.tradeBar) {
      this.tradeBar.close();
    }
  }

  private handleTradeCommand(
    event: Electron.IpcMainEvent,
    trade: TradeMsg,
    command: string
  ) {
    if (!winpoe.isPoEForeground()) {
      return;
    }

    switch (command) {
      case 'invite':
        this.executeChatCommand('/invite ' + trade.name);
        break;
      case 'trade':
        this.executeChatCommand('/tradewith ' + trade.name);
        break;
      case 'kick':
        this.executeChatCommand('/kick ' + trade.name);
        break;
      case 'self-hideout':
        this.executeChatCommand('/hideout');
        break;
      case 'hideout':
        this.executeChatCommand('/hideout ' + trade.name);
        break;
      case 'leave': {
        const charname = cfg.get(
          Config.tradecharname,
          Config.default.tradecharname
        ) as string;
        if (charname) {
          this.executeChatCommand('/kick ' + charname);
        }
        break;
      }
    }
  }

  private handleTradeCustomCommand(
    event: Electron.IpcMainEvent,
    trade: TradeMsg,
    command: TradeCommand
  ) {
    if (!winpoe.isPoEForeground()) {
      return;
    }

    const re = /!(\w+)!/g;
    const proccmd = command.command.replace(re, (match, token) => {
      const ptok = getTradeVariable(trade, token);

      if (ptok) {
        return ptok as string;
      }

      return token as string;
    });

    this.executeChatCommand('@' + trade.name + ' ' + proccmd);
  }

  private executeChatCommand(command: string) {
    clipboard.writeText(command);
    winpoe.sendPaste();
  }

  private toggleStashSetup() {
    if (!this.stashSetup) {
      if (this.stashHighlight) {
        this.stashHighlight.close();
      }

      this.stashSetup = cfg.window({ name: 'stash' }).create({
        width: 1000,
        height: 800,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: true,
        focusable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true
        }
      });

      void this.stashSetup.loadURL(
        (process.env.APP_URL as string) + '#/stashsetup'
      );

      this.stashSetup.on('closed', () => {
        this.stashSetup = null;
      });
    } else {
      this.stashSetup.close();

      const stashhighlight = cfg.get(
        Config.tradestashhighlight,
        Config.default.tradestashhighlight
      ) as boolean;

      if (stashhighlight) {
        this.openStashHighlighter();
      }
    }
  }

  private openStashHighlighter() {
    if (!this.stashHighlight) {
      const wincfg = cfg.window({ name: 'stash' });
      this.stashHighlight = new BrowserWindow({
        width: 1000,
        height: 800,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        focusable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true
        },
        ...wincfg.options()
      });

      void this.stashHighlight.loadURL(
        (process.env.APP_URL as string) + '#/stashhighlight'
      );

      this.stashHighlight.on('closed', () => {
        this.stashHighlight = null;
      });

      this.stashHighlight.setIgnoreMouseEvents(true);
      this.stashHighlight.hide();
    }
  }

  private highlightStash(tabinfo: TabInfo) {
    if (this.stashHighlightTimeout != null) {
      clearTimeout(this.stashHighlightTimeout);
      this.stashHighlightTimeout = null;
    }

    if (this.stashHighlight) {
      this.stashHighlight.webContents.send('highlight', tabinfo);
      this.stashHighlight.show();
    }
  }

  private stophighlightStash() {
    if (this.stashHighlightTimeout == null) {
      this.stashHighlightTimeout = setTimeout(() => {
        if (this.stashHighlight) {
          this.stashHighlight.webContents.send('stop-highlight');
          this.stashHighlight.hide();
        }
      }, 2000);
    }
  }

  private openTradeHistory() {
    if (!this.tradeHistoryWindow) {
      this.tradeHistoryWindow = cfg.window({ name: 'history' }).create({
        width: 1000,
        height: 600,
        alwaysOnTop: false,
        frame: false,
        resizable: true,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true
        }
      });

      void this.tradeHistoryWindow.loadURL(
        (process.env.APP_URL as string) + '#/tradehistory'
      );

      this.tradeHistoryWindow.on('closed', () => {
        this.tradeHistoryWindow = null;
      });

      this.tradeHistoryWindow.webContents.on('did-finish-load', () => {
        this.tradeHistoryWindow?.webContents.send(
          'trade-history',
          this.tradeHistory
        );
      });
    } else {
      this.tradeHistoryWindow.show();
    }
  }
}
