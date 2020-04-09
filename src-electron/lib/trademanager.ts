import { BrowserWindow, clipboard, ipcMain, Rectangle } from 'electron';
import cfg from 'electron-cfg';
import winpoe from 'winpoe';

import Config from '../lib/config';

const notificationMargin = 20; // pixels

function getTradeVariable(trade: TradeMsg, token: string) {
  if (token in trade) {
    return trade[token];
  }
  return null;
}

export default class TradeManager {
  private tradeBar: BrowserWindow | null = null;
  private tradeNotifications: BrowserWindow[] = [];
  private stashSetup: BrowserWindow | null = null;
  private stashHighlight: BrowserWindow | null = null;
  private stashHighlightTimeout: NodeJS.Timeout | null = null;
  private tradeHistory: TradeMsg[] = [];
  private tradeHistoryWindow: BrowserWindow | null = null;

  constructor() {
    ipcMain.on('tradeui-enabled', (event, enabled) => {
      const showtradebar = cfg.get(Config.tradebar, Config.default.tradebar);

      if (enabled) {
        if (showtradebar) {
          this.showTradeBar();
        }
      } else {
        this.closeTradeBar();

        this.tradeNotifications.forEach(notification => {
          notification.close();
        });

        this.tradeNotifications = [];
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
        currency: 'exa',
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

    ipcMain.on('highlight-stash', (event, name, x, y) => {
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
    });

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

  public setup() {
    const showtradebar = cfg.get(Config.tradebar, Config.default.tradebar);

    if (showtradebar) {
      this.showTradeBar();
    }

    const stashhighlight = cfg.get(
      Config.tradestashhighlight,
      Config.default.tradestashhighlight
    );

    if (stashhighlight) {
      this.openStashHighlighter();
    }
  }

  public isEnabled() {
    const enabled = cfg.get(Config.tradeui, Config.default.tradeui);
    return enabled;
  }

  public handleForegroundChange(ispoe: boolean) {
    if (!ispoe) {
      this.tradeBar?.hide();

      this.tradeNotifications.forEach(notification => {
        notification.hide();
      });
    } else {
      this.tradeBar?.show();

      this.tradeNotifications.forEach(notification => {
        notification.show();
      });
    }
  }

  public handleNewTrade(trade: TradeMsg) {
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
    const wincfg = cfg.window({ name: 'trade' });
    const state = wincfg.options() as Rectangle;

    // Stack new notifications
    if (this.tradeNotifications.length > 0) {
      const direction =
        cfg.get(Config.tradeuidirection, Config.default.tradeuidirection) ==
        'up'
          ? -1
          : 1;

      const y =
        state.y +
        (state.height + notificationMargin) *
          this.tradeNotifications.length *
          direction;

      state.y = y;
    }

    const tradewindow = new BrowserWindow({
      width: 400,
      height: 150,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      focusable: false,
      skipTaskbar: true,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: true
      },
      ...state
    });

    tradewindow.loadURL((process.env.APP_URL as string) + '#/trade');

    tradewindow.webContents.on('did-finish-load', () => {
      tradewindow.webContents.send(
        'trade',
        trade,
        trade.type == 'incoming'
          ? cfg.get(Config.tradeuiincoming, Config.default.tradeuiincoming)
          : cfg.get(Config.tradeuioutgoing, Config.default.tradeuioutgoing)
      );
    });

    if (this.tradeNotifications.length == 0) {
      // Track this window if its the first one
      wincfg.assign(tradewindow);
    }

    this.addTradeNotification(tradewindow);

    tradewindow.on('closed', () => {
      this.removeTradeNotification(tradewindow);
    });
  }

  public showTradeBar() {
    if (this.isEnabled()) {
      if (!this.tradeBar) {
        const wincfg = cfg.window({ name: 'tradebar' });
        const opts = wincfg.options() as Rectangle;

        if (opts.height > 100) {
          opts.height = 100;
        }

        this.tradeBar = new BrowserWindow({
          width: 350,
          height: 100,
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

        this.tradeBar.loadURL((process.env.APP_URL as string) + '#/tradebar');

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
    if (!winpoe.IsPoEForeground()) {
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
        );
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
    if (!winpoe.IsPoEForeground()) {
      return;
    }

    const re = /!(\w+)!/g;
    const proccmd = command.command.replace(re, (match, token) => {
      const ptok = getTradeVariable(trade, token);

      if (ptok) {
        return ptok;
      }

      return token;
    });

    this.executeChatCommand('@' + trade.name + ' ' + proccmd);
  }

  private executeChatCommand(command: string) {
    clipboard.writeText(command);
    winpoe.SendPasteCommand();
  }

  private addTradeNotification(notification: BrowserWindow) {
    this.tradeNotifications.push(notification);
  }

  private removeTradeNotification(notification: BrowserWindow) {
    const idx = this.tradeNotifications.indexOf(notification);

    if (idx > -1) {
      this.tradeNotifications.splice(idx, 1);

      setTimeout(() => {
        this.restackTradeNofitications();
      }, 0);
    }
  }

  private restackTradeNofitications() {
    const direction =
      cfg.get(Config.tradeuidirection, Config.default.tradeuidirection) == 'up'
        ? -1
        : 1;

    const wincfg = cfg.window({ name: 'trade' });
    const state = wincfg.options() as Rectangle;

    this.tradeNotifications.forEach((notification, idx) => {
      const nstate = { ...state };
      nstate.y =
        state.y + (state.height + notificationMargin) * idx * direction;

      notification.setPosition(nstate.x, nstate.y, false);

      if (idx == 0) {
        wincfg.assign(notification);
      }
    });
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

      this.stashSetup.loadURL((process.env.APP_URL as string) + '#/stashsetup');

      this.stashSetup.on('closed', () => {
        this.stashSetup = null;
      });
    } else {
      this.stashSetup.close();

      const stashhighlight = cfg.get(
        Config.tradestashhighlight,
        Config.default.tradestashhighlight
      );

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

      this.stashHighlight.loadURL(
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

      this.tradeHistoryWindow.loadURL(
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
