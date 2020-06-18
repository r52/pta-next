import { EventEmitter } from 'events';

declare class WinPoE extends EventEmitter {
  start(vulkanMode: boolean): void;
  stop(): void;
  setVulkanMode(enabled: boolean): void;
  isPoEForeground(): boolean;
  sendCopy(): void;
  sendPaste(): void;
  scrollStash(direction: number, x: number, y: number): void;
  setPoEForeground(): boolean;
}

declare const winpoe: WinPoE;

export = winpoe;
