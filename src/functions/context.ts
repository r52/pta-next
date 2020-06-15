import { SetupContext } from '@vue/composition-api';

export function useCloseApp(context: SetupContext) {
  const closeApp = () => {
    const win = context.root.$q.electron.remote.getCurrentWindow();

    if (win) {
      win.close();
    }
  };

  return {
    closeApp
  };
}
