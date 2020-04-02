<template>
  <q-layout view="hHh Lpr fFf" v-if="trade">
    <q-header elevated>
      <q-bar dense class="q-electron-drag bg-grey-8">
        <div class="text-yellow">{{ trade.item }}</div>
        <q-space />
        <q-btn dense flat icon="close" @click="closeApp" />
      </q-bar>
      <q-bar dense class="bg-grey-9">
        <div class="text-orange">{{ trade.name }}</div>
        <div
          v-if="trade.type == 'incoming'"
          @mouseover="highlightStash"
          @mouseout="stopHighlightStash"
        >
          Tab: {{ trade.tab }}, left: {{ trade.x }}, top: {{ trade.y }}
        </div>
        <q-space />
        <div>{{ this.time }}</div>
      </q-bar>
    </q-header>

    <q-footer>
      <q-bar dense class="bg-grey-8">
        <q-icon
          :name="trade.type == 'incoming' ? `arrow_back` : `arrow_forward`"
          :color="trade.type == 'incoming' ? `green` : `red`"
        />
        <div>{{ trade.price }} {{ trade.currency }}</div>
        <div>
          <img
            :src="`statics/images/${trade.currency}.png`"
            style="height: 25px; max-width: 25px"
            class="q-pt-xs"
          />
        </div>
        <q-space />
        <q-btn
          dense
          flat
          icon="home"
          color="green"
          v-if="trade.type == 'outgoing'"
          @click="sendTradeCommand('hideout')"
        >
          <q-tooltip>Hideout</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="person_add"
          color="green"
          v-if="trade.type == 'incoming'"
          @click="sendTradeCommand('invite')"
        >
          <q-tooltip>Invite</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="swap_horiz"
          color="yellow"
          @click="sendTradeCommand('trade')"
        >
          <q-tooltip>Trade</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="person_add_disabled"
          color="red"
          v-if="trade.type == 'incoming'"
          @click="sendTradeCommand('kick')"
        >
          <q-tooltip>Kick</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          icon="person_add_disabled"
          color="red"
          v-if="trade.type == 'outgoing'"
          @click="sendTradeCommand('leave')"
        >
          <q-tooltip>Leave Party</q-tooltip>
        </q-btn>
      </q-bar>
    </q-footer>

    <q-page-container>
      <q-page padding>
        <div class="fit row wrap justify-center items-center content-center">
          <div
            class="col-auto q-px-xs"
            v-for="cmd in commands"
            :key="cmd.label"
          >
            <q-btn
              color="primary"
              size="12px"
              :label="cmd.label"
              @click="sendCustomCommand(cmd)"
            />
          </div>
        </div>
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
  name: 'TradeNotification',

  data() {
    return {
      trade: null as TradeMsg | null,
      commands: [] as TradeCommand[],
      time: ''
    };
  },

  methods: {
    getElapseTime() {
      if (this.trade) {
        let dif = Date.now() - this.trade.time;

        // convert to seconds
        dif = Math.floor(dif / 1000);

        if (dif < 60) {
          this.time = dif.toString() + 's';
          return;
        }

        // minutes
        if (dif < 3600) {
          this.time = Math.floor(dif / 60).toString() + 'm';
          return;
        }

        if (dif < 86400) {
          this.time = Math.floor(dif / 3600).toString() + 'h';
          return;
        }

        this.time = Math.floor(dif / 86400).toString() + 'd';
      }
    },
    handleTrade(
      event: Electron.IpcRendererEvent,
      trade: TradeMsg,
      commands: TradeCommand[]
    ) {
      this.trade = trade;
      this.commands = commands;

      setInterval(() => {
        this.getElapseTime();
      }, 1000);
    },
    highlightStash() {
      ipcRenderer.send(
        'highlight-stash',
        this.trade?.tab,
        this.trade?.x,
        this.trade?.y
      );
    },
    stopHighlightStash() {
      ipcRenderer.send('stop-highlight-stash');
    },
    sendTradeCommand(command: string) {
      ipcRenderer.send('trade-command', this.trade, command);
    },
    sendCustomCommand(command: TradeCommand) {
      ipcRenderer.send('trade-custom-command', this.trade, command);
    },
    closeApp() {
      const win = this.$q.electron.remote.getCurrentWindow();

      if (win) {
        win.close();
      }
    }
  },

  created() {
    ipcRenderer.on('trade', (event, trade, commands) => {
      this.handleTrade(event, trade, commands);
    });
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
  background-color: #121212e6 !important;
}
</style>
