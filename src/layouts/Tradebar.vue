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
            color="indigo-3"
            icon="grid_on"
            size="sm"
            @click="sendMsg('stash-setup')"
          >
            <q-tooltip>Setup Stash Highlighting</q-tooltip>
          </q-btn>
          <q-btn dense flat color="teal" icon="history" size="sm">
            <q-menu>
              <q-list bordered dense>
                <q-item-label header>Trade History</q-item-label>
                <template v-for="trade in history">
                  <q-separator color="blue" :key="`trsp${trade.time}`" />
                  <q-item
                    dense
                    :key="`${trade.item}${trade.time}`"
                    :class="
                      trade.type == 'incoming' ? `bg-green-10` : `bg-red-10`
                    "
                  >
                    <q-item-section side>
                      <q-btn
                        dense
                        icon="close"
                        size="sm"
                        @click="historyCommand('delete-history', trade)"
                      >
                        <q-tooltip>Delete</q-tooltip>
                      </q-btn>
                      <q-btn
                        dense
                        icon="restore"
                        size="sm"
                        @click="historyCommand('restore-history', trade)"
                      >
                        <q-tooltip>Restore</q-tooltip>
                      </q-btn>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ trade.name }}</q-item-label>
                      <q-item-label caption
                        >{{ trade.price }} {{ trade.currency }}</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      {{ getElapsedTime(now, trade.time) }} ago
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-menu>
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
        <div class="clickthru" style="height: 25vh;"></div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcRenderer } from 'electron';
import log from 'electron-log';

Object.assign(console, log.functions);

export default Vue.extend({
  name: 'Tradebar',

  data() {
    return {
      history: [] as TradeMsg[],
      now: new Date(),
    };
  },

  methods: {
    historyCommand(command: string, trade: TradeMsg) {
      ipcRenderer.send(command, trade);
    },
    sendMsg(msg: string) {
      ipcRenderer.send(msg);
    },
    sendCommand(command: string) {
      ipcRenderer.send('trade-command', {}, command);
    },
    getElapsedTime: (current: number, time: number) => {
      let dif = current - time;

      // convert to seconds
      dif = Math.floor(dif / 1000);

      if (dif < 60) {
        return dif.toString() + 's';
      }

      // minutes
      if (dif < 3600) {
        return Math.floor(dif / 60).toString() + 'm';
      }

      if (dif < 86400) {
        return Math.floor(dif / 3600).toString() + 'h';
      }

      return Math.floor(dif / 86400).toString() + 'd';
    },
    closeApp() {
      const win = this.$q.electron.remote.getCurrentWindow();

      if (win) {
        win.close();
      }
    },
  },

  created() {
    ipcRenderer.on('trade-history', (event, history) => {
      this.history = history;
    });

    setInterval(() => (this.now = new Date()), 1000);
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('trade-history');
  },

  mounted() {
    const win = this.$q.electron.remote.getCurrentWindow();
    const els = document.getElementsByClassName('clickthru');
    if (els) {
      Array.from(els).forEach((el) => {
        el.addEventListener('mouseenter', () => {
          win.setIgnoreMouseEvents(true, { forward: true });
        });
        el.addEventListener('mouseleave', () => {
          win.setIgnoreMouseEvents(false);
        });
      });
    }
  },
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
