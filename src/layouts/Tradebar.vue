<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page>
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
            color="indigo-3"
            icon="grid_on"
            size="sm"
            @click="sendMsg('stash-setup')"
          >
            <q-tooltip>Setup Stash Highlighting</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            color="teal"
            icon="history"
            size="sm"
            @click="sendMsg('open-trade-history')"
          >
            <q-tooltip>Trade History</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            color="orange"
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
        <div
          style="height: 100vh;"
          @mouseover="ignoreMouse(true)"
          @mouseout="ignoreMouse(false)"
        ></div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useElectronUtil } from '../functions/context';
import { ipcRenderer } from 'electron';
import log from 'electron-log';

Object.assign(console, log.functions);

export default defineComponent({
  name: 'Tradebar',

  setup(props, ctx) {
    function sendMsg(msg: string) {
      ipcRenderer.send(msg);
    }

    function sendCommand(command: string) {
      ipcRenderer.send('trade-command', {}, command);
    }

    function ignoreMouse(enabled: boolean) {
      ipcRenderer.send('trade-bar-ignore-mouse', enabled);
    }

    const { closeApp } = useElectronUtil(ctx);

    return {
      sendMsg,
      sendCommand,
      closeApp,
      ignoreMouse
    };
  }
});
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../fonts/Fontin-SmallCaps.woff) format('woff');
}

html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #12121200 !important;
}
</style>
