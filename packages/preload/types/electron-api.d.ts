interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  appVersion: () => Promise<string>;
  openBrowser: (url: string) => void;
  closeWindow: () => void;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
