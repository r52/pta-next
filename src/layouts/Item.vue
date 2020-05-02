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
import Vue from 'vue';
import { ipcRenderer } from 'electron';

export default Vue.extend({
  name: 'Item',

  data() {
    return {
      tab: null,
      item: null as Item | null,
      prediction: null,
      results: null,
      settings: null,
      options: null
    };
  },

  computed: {
    itemClass(): string {
      let cls = '';

      const item = this.item as any;

      if (item) {
        cls = item.rarity as string;

        if (
          item.category == 'gem' ||
          item.category == 'prophecy' ||
          item.category == 'card' ||
          item.category == 'currency'
        ) {
          cls = item.category as string;
        }
      }

      return cls;
    }
  },

  methods: {
    closeApp() {
      const win = this.$q.electron.remote.getCurrentWindow();

      if (win) {
        win.close();
      }
    },
    handleItem(
      event: Electron.IpcRendererEvent,
      item: Item,
      settings: any,
      options: any,
      type: number
    ) {
      this.item = item;
      this.settings = settings;
      this.options = options;

      // If type == ADVANCED and has mods, switch tab
      if (
        item &&
        item.filters &&
        Object.keys(item.filters).length > 0 &&
        item.category != 'map' &&
        type == 1
      ) {
        this.$router.replace({
          name: 'mods',
          params: {
            item: item as any,
            settings: settings,
            options: options
          }
        });
      }
    },
    handleResults(event: Electron.IpcRendererEvent, results: any) {
      this.results = results;

      if (results['forcetab']) {
        this.$router.replace({
          name: 'results',
          params: {
            item: this.item as any,
            results: results
          }
        });
      }
    },
    handlePrediction(event: Electron.IpcRendererEvent, prediction: any) {
      this.prediction = prediction;

      if (this.tab == null) {
        this.$router.replace({
          name: 'prediction',
          params: {
            prediction: prediction
          }
        });
      }
    }
  },

  created() {
    ipcRenderer.on('item', (event, item, settings, options, type) => {
      this.handleItem(event, item, settings, options, type);

      // If type == SIMPLE, queue a simple search
      if (type == 0 || !('filters' in item)) {
        ipcRenderer.send('search-defaults', item);
      }
    });

    ipcRenderer.on('results', (event, results) => {
      this.handleResults(event, results);
    });

    ipcRenderer.on('prediction', (event, prediction) => {
      this.handlePrediction(event, prediction);
    });

    ipcRenderer.on('error', (event, error) => {
      this.$q.notify({
        color: 'red',
        message: error,
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
        timeout: 5000
      });
    });

    ipcRenderer.on('forcetab', (event, tab) => {
      if (tab == 'mods') {
        this.$router.replace({
          name: 'mods',
          params: {
            item: this.item as any,
            settings: this.settings as any,
            options: this.options as any
          }
        });
      }
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('item');
    ipcRenderer.removeAllListeners('results');
    ipcRenderer.removeAllListeners('prediction');
    ipcRenderer.removeAllListeners('error');
    ipcRenderer.removeAllListeners('forcetab');
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
