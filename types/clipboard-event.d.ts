declare module 'clipboard-event' {
  import { EventEmitter } from 'events';
  class ClipboardEventListener extends EventEmitter {
    startListening(): void;
    stopListening(): void;
  }

  const clipboardListener: ClipboardEventListener;
  export = clipboardListener;
}
