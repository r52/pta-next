interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  appVersion: () => Promise<string>;
  openBrowser: (url: string) => void;
  closeWindow: () => void;
  getConfig: () => Promise<Record<string, unknown>>;
  setConfig: (obj: Record<string, unknown>) => void;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
  log: LogFunctions;
}
