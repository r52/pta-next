<template>
  <q-layout view="hHh Lpr fFf" v-if="item">
    <q-header elevated>
      <q-toolbar class="q-electron-drag bg-grey-10">
        <q-toolbar-title :class="[itemClass]"
          >{{ item.name }} {{ item.type }}</q-toolbar-title
        >
        <q-btn flat round dense icon="close" accesskey="c" @click="closeApp" />
      </q-toolbar>
      <q-toolbar class="bg-grey-10" inset>
        <q-chip
          outline
          square
          color="green"
          text-color="white"
          :label="settings.league"
        />
        <q-chip
          outline
          square
          color="red"
          text-color="white"
          label="Unidentified"
          v-if="item.unidentified"
        />
        <q-chip
          outline
          square
          color="red"
          text-color="white"
          label="Corrupted"
          v-if="item.corrupted"
        />
        <q-chip
          outline
          square
          color="purple"
          text-color="white"
          v-for="inf in item.influences"
          :key="inf"
          :label="inf"
        />
      </q-toolbar>

      <q-tabs dense class="bg-brown-8">
        <q-route-tab
          v-if="results"
          icon="attach_money"
          :to="{
            name: 'results',
            params: {
              item: item,
              results: results
            }
          }"
          replace
          label="Results"
        />
        <q-route-tab
          v-if="prediction"
          icon="cached"
          :to="{
            name: 'prediction',
            params: {
              prediction: prediction
            }
          }"
          replace
          label="poeprices.info"
        />
        <q-route-tab
          v-if="item.filters"
          icon="filter_list"
          :to="{
            name: 'mods',
            params: {
              item: item,
              settings: settings,
              options: options
            }
          }"
          replace
          label="Mods"
        />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  defineComponent,
  ref,
  onBeforeUnmount,
  computed
} from '@vue/composition-api';
import { useElectronUtil } from '../functions/context';
import { ipcRenderer } from 'electron';

export default defineComponent({
  name: 'Item',

  setup(props, ctx) {
    const tab = ref(null as string | null);
    const item = ref(null as Item | null);
    const prediction = ref(null as PoEPricesPrediction | null);
    const results = ref(null as PoETradeResults | null);
    const settings = ref(null as PTASettings | null);
    const options = ref(null as ItemOptions | null);

    const itemClass = computed(() => {
      let cls = '';

      if (item.value) {
        cls = item.value.rarity;

        if (
          item.value.category == 'gem' ||
          item.value.category == 'prophecy' ||
          item.value.category == 'card' ||
          item.value.category == 'currency'
        ) {
          cls = item.value.category;
        }
      }

      return cls;
    });

    const { closeApp } = useElectronUtil(ctx);

    function handleItem(
      event: Electron.IpcRendererEvent,
      itm: Item,
      set: PTASettings,
      opts: ItemOptions,
      type: number
    ) {
      item.value = itm;
      settings.value = set;
      options.value = opts;

      // If type == ADVANCED and has mods, switch tab
      if (
        item.value &&
        item.value.filters &&
        Object.keys(item.value.filters).length > 0 &&
        item.value.category != 'map' &&
        type == 1
      ) {
        ctx.root.$router.replace({
          name: 'mods',
          params: {
            item: item.value as any,
            settings: settings.value as any,
            options: options.value as any
          }
        });
      }
    }

    ipcRenderer.on(
      'item',
      (event, itm: Item, set: PTASettings, opts: ItemOptions, type: number) => {
        handleItem(event, itm, set, opts, type);

        // If type == SIMPLE, or item type only supports a simple type, queue a simple search
        if (
          type == 0 ||
          itm.category == 'map' ||
          itm.category == 'card' ||
          itm.category == 'prophecy' ||
          !('filters' in itm)
        ) {
          ipcRenderer.send('search-defaults', itm);
        }
      }
    );

    function handleResults(
      event: Electron.IpcRendererEvent,
      res: PoETradeResults
    ) {
      results.value = res;

      if (results.value.forcetab) {
        ctx.root.$router.replace({
          name: 'results',
          params: {
            item: item.value as any,
            results: results.value as any
          }
        });
      }
    }

    ipcRenderer.on('results', (event, res) => {
      handleResults(event, res);
    });

    function handlePrediction(event: Electron.IpcRendererEvent, pred: any) {
      prediction.value = pred;

      if (tab.value == null) {
        ctx.root.$router.replace({
          name: 'prediction',
          params: {
            prediction: prediction.value as any
          }
        });
      }
    }

    ipcRenderer.on('prediction', (event, pred) => {
      handlePrediction(event, pred);
    });

    ipcRenderer.on('error', (event, error) => {
      ctx.root.$q.notify({
        color: 'red',
        message: error,
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
        timeout: 5000
      });
    });

    ipcRenderer.on('forcetab', (event, tb) => {
      if (tb == 'mods') {
        ctx.root.$router.replace({
          name: 'mods',
          params: {
            item: item.value as any,
            settings: settings.value as any,
            options: options.value as any
          }
        });
      }
    });

    onBeforeUnmount(() => {
      ipcRenderer.removeAllListeners('item');
      ipcRenderer.removeAllListeners('results');
      ipcRenderer.removeAllListeners('prediction');
      ipcRenderer.removeAllListeners('error');
      ipcRenderer.removeAllListeners('forcetab');
    });

    return {
      tab,
      item,
      prediction,
      results,
      settings,
      options,
      itemClass,
      closeApp
    };
  }
});
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../fonts/Fontin-SmallCaps.woff) format('woff');
}

::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #888;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

html {
  overflow-y: auto !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #121212e6 !important;
}

.corruptedItem,
.unidentifiedItem {
  color: #d20000;
}

.influenceItem {
  color: #8e44ad;
}

.Unique {
  color: #af6025;
}

.Magic {
  color: #88f;
}

.Normal {
  color: #c8c8c8;
}

.Rare {
  color: rgb(255, 255, 119);
}

.prophecy {
  color: #b54bff;
}

.gem {
  color: #1ba29b;
}

.card {
  color: #eee;
}
</style>
