const EventEmitter = require('events');
const poeaddon = require('bindings')('winpoe');

class WinPoE extends EventEmitter {
  constructor() {
    super();

    poeaddon.InstallHandlerCallback(this._handler.bind(this));
  }

  start(vulkanMode, debug = false) {
    poeaddon.Start(vulkanMode);

    if (!debug) {
      poeaddon.InitializeHooks();
    }
  }

  stop() {
    poeaddon.ShutdownHooks();

    poeaddon.Stop();
  }

  setVulkanMode(enabled) {
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

  scrollStash(direction, x, y) {
    poeaddon.SendStashMove(direction, x, y);
  }

  setPoEForeground() {
    return poeaddon.SetPoEForeground();
  }

  _handler(event, arg) {
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

const winpoe = new WinPoE();

module.exports = winpoe;
