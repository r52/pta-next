/* eslint-disable @typescript-eslint/ban-types */
import { contextBridge, shell, ipcRenderer } from 'electron';
import log from 'electron-log';

const apiKey = 'electron';
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: ElectronApi = {
  versions: process.versions,
  appVersion: () => ipcRenderer.invoke('get-version'),
  openBrowser: (url: string) => {
    shell.openExternal(url);
  },
  closeWindow: () => {
    ipcRenderer.send('close-current-window');
  },
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (obj: Record<string, unknown>) =>
    ipcRenderer.invoke('set-config', obj),
  ipcSend: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  ipcOn: (channel: string, func: Function) => {
    ipcRenderer.on(channel, (event, ...args) => {
      func(...args);
    });
  },
};

window.log = log.functions;

/**
 * If contextIsolated enabled use contextBridge
 * Else use fallback
 *
 * Note: Spectron tests can't work in isolated context
 * @see https://github.com/electron-userland/spectron/issues/693#issuecomment-748482545
 */
if (process.contextIsolated) {
  /**
   * The "Main World" is the JavaScript context that your main renderer code runs in.
   * By default, the page you load in your renderer executes code in this world.
   *
   * @see https://www.electronjs.org/docs/api/context-bridge
   */
  contextBridge.exposeInMainWorld(apiKey, api);
  contextBridge.exposeInMainWorld('log', log.functions);
} else {
  /**
   * Recursively Object.freeze() on objects and functions
   * @see https://github.com/substack/deep-freeze
   * @param obj Object on which to lock the attributes
   */
  const deepFreeze = (obj: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((prop) => {
        const val = obj[prop];
        if (
          (typeof val === 'object' || typeof val === 'function') &&
          !Object.isFrozen(val)
        ) {
          deepFreeze(val);
        }
      });
    }

    return Object.freeze(obj);
  };

  deepFreeze(api);

  window[apiKey] = api;

  // Need for Spectron tests
  window.electronRequire = require;
}
