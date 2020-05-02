<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-bar dense class="q-electron-drag bg-grey-8">
        <div>Trades</div>
        <q-space />
        <q-btn dense flat icon="close" @click="close" />
      </q-bar>
      <q-bar class="bg-grey-7">
        <q-tabs v-model="tab" shrink dense align="justify" :breakpoint="0">
          <q-tab
            v-for="trade in trades"
            :key="`${trade.name}${trade.time}`"
            :name="`${trade.name}${trade.time}`"
            :label="trades.length > 1 ? truncateName(trade.item) : trade.item"
            :class="{
              'text-purple': trade.newwhisper,
              'text-green': trade.enteredarea,
              'text-yellow': !trade.newwhisper && !trade.enteredarea
            }"
          >
            <q-tooltip>{{ trade.item }}</q-tooltip>
          </q-tab>
        </q-tabs>
      </q-bar>
    </q-header>

    <q-page-container>
      <q-page>
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel
            v-for="trade in trades"
            :key="`${trade.name}${trade.time}`"
            :name="`${trade.name}${trade.time}`"
            class="q-ma-none q-pa-none"
          >
            <q-bar class="bg-grey-9">
              <div class="text-orange">{{ trade.name }}</div>
              <div
                v-if="trade.type == 'incoming' && trade.tab"
                @mouseover="highlightStash(trade)"
                @mouseout="stopHighlightStash"
              >
                Tab: {{ trade.tab }}, left: {{ trade.x }}, top: {{ trade.y }}
              </div>
              <q-space />
              <div>{{ trade.curtime }}</div>
            </q-bar>

            <div
              class="row wrap justify-center items-center content-center q-pa-sm"
              style="height: calc(100vh - 120px);"
            >
              <div
                class="col-auto q-px-xs"
                v-for="cmd in trade.commands"
                :key="cmd.label"
              >
                <q-btn
                  color="primary"
                  size="12px"
                  :label="cmd.label"
                  @click="sendCustomCommand(trade, cmd)"
                />
              </div>
            </div>

            <q-bar class="bg-grey-8">
              <q-icon
                :name="
                  trade.type == 'incoming' ? `arrow_back` : `arrow_forward`
                "
                :color="trade.type == 'incoming' ? `green` : `red`"
              />
              <div>{{ trade.price }} {{ trade.currency }}</div>
              <div>
                <img
                  :src="`statics/images/${trade.currency}.png`"
                  style="height: 25px; max-width: 25px;"
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
                @click="sendTradeCommand(trade, 'hideout')"
              >
                <q-tooltip>Hideout</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                icon="person_add"
                color="green"
                v-if="trade.type == 'incoming'"
                @click="sendTradeCommand(trade, 'invite')"
              >
                <q-tooltip>Invite</q-tooltip>
              </q-btn>
              <q-btn
                dense
                :flat="!trade.enteredarea"
                icon="swap_horiz"
                color="yellow"
                :text-color="trade.enteredarea ? 'black' : ''"
                @click="sendTradeCommand(trade, 'trade')"
              >
                <q-tooltip>Trade</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                icon="person_add_disabled"
                color="red"
                v-if="trade.type == 'incoming'"
                @click="sendTradeCommand(trade, 'kick')"
              >
                <q-tooltip>Kick</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                icon="person_add_disabled"
                color="red"
                v-if="trade.type == 'outgoing'"
                @click="sendTradeCommand(trade, 'leave')"
              >
                <q-tooltip>Leave Party</q-tooltip>
              </q-btn>
            </q-bar>
          </q-tab-panel>
        </q-tab-panels>
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
      tab: '',
      trades: [] as TradeNotification[]
    };
  },

  methods: {
    truncateName(str: string) {
      const maxlen = 12;
      if (str.length > maxlen) {
        return str.substring(0, maxlen) + '...';
      }
      return str;
    },
    getElapseTime() {
      this.trades.forEach(trade => {
        let dif = Date.now() - trade.time;

        // convert to seconds
        dif = Math.floor(dif / 1000);

        if (dif < 60) {
          trade.curtime = dif.toString() + 's';
          return;
        }

        // minutes
        if (dif < 3600) {
          trade.curtime = Math.floor(dif / 60).toString() + 'm';
          return;
        }

        if (dif < 86400) {
          trade.curtime = Math.floor(dif / 3600).toString() + 'h';
          return;
        }

        trade.curtime = Math.floor(dif / 86400).toString() + 'd';
      });
    },
    handleTrade(event: Electron.IpcRendererEvent, trade: TradeNotification) {
      this.trades.push(trade);

      if (!this.tab) {
        this.tab = trade.name + trade.time;
      }
    },
    handleTradeEvent(event: string, name: string) {
      this.trades.some(trade => {
        if (trade.name == name) {
          switch (event) {
            case 'new-whisper':
              trade.newwhisper = true;
              break;
            case 'entered-area':
              trade.enteredarea = true;
              break;
            case 'left-area':
              trade.enteredarea = false;
              break;
          }

          return true;
        }
        return false;
      });
    },
    highlightStash(trade: TradeNotification) {
      ipcRenderer.send('highlight-stash', trade.tab, trade.x, trade.y);
    },
    stopHighlightStash() {
      ipcRenderer.send('stop-highlight-stash');
    },
    sendTradeCommand(trade: TradeNotification, command: string) {
      ipcRenderer.send('trade-command', trade, command);
    },
    sendCustomCommand(trade: TradeNotification, command: TradeCommand) {
      ipcRenderer.send('trade-custom-command', trade, command);

      if (command.close) {
        this.close();
      }
    },
    close() {
      if (this.trades.length <= 1) {
        const win = this.$q.electron.remote.getCurrentWindow();

        if (win) {
          win.close();
        }
      } else if (this.tab) {
        let idx = this.trades.findIndex(trade => {
          return this.tab == trade.name + trade.time;
        });

        this.trades.splice(idx, 1);

        if (idx < 0) idx = 0;
        if (idx > this.trades.length - 1) idx = this.trades.length - 1;

        const last = this.trades[idx];
        this.tab = last.name + last.time;
      }
    }
  },

  created() {
    ipcRenderer.on('trade', (event, trade) => {
      this.handleTrade(event, trade);
    });

    ipcRenderer.on('new-whisper', (event, name) => {
      this.handleTradeEvent('new-whisper', name);
    });

    ipcRenderer.on('entered-area', (event, name) => {
      this.handleTradeEvent('entered-area', name);
    });

    ipcRenderer.on('left-area', (event, name) => {
      this.handleTradeEvent('left-area', name);
    });

    setInterval(() => {
      this.getElapseTime();
    }, 1000);
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('trade');
    ipcRenderer.removeAllListeners('new-whisper');
    ipcRenderer.removeAllListeners('entered-area');
    ipcRenderer.removeAllListeners('left-area');
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
  background-color: #121212e6 !important;
}
</style>
