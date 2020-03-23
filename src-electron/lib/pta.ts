/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  shell
} from 'electron';
import { ItemParser } from '../lib/itemparser';
import log from 'electron-log';
import cfg from 'electron-cfg';
import Config from '../lib/config';
import * as PoE from '../lib/api/poe';
import winpoe from 'winpoe';
import axios from 'axios';

interface Macro {
  name: string;
  key: string;
  type: string;
  command: string;
}

enum ItemHotkey {
  SIMPLE,
  ADVANCED
}

const uApiLeague = 'https://www.pathofexile.com/api/trade/data/leagues';

export class PTA {
  private static instance: PTA;
  private static parser: ItemParser;
  private settingsWindow: BrowserWindow | null = null;
  private itemWindow: BrowserWindow | null = null;
  private aboutWindow: BrowserWindow | null = null;

  leagues: string[];

  private constructor() {
    PTA.parser = ItemParser.getInstance();

    ///////////////////////////////////////////// Download leagues
    this.leagues = [];

    axios.get(uApiLeague).then((response: any) => {
      const data = response.data;

      const lgs = data['result'];

      lgs.forEach((element: { [x: string]: string }) => {
        this.leagues.push(element['id']);
      });

      const setlg = this.getLeague();

      log.info('League data loaded. Setting league to', setlg);
    });
  }

  public static getInstance(): PTA {
    if (!PTA.instance) {
      PTA.instance = new PTA();
    }

    return PTA.instance;
  }

  public setup() {
    this.registerShortcuts();

    // setup events
    ipcMain.on('search-defaults', (event, item) => {
      PoE.searchItemWithDefaults(event, item);
    });

    ipcMain.on('search', (event, item, options, openbrowser) => {
      PoE.searchItemWithOptions(event, item, options, openbrowser);
    });

    ipcMain.on('hotkeys-changed', () => {
      this.unregisterShortcuts();
      this.registerShortcuts();
    });

    ipcMain.on('clientlog-changed', () => {
      // TODO client monitor
    });

    winpoe.onForegroundChange((isPoe: boolean) => {
      if (isPoe) {
        this.registerShortcuts();
      } else {
        this.unregisterShortcuts();
      }
    });

    if (process.env.NODE_ENV === 'production') {
      winpoe.InitializeHooks();
    }
  }

  public shutdown() {
    this.unregisterShortcuts();

    if (process.env.NODE_ENV === 'production') {
      winpoe.ShutdownHooks();
    }
  }

  private registerShortcuts() {
    // price check keys
    const smphotkeyenabled = cfg.get(
      Config.simplehotkeyenabled,
      Config.default.simplehotkeyenabled
    );
    const simplehotkey = cfg.get(
      Config.simplehotkey,
      Config.default.simplehotkey
    );

    const advhotkeyenabled = cfg.get(
      Config.advancedhotkeyenabled,
      Config.default.advancedhotkeyenabled
    );
    const advhotkey = cfg.get(
      Config.advancedhotkey,
      Config.default.advancedhotkey
    );

    if (smphotkeyenabled) {
      globalShortcut.register(simplehotkey, () => {
        this.handleItemHotkey(ItemHotkey.SIMPLE);
      });
    }

    if (advhotkeyenabled) {
      globalShortcut.register(advhotkey, () => {
        this.handleItemHotkey(ItemHotkey.ADVANCED);
      });
    }

    // cscroll
    const cscroll = cfg.get(Config.cscroll, Config.default.cscroll);
    winpoe.SetScrollHookEnabled(cscroll);

    // macros
    const macros: Macro[] = cfg.get(Config.macros, Config.default.macros);
    macros.forEach((macro: Macro) => {
      const key = macro.key;
      const type = macro.type;
      const command = macro.command;

      globalShortcut.register(key, () => {
        this.handleMacro(type, command);
      });
    });
  }

  private unregisterShortcuts() {
    winpoe.SetScrollHookEnabled(false);
    globalShortcut.unregisterAll();
  }

  private handleMacro(type: string, command: string) {
    if (!winpoe.IsPoEForeground()) {
      return;
    }

    switch (type) {
      case 'chat':
        this.executeChatCommand(command);
        break;
      case 'url':
        shell.openExternal(command);
        break;
      default:
        log.warn('Invalid macro type', type);
        break;
    }
  }

  private executeChatCommand(command: string) {
    clipboard.writeText(command);

    winpoe.SendPasteCommand();
  }

  public getLeague() {
    let league = cfg.get(Config.league, Config.default.league);

    if (league > this.leagues.length) {
      dialog.showErrorBox(
        'League Warning',
        'Previously set league no longer available. Resetting to default league.'
      );

      league = Config.default.league;
      cfg.set(Config.league, Config.default.league);
    }

    return this.leagues[league];
  }

  public createSettingsWindow() {
    if (!this.settingsWindow) {
      this.settingsWindow = cfg.window({ name: 'settings' }).create({
        width: 1000,
        height: 600,
        frame: false,
        webPreferences: {
          nodeIntegration: true
        }
      });

      this.settingsWindow.loadURL(
        (process.env.APP_URL as string) + '#/settings'
      );

      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });
    }
  }

  public createAboutWindow() {
    if (!this.aboutWindow) {
      this.aboutWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false,
        webPreferences: {
          nodeIntegration: true
        }
      });

      this.aboutWindow.loadURL((process.env.APP_URL as string) + '#/about');

      this.aboutWindow.on('closed', () => {
        this.aboutWindow = null;
      });
    }
  }

  private handleItemHotkey(type: ItemHotkey) {
    const poefg = winpoe.IsPoEForeground();

    if (poefg) {
      winpoe.SendCopyCommand();
      setTimeout(() => {
        this.handleClipboard(type);
      }, 50);
    }
  }

  private createItemUI(
    item: Item,
    settings: any,
    options: any,
    type: ItemHotkey
  ) {
    if (!this.itemWindow) {
      this.itemWindow = cfg.window({ name: 'item' }).create({
        width: 600,
        height: 800,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        backgroundColor: '#00000000',
        webPreferences: {
          nodeIntegration: true
        }
      });

      this.itemWindow.on('closed', () => {
        this.itemWindow = null;
      });

      this.itemWindow.loadURL((process.env.APP_URL as string) + '#/item');

      this.itemWindow.webContents.on('context-menu', () => {
        if (this.itemWindow) {
          this.itemWindow.close();
        }
      });

      this.itemWindow.webContents.on('did-finish-load', () => {
        if (this.itemWindow) {
          this.itemWindow.webContents.send(
            'item',
            item,
            settings,
            options,
            type
          );
        }
      });
    }
  }

  private handleClipboard(type: ItemHotkey) {
    const itemtext = clipboard.readText();

    if (!itemtext.length) {
      log.warn(
        'Failed to retrieve item text from clipboard. Please try again.'
      );

      dialog.showErrorBox(
        'Clipboard Error',
        'Failed to retrieve item text from clipboard. Please try again.'
      );

      return;
    }

    const item = PTA.parser.parse(itemtext);

    if (!item) {
      dialog.showErrorBox(
        'Item Error',
        'Error parsing item text. Check log for more details.'
      );
    } else {
      if (type === ItemHotkey.SIMPLE || type === ItemHotkey.ADVANCED) {
        const { settings, options } = this.fillSearchOptions(item);

        this.createItemUI(item, settings, options, type);
      }
    }
  }

  private fillSearchOptions(item: Item) {
    const league = this.getLeague();
    const displaylimit = cfg.get(
      Config.displaylimit,
      Config.default.displaylimit
    );
    const corruptoverride = cfg.get(
      Config.corruptoverride,
      Config.default.corruptoverride
    );
    const corruptsearch = cfg.get(
      Config.corruptsearch,
      Config.default.corruptsearch
    );
    const pcurr = cfg.get(
      Config.primarycurrency,
      Config.default.primarycurrency
    );
    const scurr = cfg.get(
      Config.secondarycurrency,
      Config.default.secondarycurrency
    );
    const onlineonly = cfg.get(Config.onlineonly, Config.default.onlineonly);
    const buyoutonly = cfg.get(Config.buyoutonly, Config.default.buyoutonly);
    const removedupes = cfg.get(Config.removedupes, Config.default.removedupes);
    const prefillmin = cfg.get(Config.prefillmin, Config.default.prefillmin);
    const prefillmax = cfg.get(Config.prefillmax, Config.default.prefillmax);
    const prefillrange = cfg.get(
      Config.prefillrange,
      Config.default.prefillrange
    );
    const prefillnormals = cfg.get(
      Config.prefillnormals,
      Config.default.prefillnormals
    );
    const prefillpseudos = cfg.get(
      Config.prefillpseudos,
      Config.default.prefillpseudos
    );
    const prefillilvl = cfg.get(Config.prefillilvl, Config.default.prefillilvl);
    const prefillbase = cfg.get(Config.prefillbase, Config.default.prefillbase);

    // app settings
    const settings = {
      league: league,
      displaylimit: displaylimit,
      corruptoverride: corruptoverride,
      corruptsearch: corruptsearch,
      primarycurrency: pcurr,
      secondarycurrency: scurr,
      onlineonly: onlineonly,
      buyoutonly: buyoutonly,
      removedupes: removedupes,
      prefillmin: prefillmin,
      prefillmax: prefillmax,
      prefillrange: prefillrange,
      prefillnormals: prefillnormals,
      prefillpseudos: prefillpseudos,
      prefillilvl: prefillilvl,
      prefillbase: prefillbase
    };

    // search defaults
    const options = {
      usepdps: {
        enabled: false
      },
      useedps: {
        enabled: false
      },
      usear: {
        enabled: false
      },
      useev: {
        enabled: false
      },
      usees: {
        enabled: false
      },
      usesockets: false,
      uselinks: false,
      useilvl: prefillilvl,
      useitembase: prefillbase,
      usecorrupted: item.corrupted ? 'Yes' : 'Any',
      influences: []
    } as any;

    if (prefillbase) {
      if (item.influences) {
        options.influences.push(...item.influences);
      }

      if (item.misc?.synthesis) {
        options['usesynthesisbase'] = prefillbase;
      }
    }

    return { settings, options };
  }
}
