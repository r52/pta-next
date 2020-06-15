import { SetupContext } from '@vue/composition-api';

export function useElectronUtil(context: SetupContext) {
  const closeApp = () => {
    const win = context.root.$q.electron.remote.getCurrentWindow();

    if (win) {
      win.close();
    }
  };

  const openBrowser = (url: string) => {
    context.root.$q.electron.remote.shell.openExternal(url);
  };

  return {
    closeApp,
    openBrowser
  };
}
