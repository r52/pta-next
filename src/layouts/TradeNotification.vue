<template>
  <q-layout view="hHh Lpr fFf" v-if="trade">
    <q-header elevated>
      <q-bar dense class="q-electron-drag bg-grey-8">
        <div>{{ trade.item }}</div>
        <q-space />
        <q-btn dense flat icon="close" @click="closeApp" />
      </q-bar>
      <q-bar dense class="bg-grey-9">
        <div>{{ trade.name }}</div>
        <q-icon name="arrow_back" color="green" v-if="trade.type == 'incoming'">
          <q-tooltip>Incoming</q-tooltip>
        </q-icon>
        <q-icon name="arrow_forward" color="red" v-if="trade.type == 'outgoing'"
          ><q-tooltip>Outgoing</q-tooltip></q-icon
        >
        <div v-if="trade.type == 'incoming'">
          Tab: {{ trade.tab }}, x: {{ trade.x }}, y: {{ trade.y }}
        </div>
      </q-bar>
    </q-header>

    <q-footer>
      <q-bar dense class="q-electron-drag bg-grey-8">
        <div>{{ trade.price }} {{ trade.currency }}</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="home"
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
      </q-bar>
    </q-footer>

    <q-page-container>
      <q-page padding>
        <div class="fit row wrap justify-center items-center content-center">
          <div class="col-auto q-px-xs" v-for="cmd in commands" :key="cmd">
            <q-btn
              color="primary"
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

export default Vue.extend({
  name: 'TradeNotification',

  data() {
    return {
      trade: null as TradeMsg | null,
      commands: [] as TradeCommand[]
    };
  },

  methods: {
    handleTrade(
      event: Electron.IpcRendererEvent,
      trade: TradeMsg,
      commands: TradeCommand[]
    ) {
      this.trade = trade;
      this.commands = commands;
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
  src: url(../statics/Fontin-SmallCaps.ttf) format('truetype');
}

html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #121212e6 !important;
}
</style>