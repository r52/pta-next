import { app, BrowserWindow, ipcMain } from 'electron';

export class PTA {
  constructor() {
    // TODO

    ipcMain.on('close-current-window', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.close();
    });

    ipcMain.handle('get-version', async () => {
      const result = app.getVersion();
      return result;
    });
  }

  public shutdown(): void {
    // TODO
  }
}
