import { ipcMain } from 'electron';
import log from 'electron-log';
import cfg from 'electron-cfg';
import { EventEmitter } from 'events';
import fs from 'fs';
import readline from 'readline';

import trademsg from './trademsg';
import Config from '../lib/config';

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

  constructor() {
    super();

    ipcMain.on('clientlog-changed', (event, path) => {
      this.setPath(path);
    });

    // setup client monitor
    const clientlog = cfg.get(
      Config.clientlogpath,
      Config.default.clientlogpath
    );
    this.setPath(clientlog);
  }

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

      let type = 'incoming';

      if (ltxt.startsWith('@To')) {
        type = 'outgoing';
      }

      // Remove whisper tags
      const tag = /^@(From|To) (<\S+> )?/;
      ltxt = ltxt.replace(tag, '');

      const msgparts = ltxt.split(/: (.+)/, 2);

      if (msgparts.length < 2) {
        log.warn('Error parsing whisper text:', ltxt);
        return;
      }

      const pname = msgparts[0];
      this.lastwhisper = pname;

      const msg = msgparts[1];

      const processed = Object.entries(trademsg).some(entry => {
        const mobj = entry[1];

        if (msg.startsWith(mobj.test)) {
          // process
          mobj.types.some(t => {
            const match = t.reg.exec(msg);

            if (match) {
              const tradeobj = t.process(pname, type, match);

              if (tradeobj) {
                this.emit('new-trade', tradeobj);

                return true;
              }
            }

            return false;
          });

          return true;
        }

        return false;
      });

      if (!processed && type == 'incoming') {
        this.emit('new-whisper', pname, msg);
      }
    } else if (ltxt.startsWith(': ')) {
      if (ltxt.endsWith(' has joined the area.')) {
        // joined
        const match = /^: (.+) has joined the area.$/.exec(ltxt);

        if (match && match.length == 2) {
          const pname = match[1];
          this.emit('entered-area', pname);
        }
      } else if (ltxt.endsWith(' has left the area.')) {
        // left
        const match = /^: (.+) has left the area.$/.exec(ltxt);

        if (match && match.length == 2) {
          const pname = match[1];
          this.emit('left-area', pname);
        }
      }
    }
  }
}
