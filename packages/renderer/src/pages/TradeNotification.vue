<template>
  <div class="bg-gray-800 text-white">
    <div class="bg-gray-500 titlebar flex">
      <div class="titlebar-drag-region" />
      <div class="title">
        Trades
      </div>
      <div class="flex-grow" />
      <div class="titlebar-btn">
        <button
          type="button"
          class="
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-white
            hover:bg-gray-400
          "
          @click="closeTabOrWindow"
        >
          <XIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
    <div class="p-2">
      <tabs v-model="tab">
        <tab
          v-for="trade in trades"
          :key="`${trade.name}${trade.time}`"
          :name="`${trade.name}${trade.time}`"
          class="smallTabs"
          :class="{
            'text-purple-400': trade.newwhisper,
            'text-green-400': trade.enteredarea,
            'text-yellow-400': !trade.newwhisper && !trade.enteredarea,
          }"
        >
          {{ trades.length > 1 ? truncateName(trade.item) : trade.item }}
        </tab>
      </tabs>
    </div>
    <div>
      <tab-panels
        v-model="tab"
        class="smallTabPanel"
      >
        <tab-panel
          v-for="trade in trades"
          :key="`${trade.name}${trade.time}`"
          :name="`${trade.name}${trade.time}`"
          class="py-0"
        >
          <div class="bg-gray-500 px-2 flex space-x-2">
            <div class="text-yellow-200">
              {{ trade.name }}
            </div>
            <div
              v-if="trade.type == 'incoming' && trade.tab"
              @mouseover="highlightStash(trade)"
              @mouseout="stopHighlightStash"
            >
              Tab: {{ trade.tab }}, left: {{ trade.x }}, top: {{ trade.y }}
            </div>
            <div class="flex-grow" />
            <div>{{ trade.curtime }}</div>
          </div>

          <div class="py-4 flex justify-center items-center space-x-3">
            <div
              v-for="cmd in trade.commands"
              :key="cmd.label"
            >
              <button
                type="button"
                class="
                  inline-flex
                  items-center
                  px-4
                  py-2
                  border border-transparent
                  text-base
                  leading-6
                  font-medium
                  rounded-md
                  text-white
                  bg-blue-600
                  hover:bg-blue-500
                  focus:border-blue-700
                  active:bg-blue-700
                "
                @click="sendCustomCommand(trade, cmd)"
              >
                {{ cmd.label }}
              </button>
            </div>
          </div>

          <div
            class="
              fixed
              bottom-0
              left-0
              px-2
              bg-gray-500
              flex
              h-6
              w-full
              items-center
              space-x-2
            "
          >
            <div v-if="trade.type == 'incoming'">
              <ArrowRightIcon class="h-4 w-4 text-green-400" />
            </div>
            <div v-else>
              <ArrowLeftIcon class="h-4 w-4 text-red-400" />
            </div>

            <div>{{ trade.price }} {{ trade.currency }}</div>

            <div>
              <img
                :src="getCurrencyImage(trade.currency)"
                style="height: 30px; max-width: 30px"
                class="py-1"
              >
            </div>

            <div class="flex-grow" />

            <div v-if="trade.type == 'incoming'">
              <button
                type="button"
                class="
                  tooltip
                  p-1
                  inline-flex
                  items-center
                  border border-transparent
                  rounded-sm
                  text-green-300
                  hover:bg-gray-400
                "
                @click="sendTradeCommand(trade, 'invite')"
              >
                <UserAddIcon class="h-4 w-4" />
                <span class="tooltiptext">Invite</span>
              </button>
            </div>
            <div v-else>
              <button
                type="button"
                class="
                  tooltip
                  p-1
                  inline-flex
                  items-center
                  border border-transparent
                  rounded-sm
                  text-green-300
                  hover:bg-gray-400
                "
                @click="sendTradeCommand(trade, 'hideout')"
              >
                <HomeIcon class="h-4 w-4" />
                <span class="tooltiptext">Hideout</span>
              </button>
            </div>

            <div>
              <button
                type="button"
                class="
                  tooltip
                  p-1
                  inline-flex
                  items-center
                  border border-transparent
                  rounded-sm
                  hover:bg-gray-400
                "
                :class="{
                  'text-green-300': trade.enteredarea,
                  'text-yellow-300': !trade.enteredarea,
                }"
                @click="sendTradeCommand(trade, 'trade')"
              >
                <SwitchHorizontalIcon class="h-4 w-4" />
                <span class="tooltiptext">Trade</span>
              </button>
            </div>

            <div v-if="trade.type == 'incoming'">
              <button
                type="button"
                class="
                  tooltip
                  p-1
                  inline-flex
                  items-center
                  border border-transparent
                  rounded-sm
                  text-red-500
                  hover:bg-gray-400
                "
                @click="sendTradeCommand(trade, 'kick')"
              >
                <UserRemoveIcon class="h-4 w-4" />
                <span class="tooltiptext">Kick</span>
              </button>
            </div>
            <div v-else>
              <button
                type="button"
                class="
                  tooltip
                  p-1
                  inline-flex
                  items-center
                  border border-transparent
                  rounded-sm
                  text-red-500
                  hover:bg-gray-400
                "
                @click="sendTradeCommand(trade, 'leave')"
              >
                <UserRemoveIcon class="h-4 w-4" />
                <span class="tooltiptext">Leave Party</span>
              </button>
            </div>
          </div>
        </tab-panel>
      </tab-panels>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useElectron } from '/@/use/electron';
import {
  XIcon,
  HomeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserAddIcon,
  UserRemoveIcon,
  SwitchHorizontalIcon,
} from '@heroicons/vue/solid';
import Tabs from '/@/components/Tabs.vue';
import Tab from '/@/components/Tab.vue';
import TabPanels from '/@/components/TabPanels.vue';
import TabPanel from '/@/components/TabPanel.vue';

import type { TradeCommand, TradeNotification } from '../../types';

export default defineComponent({
  name: 'TradeNotification',

  components: {
    Tabs,
    Tab,
    TabPanels,
    TabPanel,
    XIcon,
    HomeIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    UserAddIcon,
    UserRemoveIcon,
    SwitchHorizontalIcon,
  },

  setup() {
    const { closeWindow, ipcSend, ipcOn } = useElectron();

    const tab = ref('');
    const trades = ref([] as TradeNotification[]);

    function truncateName(str: string) {
      const maxlen = 12;
      if (str.length > maxlen) {
        return str.substring(0, maxlen) + '...';
      }
      return str;
    }

    // Update time
    function updateElapseTime() {
      const now = Date.now();
      trades.value.forEach((trade) => {
        let dif = now - trade.time;

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
    }

    // Handle trade events
    function handleTrade(trade: TradeNotification) {
      trades.value.push(trade);

      if (!tab.value) {
        tab.value = trade.name + trade.time.toString();
      }
    }

    function handleTradeEvent(event: string, name: string) {
      trades.value.some((trade) => {
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
    }

    ipcOn('trade', (trade: TradeNotification) => {
      handleTrade(trade);
    });

    ipcOn('new-whisper', (name: string) => {
      handleTradeEvent('new-whisper', name);
    });

    ipcOn('entered-area', (name: string) => {
      handleTradeEvent('entered-area', name);
    });

    ipcOn('left-area', (name: string) => {
      handleTradeEvent('left-area', name);
    });

    function closeTabOrWindow() {
      if (trades.value.length <= 1) {
        closeWindow();
      } else if (tab.value) {
        let idx = trades.value.findIndex((trade) => {
          return tab.value == trade.name + trade.time.toString();
        });

        trades.value.splice(idx, 1);

        if (idx < 0) idx = 0;
        if (idx > trades.value.length - 1) idx = trades.value.length - 1;

        const last = trades.value[idx];
        tab.value = last.name + last.time.toString();
      }
    }

    function highlightStash(trade: TradeNotification) {
      ipcSend('highlight-stash', trade.tab, trade.x, trade.y);
    }

    function stopHighlightStash() {
      ipcSend('stop-highlight-stash');
    }

    function sendTradeCommand(trade: TradeNotification, command: string) {
      ipcSend('trade-command', trade, command);
    }

    function sendCustomCommand(
      trade: TradeNotification,
      command: TradeCommand,
    ) {
      ipcSend('trade-custom-command', trade, command);

      if (command.close) {
        closeTabOrWindow();
      }
    }

    function getCurrencyImage(name: string) {
      return new URL(`/assets/currency/${name}.png`, import.meta.url).href;
    }

    setInterval(() => {
      updateElapseTime();
    }, 1000);

    return {
      tab,
      trades,
      truncateName,
      closeTabOrWindow,
      highlightStash,
      stopHighlightStash,
      sendTradeCommand,
      sendCustomCommand,
      getCurrencyImage,
    };
  },
});
</script>

<style>
html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #1f2937;
}

.titlebar-drag-region {
  top: 6px;
  left: 6px;
  display: block;
  position: absolute;
  width: calc(100% - 12px);
  height: calc(100% - 6px);
  z-index: -1;
  -webkit-app-region: drag;
}

.titlebar {
  display: flex;
  height: 30px;
  border: 1px solid gray;
  align-items: center;
  position: relative;
}

.title {
  margin-left: 10px;
}

.titlebar-btn {
  margin-left: auto;
  -webkit-app-region: no-drag;
}

.tooltip {
  position: relative;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #374151;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  position: absolute;
  left: -120px;
  top: -20px;

  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.smallTabPanel {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

.smallTabs {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}
</style>
