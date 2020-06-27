<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page padding>
        <div class="q-pa-md">
          <div class="q-gutter-sm column items-center">
            <q-img src="icon.png" width="70%" height="70%" />
            <q-spinner color="primary" size="3em" :thickness="10" />
            <p>Downloading API data...</p>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount } from '@vue/composition-api';
import { useElectronUtil } from '../functions/context';
import { ipcRenderer } from 'electron';

export default defineComponent({
  name: 'Splash',

  setup(props, ctx) {
    const { closeApp } = useElectronUtil(ctx);

    let counter = 0;

    ipcRenderer.on('await-count', (event, count) => {
      counter += count;
    });

    ipcRenderer.on('data-ready', () => {
      counter--;

      if (counter <= 0) {
        closeApp();
      }
    });

    onBeforeUnmount(() => {
      ipcRenderer.removeAllListeners('await-count');
      ipcRenderer.removeAllListeners('data-ready');
    });
  }
});
</script>
