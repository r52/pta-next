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
import Config from '../lib/config';
import * as PoE from '../lib/api/poe';
import axios from 'axios';

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
      PoE.searchItemWithOptions(event, item, options, openbrowser);
    });
  }

  public shutdown() {
    this.unregisterShortcuts();
  }

  public registerShortcuts() {
    const simplehotkey = cfg.get(
      Config.simplehotkey,
      Config.default.simplehotkey
    );

    globalShortcut.register(simplehotkey, () => {
      this.handleItemHotkey(ItemHotkey.SIMPLE);
    });
  }

  public unregisterShortcuts() {
    globalShortcut.unregisterAll();
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

  private handleItemHotkey(type: ItemHotkey) {
    const poefg = winapi.IsPoEForeground();

    if (poefg) {
      robot.keyTap('c', 'control');
      setTimeout(() => {
        this.handleClipboard(type);
      }, 10);
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
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: true
      }
    });

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
      const { settings, options } = this.fillSearchOptions(item);

      this.createItemUI(item, settings, options);
    }

    // TODO REST OF THIS SHIT
  }

  private fillSearchOptions(item: any) {
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
}
