<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar dense class="q-electron-drag bg-grey-8">
        <q-toolbar-title>
          Trade History
        </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="close" @click="closeApp" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <q-table
          :data="history"
          :columns="columns"
          row-key="time"
          no-data-label="No trade history"
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-btn
                  dense
                  icon="close"
                  size="sm"
                  @click="historyCommand('delete-history', props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  icon="restore"
                  size="sm"
                  @click="historyCommand('restore-history', props.row)"
                >
                  <q-tooltip>Restore</q-tooltip>
                </q-btn>
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="type" :props="props">
                <q-icon
                  :name="
                    props.row.type == 'incoming'
                      ? `arrow_back`
                      : `arrow_forward`
                  "
                  :color="props.row.type == 'incoming' ? `green` : `red`"
                >
                  <q-tooltip>{{ props.row.type }}</q-tooltip>
                </q-icon>
              </q-td>
              <q-td key="item" :props="props">
                {{ props.row.item }}
              </q-td>
              <q-td key="price" :props="props">
                <div class="row items-center">
                  <div class="col-auto">
                    {{ props.row.price }} {{ props.row.currency }}
                  </div>
                  <div class="col-auto">
                    <img
                      :src="`images/${props.row.currency}.png`"
                      style="height: 25px; max-width: 25px;"
                      class="q-pt-xs"
                    />
                  </div>
                </div>
              </q-td>
              <q-td key="time" :props="props">
                {{ getElapsedTime(now, props.row.time) }} ago
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref, onBeforeUnmount } from '@vue/composition-api';
import { getElapsedTime } from '../functions/util';
import { useElectronUtil } from '../functions/context';
import { ipcRenderer } from 'electron';
import log from 'electron-log';

Object.assign(console, log.functions);

const columns = [
  {
    name: 'name',
    align: 'left',
    label: 'Player Name',
    field: 'name'
  },
  {
    name: 'type',
    align: 'left',
    label: 'Type',
    field: 'type'
  },
  {
    name: 'item',
    align: 'left',
    label: 'Item',
    field: 'item'
  },
  {
    name: 'price',
    align: 'left',
    label: 'Price',
    field: 'price'
  },
  {
    name: 'time',
    align: 'left',
    label: 'Time',
    field: 'time'
  }
];

export default defineComponent({
  name: 'TradeHistory',

  setup(props, ctx) {
    const history = ref([] as TradeMsg[]);
    const now = Date.now();

    function historyCommand(command: string, trade: TradeMsg) {
      ipcRenderer.send(command, trade);
    }

    const { closeApp } = useElectronUtil(ctx);

    ipcRenderer.on('trade-history', (event, nhist: TradeMsg[]) => {
      history.value = nhist;
    });

    onBeforeUnmount(() => {
      ipcRenderer.removeAllListeners('trade-history');
    });

    return {
      columns,
      history,
      now,
      historyCommand,
      closeApp,
      getElapsedTime
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
</style>
