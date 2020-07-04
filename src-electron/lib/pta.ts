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
import { uIOhook, WheelDirection } from 'uiohook-napi';
import { autoUpdater } from 'electron-updater';

import { ItemParser } from '../lib/itemparser';
import Config, { QuickPasteKey } from '../lib/config';

import ClientMonitor from './clientmonitor';
import TradeManager from './trademanager';

// apis
import URLs from './api/urls';
import { POETradeAPI } from './api/poetrade';
import { POEPricesAPI } from './api/poeprices';

enum ItemHotkey {
  SIMPLE = 0,
  ADVANCED = 1,
  WIKI = 2
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
    quickpastemod: QuickPasteKey.CTRL,
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

  private constructor(splash: BrowserWindow | null) {
    splash?.webContents.send('await-count', 2);

    ///////////////////////////////////////////// Download leagues
    this.leagues = [];

    axios
      .get<Data.Leagues>(URLs.official.leagues)
      .then(response => {
        const data = response.data;

        const lgs = data.result;

        lgs.forEach(element => {
          this.leagues.push(element.id);
        });

        const setlg = this.getLeague();

        log.info('League data loaded. Setting league to', setlg);

        splash?.webContents.send('data-ready');
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
      .get<Data.Items>(URLs.official.items)
      .then(response => {
        const data = response.data;
        const itm = data.result;

        for (const type of itm) {
          const el = type.entries;

          for (const et of el) {
            if (et.name) {
              this.uniques.set(et.name, et);
            } else if (et.type) {
              this.uniques.set(et.type, et);
            } else {
              log.debug('Item entry has neither name nor type:', et);
            }
          }
        }

        log.info('Unique item data loaded');

        // Load APIs
        this.parser = new ItemParser(this.uniques, splash);
        this.searchAPIs.push(new POETradeAPI(this.uniques, splash));
        this.searchAPIs.push(new POEPricesAPI(this.uniques));

        splash?.webContents.send('data-ready');

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
      ) as boolean;

      winpoe.setVulkanMode(vulkanCompat);
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

    uIOhook.on('wheel', event => {
      if (
        event.direction == WheelDirection.VERTICAL &&
        event.ctrlKey &&
        this.settings.cscrollEnabled
      ) {
        winpoe.scrollStash(event.rotation, event.x, event.y);
      }
    });

    uIOhook.on('keydown', event => {
      if (this.settings.quickpaste) {
        switch (this.settings.quickpastemod) {
          case QuickPasteKey.CTRL:
            this.settings.qpmodHeld = event.ctrlKey;
            break;
          case QuickPasteKey.SHIFT:
            this.settings.qpmodHeld = event.shiftKey;
            break;
        }
      }
    });

    uIOhook.on('keyup', event => {
      if (this.settings.quickpaste) {
        switch (this.settings.quickpastemod) {
          case QuickPasteKey.CTRL:
            this.settings.qpmodHeld = event.ctrlKey;
            break;
          case QuickPasteKey.SHIFT:
            this.settings.qpmodHeld = event.shiftKey;
            break;
        }
      }
    });

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

  public static getInstance(splash: BrowserWindow | null = null): PTA {
    if (!PTA.instance) {
      PTA.instance = new PTA(splash);
    }

    return PTA.instance;
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

    // Update check
    autoUpdater.logger = log;

    const checkForUpdates = cfg.get(
      Config.checkForUpdates,
      Config.default.checkForUpdates
    ) as boolean;
    const autoUpdate = cfg.get(
      Config.autoUpdate,
      Config.default.autoUpdate
    ) as boolean;
    const vulkanCompat = cfg.get(
      Config.vulkanCompat,
      Config.default.vulkanCompat
    ) as boolean;

    const appPath = app.getAppPath();

    if (checkForUpdates) {
      if (appPath.includes('AppData')) {
        // installer version

        if (autoUpdate) {
          // Auto update on
          void autoUpdater.checkForUpdatesAndNotify();
        } else {
          // Auto update off
          autoUpdater.autoDownload = false;

          autoUpdater.on('update-available', () => {
            void dialog
              .showMessageBox({
                type: 'info',
                title: 'New Version Available',
                message:
                  'A new version of PTA-Next is available. Would you like to update now?',
                buttons: ['Yes', 'No']
              })
              .then(result => {
                if (result.response === 0) {
                  void autoUpdater.downloadUpdate();
                }
              });
          });

          autoUpdater.on('update-downloaded', () => {
            void dialog
              .showMessageBox({
                title: 'Installing Updates',
                message:
                  'Updates downloaded. PTA-Next will now exit to install update.'
              })
              .then(() => {
                setImmediate(() => autoUpdater.quitAndInstall());
              });
          });

          void autoUpdater.checkForUpdates();
        }
      } else {
        // portable version
        autoUpdater.autoDownload = false;

        autoUpdater.on('update-available', () => {
          void dialog
            .showMessageBox({
              type: 'info',
              title: 'New Version Available',
              message:
                'A new version of PTA-Next is available. Would you like to go download it?',
              buttons: ['Yes', 'No']
            })
            .then(result => {
              if (result.response === 0) {
                void shell.openExternal(
                  'https://github.com/r52/pta-next/releases'
                );
              }
            });
        });

        if (autoUpdater.isUpdaterActive()) {
          void autoUpdater.checkForUpdates();
        }
      }
    }

    winpoe.start(vulkanCompat, process.env.NODE_ENV == 'development');
    uIOhook.start();

    // setup trade manager
    this.trademanager.setup();
  }

  public shutdown(): void {
    this.unregisterShortcuts();

    winpoe.stop();
    uIOhook.stop();
  }

  private registerShortcuts() {
    // price check keys
    const smphotkeyenabled = cfg.get(
      Config.simplehotkeyenabled,
      Config.default.simplehotkeyenabled
    ) as boolean;
    const simplehotkey = cfg.get(
      Config.simplehotkey,
      Config.default.simplehotkey
    ) as string;

    const advhotkeyenabled = cfg.get(
      Config.advancedhotkeyenabled,
      Config.default.advancedhotkeyenabled
    ) as boolean;
    const advhotkey = cfg.get(
      Config.advancedhotkey,
      Config.default.advancedhotkey
    ) as string;

    const wikihotkeyenabled = cfg.get(
      Config.wikihotkeyenabled,
      Config.default.wikihotkeyenabled
    ) as boolean;
    const wikihotkey = cfg.get(
      Config.wikihotkey,
      Config.default.wikihotkey
    ) as string;

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
    const qpaste = cfg.get(
      Config.quickpaste,
      Config.default.quickpaste
    ) as boolean;
    this.settings.quickpaste = qpaste;

    const qpastemod = cfg.get(
      Config.quickpastemod,
      Config.default.quickpastemod
    ) as QuickPasteKey;
    this.settings.quickpastemod = qpastemod;

    // cscroll
    const cscroll = cfg.get(Config.cscroll, Config.default.cscroll) as boolean;
    this.settings.cscrollEnabled = cscroll;

    // macros
    const macros = cfg.get(
      Config.macros,
      Config.default.macros
    ) as CustomMacro[];
    macros.forEach(macro => {
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
    if (!winpoe.isPoEForeground()) {
      return;
    }

    switch (type) {
      case 'chat':
        this.executeChatCommand(command);
        break;
      case 'url':
        void shell.openExternal(command);
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
          const fn = this.macroVariables.get(token as string) as () => string;
          const rval = fn();

          if (rval) {
            return rval;
          }
        }

        return token as string;
      });
    }

    clipboard.writeText(command);
    winpoe.sendPaste();
  }

  public getLeague(): string {
    let league = cfg.get(Config.league, Config.default.league) as number;

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

  public createSettingsWindow(): void {
    if (!this.settingsWindow) {
      this.settingsWindow = cfg.window({ name: 'settings' }).create({
        width: 1000,
        height: 600,
        frame: false,
        title: 'PTA-Next Settings',
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true
        }
      });

      void this.settingsWindow.loadURL(
        (process.env.APP_URL as string) + '#/settings'
      );

      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });
    }
  }

  public createAboutWindow(): void {
    if (!this.aboutWindow) {
      this.aboutWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false,
        title: 'About PTA-Next',
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true
        }
      });

      void this.aboutWindow.loadURL(
        (process.env.APP_URL as string) + '#/about'
      );

      this.aboutWindow.on('closed', () => {
        this.aboutWindow = null;
      });
    }
  }

  public openTradeBar(): void {
    this.trademanager.showTradeBar();
  }

  private handleItemHotkey(type: ItemHotkey) {
    const poefg = winpoe.isPoEForeground();

    if (poefg) {
      winpoe.sendCopy();
      setTimeout(() => {
        this.handleClipboard(type);
      }, 50);
    }
  }

  private createItemUI() {
    const wincfg = cfg.window({ name: 'item' });
    const itemWindow = new BrowserWindow({
      width: 600,
      height: 800,
      alwaysOnTop: true,
      transparent: true,
      frame: false,
      backgroundColor: '#00000000',
      title: 'PTA-Next',
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
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

    void itemWindow.loadURL((process.env.APP_URL as string) + '#/item');

    itemWindow.webContents.on('context-menu', () => {
      itemWindow.close();
    });

    return itemWindow;
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

    let itmwin = null as BrowserWindow | null;

    switch (type) {
      case ItemHotkey.SIMPLE:
      case ItemHotkey.ADVANCED: {
        itmwin = this.createItemUI();
        break;
      }
    }

    const item = this.parser.parse(itemtext);

    item.then(
      itm => {
        if (!itm) {
          itmwin?.close();

          dialog.showErrorBox(
            'Item Error',
            'Error parsing item text. Check log for more details.'
          );

          return;
        }

        switch (type) {
          case ItemHotkey.SIMPLE:
          case ItemHotkey.ADVANCED: {
            const { settings, options } = this.fillSearchOptions(itm);
            itmwin?.webContents.on('did-finish-load', () => {
              itmwin?.webContents.send('item', itm, settings, options, type);
            });
            break;
          }
          case ItemHotkey.WIKI:
            this.openWiki(itm);
            break;
        }
      },
      () => {
        // TODO: do nothing on fail
      }
    );
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
    void shell.openExternal(URLs.wiki + itemName);
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
      influences: [],
      usefractured: false,
      usesynthesised: false
    } as ItemOptions;

    if (prefillbase) {
      if (item.influences) {
        options.influences.push(...item.influences);
      }

      if (item.synthesised) {
        options.usesynthesised = prefillbase;
      }

      if (item.fractured) {
        options.usefractured = prefillbase;
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
