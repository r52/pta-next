<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <div class="clickthru" style="height: 75vh;"></div>
      <q-bar class="bg-grey-8">
        <div class="q-electron-drag">
          <q-icon name="drag_indicator" size="sm" />
        </div>
        <q-btn
          dense
          flat
          icon="warning"
          size="sm"
          @click="sendMsg('test-trade-notification')"
        >
          <q-tooltip>Test Notification</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="settings"
          size="sm"
          @click="sendMsg('open-settings')"
        >
          <q-tooltip>Open Settings</q-tooltip>
        </q-btn>
        <q-space />
        <q-btn dense flat icon="close" size="sm" @click="closeApp">
          <q-tooltip>Close Tradebar</q-tooltip>
        </q-btn>
      </q-bar>
      <div class="clickthru" style="height: 25vh;"></div>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcRenderer } from 'electron';

export default Vue.extend({
  name: 'Tradebar',

  methods: {
    sendMsg(msg: string) {
      ipcRenderer.send(msg);
    },
    closeApp() {
      const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow();

      if (win) {
        win.close();
      }
    }
  },

  mounted() {
    const win = this.$q.electron.remote.getCurrentWindow();
    const els = document.getElementsByClassName('clickthru');
    if (els) {
      Array.from(els).forEach(el => {
        el.addEventListener('mouseenter', () => {
          win.setIgnoreMouseEvents(true, { forward: true });
        });
        el.addEventListener('mouseleave', () => {
          win.setIgnoreMouseEvents(false);
        });
      });
    }
  }
});
</script>

<style>
html {
  overflow-y: hidden !important;
}

body {
  background-color: #12121200 !important;
}
</style>
