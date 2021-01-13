<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar dense class="q-electron-drag bg-grey-8">
        <q-toolbar-title class="cap">
          {{ title }}
        </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="close" @click="closeApp" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <q-img :src="`${cheatSheetPath}`" contain />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useElectronUtil } from '../functions/context';
import { ipcRenderer } from 'electron';
import log from 'electron-log';

Object.assign(console, log.functions);

export default defineComponent({
  name: 'CheatSheet',

  setup(props, ctx) {
    const { closeApp } = useElectronUtil(ctx);

    const title = ref('Cheat Sheet');
    const cheatSheetPath = ref('');

    ipcRenderer.on('cheatsheet-type', (event, type: string, path: string) => {
      title.value = type + ' Cheat Sheet';
      cheatSheetPath.value = path;
    });

    return {
      title,
      cheatSheetPath,
      closeApp
    };
  }
});
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../fonts/Fontin-SmallCaps.woff) format('woff');
}

body {
  font-family: 'Fontin-SmallCaps';
}

.cap {
  text-transform: capitalize;
}
</style>
