import {
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain
} from 'electron';
import * as winapi from './winapi';
import { ItemParser } from '../lib/itemparser';
import robot from 'robotjs';
import log from 'electron-log';
import cfg from 'electron-cfg';
const axios = require('axios').default;

enum ItemHotkey {
  SIMPLE,
  ADVANCED
}

const uApiLeague = 'https://www.pathofexile.com/api/trade/data/leagues';

export class PTA {
  private static instance: PTA;
  private static parser: ItemParser;
  private leagues: string[];

  private constructor() {
    PTA.parser = ItemParser.getInstance();

    ///////////////////////////////////////////// Download leagues
    this.leagues = [];

    axios
      .get(uApiLeague)
      .then((response: any) => {
        const data = response.data;

        const lgs = data['result'];

        lgs.forEach((element: { [x: string]: string }) => {
          this.leagues.push(element['id']);
        });

        const setlg = this.getLeague();

        log.info('League data loaded. Setting league to', setlg);
      })
      .catch((error: any) => {
        log.error(error);
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
    ipcMain.on('search', (event, item, options, openbrowser) => {
      this.doAdvancedSearch(event, item, options, openbrowser);
    });
  }

  public shutdown() {
    this.unregisterShortcuts();
  }

  public registerShortcuts() {
    globalShortcut.register('CommandOrControl+D', () => {
      this.handleItemHotkey(ItemHotkey.SIMPLE);
    });
  }

  public unregisterShortcuts() {
    globalShortcut.unregisterAll();
  }

  public getLeague() {
    let league = cfg.get('general.league', 0);

    if (league > this.leagues.length) {
      dialog.showErrorBox(
        'League Warning',
        'Previously set league no longer available. Resetting to default league.'
      );

      league = 0;
      cfg.set('general.league', 0);
    }

    return this.leagues[league];
  }

  private handleItemHotkey(type: ItemHotkey) {
    if (type == ItemHotkey.SIMPLE) {
      console.log('Simple hotkey pressed');
    }

    const poefg = winapi.IsPoEForeground();

    console.log('Poe?:', poefg);

    if (poefg) {
      robot.keyTap('c', 'control');
      setTimeout(() => {
        this.handleClipboard(type);
      }, 0);
    }
  }

  private createItemUI(item: any, settings: any, options: any) {
    const itemWindow = new BrowserWindow({
      width: 800,
      height: 800,
      useContentSize: true,
      alwaysOnTop: true,
      transparent: true,
      frame: false,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    });

    itemWindow.once('ready-to-show', () => itemWindow.show());

    itemWindow.loadURL((process.env.APP_URL as string) + '#/item');

    itemWindow.webContents.on('context-menu', () => {
      itemWindow.close();
    });

    itemWindow.webContents.on('did-finish-load', () => {
      itemWindow.webContents.send('item', item, settings, options);
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

    const item = PTA.parser.parse(itemtext);

    if (item) {
      // console.log(item);

      const { settings, options } = this.fillSearchOptions(item);

      this.createItemUI(item, settings, options);
    }

    // TODO REST OF THIS SHIT
  }

  private fillSearchOptions(item: any) {
    const league = this.getLeague();
    const displaylimit = cfg.get('pricecheck.displaylimit', 20);
    const corruptoverride = cfg.get('pricecheck/corruptoverride', false);
    const corruptsearch = cfg.get('pricecheck/corruptsearch', 'Any');
    const pcurr = cfg.get('pricecheck/primarycurrency', 'chaos');
    const scurr = cfg.get('pricecheck/secondarycurrency', 'exa');
    const onlineonly = cfg.get('pricecheck/online', true);
    const buyoutonly = cfg.get('pricecheck/buyout', true);
    const removedupes = cfg.get('pricecheck/duplicates', true);
    const prefillmin = cfg.get('pricecheck/prefillmin', false);
    const prefillmax = cfg.get('pricecheck/prefillmax', false);
    const prefillrange = cfg.get('pricecheck/prefillrange', 0);
    const prefillnormals = cfg.get('pricecheck/prefillnormals', false);
    const prefillpseudos = cfg.get('pricecheck/prefillpseudos', true);
    const prefillilvl = cfg.get('pricecheck/prefillilvl', false);
    const prefillbase = cfg.get('pricecheck/prefillbase', false);

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
      usecorrupted: 'corrupted' in item && item['corrupted'] ? 'Yes' : 'Any'
    } as any;

    if (prefillbase) {
      if ('influences' in item) {
        options['influences'] = [...item['influences']];
      }

      if (
        'misc' in item &&
        'synthesis' in item['misc'] &&
        item['misc']['synthesis']
      ) {
        options['usesynthesisbase'] = prefillbase;
      }
    }

    return { settings, options };
  }

  private doAdvancedSearch(
    event: Electron.IpcMainEvent,
    item: any,
    options: any,
    openbrowser: boolean
  ) {
    console.log(item);
    console.log(options);
    console.log(openbrowser);
  }
}
