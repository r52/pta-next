/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';

const poeaddon: PoEAddon = require('bindings')('winpoe');

interface PoERect {
  valid: boolean;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
}

interface PoEAddon {
  InstallHandlerCallback(cb: (event: string, arg: any) => void): void;
  Start(vulkan: boolean): void;
  InitializeHooks(): void;
  ShutdownHooks(): void;
  Stop(): void;
  SetVulkanCompatibility(vulkan: boolean): void;
  IsPoEForeground(): boolean;
  SendCopyCommand(): void;
  SendPasteCommand(): void;
  SendStashMove(direction: number, x: number, y: number): void;
  SetPoEForeground(): void;
  GetPoERect(): PoERect;
}

declare interface WinPoE {
  on(event: 'foreground', listener: (isPoe: boolean) => void): this;
  on(event: 'clipboard', listener: () => void): this;
}

class WinPoE extends EventEmitter {
  constructor() {
    super();

    poeaddon.InstallHandlerCallback(this._handler.bind(this));
  }

  start(vulkanMode: boolean, debug = false) {
    poeaddon.Start(vulkanMode);

    if (!debug) {
      poeaddon.InitializeHooks();
    }
  }

  stop() {
    poeaddon.ShutdownHooks();

    poeaddon.Stop();
  }

  setVulkanMode(enabled: boolean) {
    poeaddon.SetVulkanCompatibility(enabled);
  }

  isPoEForeground() {
    return poeaddon.IsPoEForeground();
  }

  sendCopy() {
    poeaddon.SendCopyCommand();
  }

  sendPaste() {
    poeaddon.SendPasteCommand();
  }

  scrollStash(direction: number, x: number, y: number) {
    poeaddon.SendStashMove(direction, x, y);
  }

  setPoEForeground() {
    return poeaddon.SetPoEForeground();
  }

  getPoERect() {
    return poeaddon.GetPoERect();
  }

  private _handler(event: string, arg: any) {
    switch (event) {
      case 'foreground':
        this.emit(event, arg);
        break;
      default:
        this.emit(event);
        break;
    }
  }
}

export default new WinPoE();
