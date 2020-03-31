import { clipboard, ipcMain } from 'electron';
import { BrowserWindow } from 'electron';
import cfg from 'electron-cfg';
import Config from '../lib/config';
import winpoe from 'winpoe';

export default class TradeManager {
  private tradeBar: BrowserWindow | null = null;

  public setup() {
    this.showTradeBar();

    ipcMain.on('tradeui-enabled', (event, enabled) => {
      if (enabled) {
        // TODO do stuff
        this.showTradeBar();
      } else {
        // do stuff
        this.closeTradeBar();
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
    // TODO
    if (!ispoe) {
      this.tradeBar?.hide();
    } else {
      this.tradeBar?.show();
    }
  }

  public showNewTrade(trade: TradeMsg) {
    // TODO
    const wincfg = cfg.window({ name: 'trade' });

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
      }
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
}
