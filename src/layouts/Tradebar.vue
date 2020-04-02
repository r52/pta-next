<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page>
        <div class="clickthru" style="height: 75vh;"></div>
        <q-bar class="bg-grey-8">
          <div class="q-electron-drag">
            <q-icon name="drag_indicator" size="sm" />
          </div>
          <q-btn
            dense
            flat
            color="green"
            icon="home"
            size="sm"
            @click="sendCommand('self-hideout')"
          >
            <q-tooltip>Hideout</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            color="yellow"
            icon="warning"
            size="sm"
            @click="sendMsg('test-trade-notification')"
          >
            <q-tooltip>Test Notification</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            icon="grid_on"
            size="sm"
            @click="sendMsg('stash-setup')"
          >
            <q-tooltip>Setup Stash Highlighting</q-tooltip>
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
      </q-page>
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
    sendCommand(command: string) {
      ipcRenderer.send('trade-command', {}, command);
    },
    closeApp() {
      const win = this.$q.electron.remote.getCurrentWindow();

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
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../statics/fonts/Fontin-SmallCaps.woff) format('woff');
}

html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #12121200 !important;
}
</style>
