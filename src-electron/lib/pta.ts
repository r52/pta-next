/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  shell
} from 'electron';
import log from 'electron-log';
import cfg from 'electron-cfg';
import winpoe from 'winpoe';
import axios from 'axios';
import MultiMap from 'multimap';
import iohook from 'iohook';
import { autoUpdater } from 'electron-updater';
import clipboardListener from 'clipboard-event';

import { ItemParser } from '../lib/itemparser';
import Config from '../lib/config';

import ClientMonitor from './clientmonitor';
import TradeManager from './trademanager';

// apis
import URLs from './api/urls';
import { POETradeAPI } from './api/poetrade';
import { POEPricesAPI } from './api/poeprices';

interface Macro {
  name: string;
  key: string;
  type: string;
  command: string;
}

enum ItemHotkey {
  SIMPLE,
  ADVANCED,
  WIKI
}

export class PTA {
  private static instance: PTA;
  private parser!: ItemParser;

  private settingsWindow: BrowserWindow | null = null;
  private aboutWindow: BrowserWindow | null = null;
  private clientmonitor: ClientMonitor;
  private trademanager: TradeManager;

  private uniques: MultiMap;
  private searchAPIs: PriceAPI[] = [];

  // persistent settings that gets accessed a lot
  private settings = {
    cscrollEnabled: false,
    quickpaste: false,
    quickpastemod: '',
    qpmodHeld: false
  };

  private macroVariables = new Map<string, () => string>([
    [
      'last_whisper',
      () => {
        return this.clientmonitor.getLastWhisperer();
      }
    ]
  ]);

  leagues: string[];

  private constructor() {
    ///////////////////////////////////////////// Download leagues
    this.leagues = [];

    axios
      .get(URLs.official.leagues)
      .then((response: any) => {
        const data = response.data;

        const lgs = data['result'];

        lgs.forEach((element: { [x: string]: string }) => {
          this.leagues.push(element['id']);
        });

        const setlg = this.getLeague();

        log.info('League data loaded. Setting league to', setlg);
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download League data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Download unique items
    this.uniques = new MultiMap();

    axios
      .get(URLs.official.items)
      .then((response: any) => {
        const data = response.data;
        const itm = data['result'];

        for (const type of itm) {
          const el = type['entries'];

          for (const et of el) {
            if ('name' in et) {
              this.uniques.set(et['name'], et);
            } else if ('type' in et) {
              this.uniques.set(et['type'], et);
            } else {
              log.debug('Item entry has neither name nor type:', et);
            }
          }
        }

        log.info('Unique item data loaded');

        // Load APIs
        this.parser = new ItemParser(this.uniques);
        this.searchAPIs.push(new POETradeAPI(this.uniques));
        this.searchAPIs.push(new POEPricesAPI(this.uniques));

        // XXX: potentially add more apis
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Uniques data. Check log for more details.'
        );
        app.exit(1);
      });

    this.clientmonitor = new ClientMonitor();
    this.trademanager = new TradeManager();

    // initialize events
    ipcMain.on('search-defaults', (event, item) => {
      this.searchItemDefault(event, item);
    });

    ipcMain.on('search', (event, item, options, openbrowser) => {
      this.searchItemOptions(event, item, options, openbrowser);
    });

    ipcMain.on('hotkeys-changed', () => {
      this.unregisterShortcuts();
      this.registerShortcuts();
    });

    ipcMain.on('open-settings', () => {
      this.createSettingsWindow();
    });

    ipcMain.on('vulkan-compat-changed', () => {
      const vulkanCompat = cfg.get(
        Config.vulkanCompat,
        Config.default.vulkanCompat
      );

      winpoe.SetVulkanCompatibility(vulkanCompat);
    });

    // initialize trade hooks
    this.clientmonitor.on('new-trade', (trademsg: TradeMsg) => {
      this.trademanager.handleNewTrade(trademsg);
    });

    this.clientmonitor.on('new-whisper', name => {
      this.trademanager.forwardPlayerEvent('new-whisper', name);
    });

    this.clientmonitor.on('entered-area', name => {
      this.trademanager.forwardPlayerEvent('entered-area', name);
    });

    this.clientmonitor.on('left-area', name => {
      this.trademanager.forwardPlayerEvent('left-area', name);
    });

    iohook.on('mousewheel', event => {
      if (
        event.direction == 3 &&
        event.ctrlKey &&
        this.settings.cscrollEnabled
      ) {
        winpoe.SendStashMove(event.rotation, event.x, event.y);
      }
    });

    iohook.on('keydown', event => {
      if (this.settings.quickpaste) {
        this.settings.qpmodHeld = event[this.settings.quickpastemod];
      }
    });

    iohook.on('keyup', event => {
      if (this.settings.quickpaste) {
        this.settings.qpmodHeld = event[this.settings.quickpastemod];
      }
    });

    clipboardListener.on('change', () => {
      if (this.settings.quickpaste && this.settings.qpmodHeld) {
        const cbtext = clipboard.readText();

        if (cbtext.startsWith('@') && winpoe.SetPoEForeground()) {
          setTimeout(() => {
            winpoe.SendPasteCommand();
          }, 100);
        }
      }
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

    // setup native hooks
    winpoe.onForegroundChange((isPoe: boolean) => {
      setTimeout(() => {
        if (isPoe) {
          this.registerShortcuts();
        } else {
          this.unregisterShortcuts();
        }

        this.trademanager.handleForegroundChange(isPoe);
      }, 0);
    });

    // Update check
    autoUpdater.logger = log;

    const checkForUpdates = cfg.get(
      Config.checkForUpdates,
      Config.default.checkForUpdates
    );
    const autoUpdate = cfg.get(Config.autoUpdate, Config.default.autoUpdate);
    const vulkanCompat = cfg.get(
      Config.vulkanCompat,
      Config.default.vulkanCompat
    );

    const appPath = app.getAppPath();

    if (checkForUpdates) {
      if (appPath.includes('AppData')) {
        // installer version

        if (autoUpdate) {
          // Auto update on
          autoUpdater.checkForUpdatesAndNotify();
        } else {
          // Auto update off
          autoUpdater.autoDownload = false;

          autoUpdater.on('update-available', () => {
            dialog
              .showMessageBox({
                type: 'info',
                title: 'New Version Available',
                message:
                  'A new version of PTA-Next is available. Would you like to update now?',
                buttons: ['Yes', 'No']
              })
              .then(result => {
                if (result.response === 0) {
                  autoUpdater.downloadUpdate();
                }
              });
          });

          autoUpdater.on('update-downloaded', () => {
            dialog
              .showMessageBox({
                title: 'Installing Updates',
                message:
                  'Updates downloaded. PTA-Next will now exit to install update.'
              })
              .then(() => {
                setImmediate(() => autoUpdater.quitAndInstall());
              });
          });

          autoUpdater.checkForUpdates();
        }
      } else {
        // portable version
        autoUpdater.autoDownload = false;

        autoUpdater.on('update-available', () => {
          dialog
            .showMessageBox({
              type: 'info',
              title: 'New Version Available',
              message:
                'A new version of PTA-Next is available. Would you like to go download it?',
              buttons: ['Yes', 'No']
            })
            .then(result => {
              if (result.response === 0) {
                shell.openExternal('https://github.com/r52/pta-next/releases');
              }
            });
        });

        if (autoUpdater.isUpdaterActive()) {
          autoUpdater.checkForUpdates();
        }
      }
    }

    if (process.env.PROD) {
      winpoe.InitializeHooks(vulkanCompat);
    } else {
      winpoe.SetVulkanCompatibility(vulkanCompat);
    }

    iohook.start(process.env.NODE_ENV == 'development');

    // setup trade manager
    this.trademanager.setup();

    clipboardListener.startListening();
  }

  public shutdown() {
    this.unregisterShortcuts();

    if (process.env.PROD) {
      winpoe.ShutdownHooks();
    }

    iohook.stop();

    clipboardListener.stopListening();
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

    const wikihotkeyenabled = cfg.get(
      Config.wikihotkeyenabled,
      Config.default.wikihotkeyenabled
    );
    const wikihotkey = cfg.get(Config.wikihotkey, Config.default.wikihotkey);

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

    if (wikihotkeyenabled) {
      globalShortcut.register(wikihotkey, () => {
        this.handleItemHotkey(ItemHotkey.WIKI);
      });
    }

    // Dev test key
    if (process.env.DEV) {
      globalShortcut.register('CmdOrCtrl+J', () => {
        this.handleClipboard(ItemHotkey.ADVANCED);
      });
    }

    // quick paste
    const qpaste = cfg.get(Config.quickpaste, Config.default.quickpaste);
    this.settings.quickpaste = qpaste;

    const qpastemod = cfg.get(
      Config.quickpastemod,
      Config.default.quickpastemod
    );
    this.settings.quickpastemod = qpastemod;

    // cscroll
    const cscroll = cfg.get(Config.cscroll, Config.default.cscroll);
    this.settings.cscrollEnabled = cscroll;

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
    if (this.clientmonitor.isEnabled()) {
      const re = /!(\w+)!/g;

      command = command.replace(re, (match, token) => {
        if (this.macroVariables.has(token)) {
          const fn = this.macroVariables.get(token) as () => string;
          const rval = fn();

          if (rval) {
            return rval;
          }
        }

        return token;
      });
    }

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
        title: 'PTA-Next Settings',
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
        title: 'About PTA-Next',
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

  public openTradeBar() {
    this.trademanager.showTradeBar();
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
    settings: PTASettings,
    options: ItemOptions,
    type: ItemHotkey
  ) {
    const wincfg = cfg.window({ name: 'item' });
    const itemWindow = new BrowserWindow({
      width: 600,
      height: 800,
      alwaysOnTop: true,
      transparent: true,
      frame: false,
      backgroundColor: '#00000000',
      title: item.name ?? item.type,
      webPreferences: {
        nodeIntegration: true
      },
      ...wincfg.options()
    });

    itemWindow.on('close', () => {
      const state = {
        ...wincfg.options(),
        ...itemWindow.getBounds()
      };

      cfg.set('windowState.item', state);
    });

    itemWindow.loadURL((process.env.APP_URL as string) + '#/item');

    itemWindow.webContents.on('context-menu', () => {
      itemWindow.close();
    });

    itemWindow.webContents.on('did-finish-load', () => {
      itemWindow.webContents.send('item', item, settings, options, type);
    });
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

    const item = this.parser.parse(itemtext);

    if (!item) {
      dialog.showErrorBox(
        'Item Error',
        'Error parsing item text. Check log for more details.'
      );
    } else {
      switch (type) {
        case ItemHotkey.SIMPLE:
        case ItemHotkey.ADVANCED: {
          const { settings, options } = this.fillSearchOptions(item);
          this.createItemUI(item, settings, options, type);
          break;
        }
        case ItemHotkey.WIKI:
          this.openWiki(item);
          break;
      }
    }
  }

  private openWiki(item: Item) {
    let itemName = item.type;

    if (item.rarity == 'Rare') {
      // keep item type
      itemName = item.type;
    } else if (item.name) {
      itemName = item.name;
    }

    itemName = itemName.replace(' ', '_');
    shell.openExternal(URLs.wiki + itemName);
  }

  private fillSearchOptions(item: Item) {
    const league = this.getLeague();
    const displaylimit = cfg.get(
      Config.displaylimit,
      Config.default.displaylimit
    ) as number;
    const corruptoverride = cfg.get(
      Config.corruptoverride,
      Config.default.corruptoverride
    ) as boolean;
    const corruptsearch = cfg.get(
      Config.corruptsearch,
      Config.default.corruptsearch
    ) as string;
    const pcurr = cfg.get(
      Config.primarycurrency,
      Config.default.primarycurrency
    ) as string;
    const scurr = cfg.get(
      Config.secondarycurrency,
      Config.default.secondarycurrency
    ) as string;
    const onlineonly = cfg.get(
      Config.onlineonly,
      Config.default.onlineonly
    ) as boolean;
    const buyoutonly = cfg.get(
      Config.buyoutonly,
      Config.default.buyoutonly
    ) as boolean;
    const removedupes = cfg.get(
      Config.removedupes,
      Config.default.removedupes
    ) as boolean;
    const prefillmin = cfg.get(
      Config.prefillmin,
      Config.default.prefillmin
    ) as boolean;
    const prefillmax = cfg.get(
      Config.prefillmax,
      Config.default.prefillmax
    ) as boolean;
    const prefillrange = cfg.get(
      Config.prefillrange,
      Config.default.prefillrange
    ) as number;
    const prefillnormals = cfg.get(
      Config.prefillnormals,
      Config.default.prefillnormals
    ) as boolean;
    const prefillpseudos = cfg.get(
      Config.prefillpseudos,
      Config.default.prefillpseudos
    ) as boolean;
    const prefillilvl = cfg.get(
      Config.prefillilvl,
      Config.default.prefillilvl
    ) as boolean;
    const prefillbase = cfg.get(
      Config.prefillbase,
      Config.default.prefillbase
    ) as boolean;

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
    } as PTASettings;

    // search defaults
    const options = {
      usepdps: {
        enabled: false,
        min: null,
        max: null
      },
      useedps: {
        enabled: false,
        min: null,
        max: null
      },
      usear: {
        enabled: false,
        min: null,
        max: null
      },
      useev: {
        enabled: false,
        min: null,
        max: null
      },
      usees: {
        enabled: false,
        min: null,
        max: null
      },
      usesockets: false,
      uselinks: false,
      useilvl: prefillilvl,
      useitembase: prefillbase,
      usecorrupted: item.corrupted ? 'Yes' : 'Any',
      influences: []
    } as ItemOptions;

    if (prefillbase) {
      if (item.influences) {
        options.influences.push(...item.influences);
      }

      if (item.misc?.synthesis) {
        options.usesynthesisbase = prefillbase;
      }
    }

    return { settings, options };
  }

  private searchItemDefault(event: Electron.IpcMainEvent, item: Item) {
    this.searchAPIs.forEach(api => api.searchItemWithDefaults(event, item));
  }

  private searchItemOptions(
    event: Electron.IpcMainEvent,
    item: Item,
    options: ItemOptions,
    openbrowser: boolean
  ) {
    this.searchAPIs.forEach(api => {
      if (api.searchItemWithOptions) {
        api.searchItemWithOptions(event, item, options, openbrowser);
      }
    });
  }
}
