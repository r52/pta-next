<template>
  <div class="bg-gray-800 h-full text-white">
    <div class="bg-gray-500 titlebar flex justify-between items-center">
      <div class="text-3xl p-5">
        Trade History
      </div>
      <div class="justify-self-end pr-2">
        <span class="inline-flex">
          <button
            type="button"
            class="
              p-2
              inline-flex
              items-center
              border border-transparent
              rounded-full
              hover:bg-gray-400
              focus:border-gray-700
              active:bg-gray-700
            "
            @click="closeWindow"
          >
            <XIcon class="h-6 w-6" />
          </button>
        </span>
      </div>
    </div>

    <div>
      <data-table
        v-model="history"
        :columns="columns"
        row-key="time"
      >
        <template #utility-col>
          <th
            scope="col"
            class="relative px-6 py-3"
          >
            <span class="sr-only">Restore</span>
          </th>
          <th
            scope="col"
            class="
              relative
              px-6
              py-4
              whitespace-nowrap
              text-right text-sm
              font-medium
            "
          >
            <span class="sr-only">Remove</span>
          </th>
        </template>

        <template #body="props">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">
              {{ props.row.name }}
            </div>
          </td>

          <td class="px-6 py-4 whitespace-nowrap">
            <div class="tooltip text-sm text-gray-900">
              <div v-if="props.row.type == 'incoming'">
                <ArrowRightIcon class="h-4 w-4 text-green-400" />
                <span class="tooltiptext">Incoming</span>
              </div>
              <div v-else>
                <ArrowLeftIcon class="h-4 w-4 text-red-400" />
                <span class="tooltiptext">Outgoing</span>
              </div>
            </div>
          </td>

          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">
              {{ props.row.item }}
            </div>
          </td>

          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center text-sm text-gray-900 space-x-1">
              <div>{{ props.row.price }} {{ props.row.currency }}</div>
              <div>
                <img
                  :src="getCurrencyImage(props.row.currency)"
                  style="height: 30px; max-width: 30px"
                  class="py-1"
                >
              </div>
            </div>
          </td>

          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">
              {{ getElapsedTime(now, props.row.time) }} ago
            </div>
          </td>
        </template>

        <template #utility="props">
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <a
              href="#"
              class="text-indigo-600 hover:text-indigo-900"
              @click="historyCommand($event, 'restore-history', props.row)"
            >Restore</a>
          </td>

          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <a
              href="#"
              class="text-indigo-600 hover:text-indigo-900"
              @click="historyCommand($event, 'delete-history', props.row)"
            >Remove</a>
          </td>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRaw } from 'vue';
import { useElectron } from '/@/use/electron';
import { XIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/outline';
import DataTable from '/@/components/DataTable.vue';

import type { TradeMsg } from '../../types';

const columns = [
  {
    name: 'name',
    align: 'left',
    label: 'Player Name',
    field: 'name',
  },
  {
    name: 'type',
    align: 'left',
    label: 'Type',
    field: 'type',
  },
  {
    name: 'item',
    align: 'left',
    label: 'Item',
    field: 'item',
  },
  {
    name: 'price',
    align: 'left',
    label: 'Price',
    field: 'price',
  },
  {
    name: 'time',
    align: 'left',
    label: 'Time',
    field: 'time',
  },
];

export default defineComponent({
  name: 'TradeHistory',
  components: {
    XIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    DataTable,
  },

  setup() {
    const { closeWindow, ipcOn, ipcSend } = useElectron();

    function getCurrencyImage(name: string) {
      return new URL(`/assets/currency/${name}.png`, import.meta.url).href;
    }

    function getElapsedTime(t1: number, t2: number): string {
      let dif = t1 - t2;

      // convert to seconds
      dif = Math.floor(dif / 1000);

      if (dif < 60) {
        return dif.toString() + ' seconds';
      }

      // minutes
      if (dif < 3600) {
        return Math.floor(dif / 60).toString() + ' minutes';
      }

      if (dif < 86400) {
        return Math.floor(dif / 3600).toString() + ' hours';
      }

      return Math.floor(dif / 86400).toString() + ' days';
    }

    const history = ref([] as TradeMsg[]);
    const now = Date.now();

    function historyCommand(e: Event, command: string, trade: TradeMsg) {
      ipcSend(command, toRaw(trade));
      e.preventDefault();
    }

    ipcOn('trade-history', (nhist: TradeMsg[]) => {
      history.value = nhist;
    });

    return {
      columns,
      history,
      now,
      getCurrencyImage,
      historyCommand,
      closeWindow,
      getElapsedTime,
    };
  },
});
</script>

<style>
html {
  overflow-x: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #1f2937;
}

.titlebar {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}

.tooltip {
  position: relative;
  display: inline-block;
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
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
</style>
