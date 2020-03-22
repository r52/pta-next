declare class WinPoE {
  IsPoEForeground(): boolean;

  SendCopyCommand(): void;

  SendPasteCommand(): void;

  onForegroundChange(foregroundCb: Function): void;

  SetScrollHookEnabled(enabled: boolean): void;

  InitializeHooks(): void;

  ShutdownHooks(): void;
}

declare const winpoe: WinPoE;

export = winpoe;
