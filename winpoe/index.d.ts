declare class WinPoE {
  IsPoEForeground(): boolean;
  SendCopyCommand(): void;
  SendPasteCommand(): void;
  SendStashMove(direction: number, x: number, y: number): void;

  onForegroundChange(foregroundCb: Function): void;

  InitializeHooks(): void;
  ShutdownHooks(): void;
}

declare const winpoe: WinPoE;

export = winpoe;
