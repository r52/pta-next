/**
 * @module preload
 */

/* eslint-disable @typescript-eslint/ban-types */
import { contextBridge, shell, ipcRenderer } from 'electron';

const apiKey = 'electron';

/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcSend: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  ipcOn: (channel: string, func: Function) => {
    ipcRenderer.on(channel, (event, ...args) => {
      func(...args);
    });
  },
} as const;

/**
 * The "Main World" is the JavaScript context that your main renderer code runs in.
 * By default, the page you load in your renderer executes code in this world.
 *
 * @see https://www.electronjs.org/docs/api/context-bridge
 */

contextBridge.exposeInMainWorld('versions', process.versions);
contextBridge.exposeInMainWorld(apiKey, api);
