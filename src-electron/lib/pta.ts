import { BrowserWindow, clipboard, dialog, globalShortcut } from 'electron';
import * as winapi from './winapi';
import { ItemParser } from '../lib/itemparser';
import robot from 'robotjs';
import log from 'electron-log';

enum ItemHotkey {
  SIMPLE,
  ADVANCED
}

export class PTA {
  private static instance: PTA;
  private static parser: ItemParser;

  private constructor() {
    // do something
    PTA.parser = ItemParser.getInstance();
  }

  public static getInstance(): PTA {
    if (!PTA.instance) {
      PTA.instance = new PTA();
    }

    return PTA.instance;
  }

  public setup() {
    this.registerShortcuts();
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

  private createItemUI(item: any) {
    const itemWindow = new BrowserWindow({
      width: 800,
      height: 800,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    itemWindow.loadURL((process.env.APP_URL as string) + '#/item');
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
      console.log(item);

      this.createItemUI(item);
    }

    // TODO REST OF THIS SHIT
  }
}
