import log from 'electron-log';
import { EventEmitter } from 'events';
import fs from 'fs';
import readline from 'readline';

// polling rate in milliseconds
const pollingrate = 350;

// fs.watch() cannot be used because it depends on ReadDirectoryChangesW,
// which doesn't trigger because Client.txt doesn't flush AT ALL
// unless the file is accessed externally. Thus we are forced to use a
// polling technique to monitor Client.txt
export default class ClientMonitor extends EventEmitter {
  private logpath = '';
  private enabled = false;
  private lastpos = -1;
  private lastwhisper = '';

  public setPath(path: string) {
    if (!path) {
      this.enabled = false;

      // unwatch old file
      if (this.logpath) {
        fs.unwatchFile(this.logpath);
      }

      this.logpath = '';
      this.lastpos = -1;
      return;
    }

    if (this.logpath != path) {
      // unwatch old file
      if (this.logpath) {
        fs.unwatchFile(this.logpath);
      }

      this.logpath = path;
      fs.watchFile(this.logpath, { interval: pollingrate }, (curr, prev) => {
        this.processLogchange(curr, prev);
      });

      fs.stat(this.logpath, (err, stat) => {
        this.lastpos = stat.size;
        log.info('Initialized Client.txt at', stat.size);
      });

      this.enabled = true;
    }
  }

  public isEnabled() {
    return this.enabled;
  }

  public getLastWhisperer() {
    return this.lastwhisper;
  }

  private processLogchange(curr: fs.Stats, prev: fs.Stats) {
    //
    if (!this.enabled) {
      // shouldn't ever get here
      log.warn('ClientMonitor.processLogchange called when disabled');
      return;
    }

    if (this.lastpos < 0) {
      // Initialization error
      log.warn('Uninitialized Client.txt');
      return;
    }

    if (curr.size < this.lastpos) {
      // File got reset, so reset our position too
      this.lastpos = curr.size;
      return;
    }

    if (curr.size == this.lastpos) {
      // No change
      return;
    }

    const stream = fs.createReadStream(this.logpath, {
      encoding: 'utf8',
      start: prev.size,
      end: curr.size
    });

    const lines = readline.createInterface({
      input: stream,
      output: process.stdout,
      terminal: false
    });

    lines.on('line', line => {
      if (line) {
        this.processLogLine(line);
      }
    });
  }

  private processLogLine(line: string) {
    const parts = line.split('] ');

    if (parts.length < 2) {
      // If not a game info line, skip
      return;
    }

    // Get last part
    let ltxt = parts[parts.length - 1].trim();

    if (ltxt.startsWith('@')) {
      // Whisper

      // Remove whisper tags
      const tag = /^@(From|To) (<\S+> )?/;
      ltxt = ltxt.replace(tag, '');

      const msgparts = ltxt.split(': ');

      if (msgparts.length < 2) {
        log.warn('Error parsing whisper text:', ltxt);
        return;
      }

      const pname = msgparts[0];

      this.lastwhisper = pname;

      // TODO: process whisper text
    }
  }
}
