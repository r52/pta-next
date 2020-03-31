import { clipboard, ipcMain, Rectangle } from 'electron';
import { BrowserWindow } from 'electron';
import cfg from 'electron-cfg';
import Config from '../lib/config';
import winpoe from 'winpoe';

const notificationMargin = 20; // pixels

export default class TradeManager {
  private tradeBar: BrowserWindow | null = null;
  private tradeNotifications: BrowserWindow[] = [];

  public setup() {
    const showtradebar = cfg.get(Config.tradebar, Config.default.tradebar);

    if (showtradebar) {
      this.showTradeBar();
    }

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

      this.showNewTrade(tradeobj);
    });

    ipcMain.on('trade-command', (event, trade, command) => {
      this.handleTradeCommand(event, trade, command);
    });

    ipcMain.on('trade-custom-command', (event, trade, command) => {
      this.handleTradeCustomCommand(event, trade, command);
    });
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

  public showNewTrade(trade: TradeMsg) {
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
        this.tradeBar = cfg.window({ name: 'tradebar' }).create({
          width: 350,
          height: 400,
          alwaysOnTop: true,
          frame: false,
          transparent: true,
          backgroundColor: '#00000000',
          resizable: false,
          focusable: false,
          skipTaskbar: true,
          webPreferences: {
            nodeIntegration: true
          }
        });

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
      case 'hideout':
        this.executeChatCommand('/hideout ' + trade.name);
        break;
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

    this.executeChatCommand('@' + trade.name + ' ' + command.command);
  }

  private executeChatCommand(command: string) {
    const saved = clipboard.readText();
    clipboard.writeText(command);
    winpoe.SendPasteCommand();
    clipboard.writeText(saved);
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
}
