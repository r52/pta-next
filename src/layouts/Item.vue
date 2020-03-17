<template>
  <q-layout view="hHh Lpr fFf" v-if="item">
    <q-header elevated>
      <q-toolbar class="q-electron-drag bg-grey-10">
        <q-toolbar-title :class="[itemClass]"
          >{{ this.item.name }} {{ this.item.type }}</q-toolbar-title
        >
      </q-toolbar>
      <q-toolbar
        class="bg-grey-10"
        v-if="item.unidentified || item.corrupted || item.influences"
        inset
      >
        <q-breadcrumbs active-color="white">
          <q-breadcrumbs-el
            label="Unidentified"
            class="unidentifiedItem"
            v-if="item.unidentified"
          />
          <q-breadcrumbs-el
            label="Corrupted"
            class="corruptedItem"
            v-if="item.corrupted"
          />
          <q-breadcrumbs-el
            class="influenceItem"
            v-if="item.influences"
            v-for="inf in item.influences"
            :label="inf"
            :key="inf"
          />
        </q-breadcrumbs>
      </q-toolbar>

      <q-tabs dense class="bg-brown-8">
        <q-route-tab
          v-if="results"
          icon="attach_money"
          to="/your/route"
          replace
          label="Results"
        />
        <q-route-tab
          v-if="prediction"
          icon="cached"
          to="/some/other/route"
          replace
          label="poeprices.info"
        />
        <q-route-tab
          v-if="item.filters"
          icon="filter_list"
          :to="{
            name: 'mods',
            params: {
              item: this.item,
              settings: this.settings,
              options: this.options
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
import { ipcRenderer } from 'electron';

export default {
  name: 'Item',

  data() {
    return {
      tab: null,
      item: null,
      prediction: null,
      results: null,
      settings: null,
      options: null
    };
  },

  computed: {
    itemClass() {
      let cls = this.item.rarity;

      if (
        this.item.category == 'gem' ||
        this.item.category == 'prophecy' ||
        this.item.category == 'card' ||
        this.item.category == 'currency'
      ) {
        cls = this.item.category;
      }

      return cls;
    }
  },

  created() {
    ipcRenderer.on('item', (event, item, settings, options) => {
      console.log(item);
      this.item = item;
      this.settings = settings;
      this.options = options;

      if (item) {
        this.$router.replace({
          name: 'mods',
          params: {
            item: item,
            settings: settings,
            options: options
          }
        });
      }
    });
  }
};
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../statics/Fontin-SmallCaps.ttf) format('truetype');
}

html {
  overflow-y: auto !important;
}

body {
  font-family: 'Fontin-SmallCaps';
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
