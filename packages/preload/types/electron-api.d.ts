/* eslint-disable @typescript-eslint/ban-types */
interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  appVersion: () => Promise<string>;
  openBrowser: (url: string) => void;
  closeWindow: () => void;
  getConfig: () => Promise<Record<string, unknown>>;
  setConfig: (obj: Record<string, unknown>) => void;
  ipcSend: (channel: string, ...args: any[]) => void;
  ipcOn: (channel: string, func: Function) => void;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
  log: LogFunctions;
}
