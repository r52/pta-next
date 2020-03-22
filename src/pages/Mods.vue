<template>
  <q-page padding>
    <q-form>
      <div class="q-pa-xs">
        <div class="row">
          <div class="col-8">
            Mods
          </div>
          <div class="col">
            Min
          </div>
          <div class="col">
            Curr
          </div>
          <div class="col">
            Max
          </div>
        </div>

        <q-separator />

        <!-- weapon/armour -->
        <base-mod-filter
          v-if="item.weapon && item.weapon.pdps"
          label="Physical DPS"
          :options="options"
          :settings="settings"
          type="usepdps"
          :current="getAvg(item.weapon.pdps) * item.weapon.aps"
        />
        <base-mod-filter
          v-if="item.weapon && item.weapon.edps"
          label="Elemental DPS"
          :options="options"
          :settings="settings"
          type="useedps"
          :current="getAvg(item.weapon.edps) * item.weapon.aps"
        />
        <base-mod-filter
          v-if="item.armour && item.armour.ar"
          label="Armour"
          :options="options"
          :settings="settings"
          type="usear"
          :current="item.armour.ar"
        />
        <base-mod-filter
          v-if="item.armour && item.armour.ev"
          label="Evasion"
          :options="options"
          :settings="settings"
          type="useev"
          :current="item.armour.ev"
        />
        <base-mod-filter
          v-if="item.armour && item.armour.es"
          label="Energy Shield"
          :options="options"
          :settings="settings"
          type="usees"
          :current="item.armour.es"
        />

        <q-separator v-if="item.weapon || item.armour" />

        <!-- mods -->
        <mod-filter
          v-for="filter in item.filters"
          :key="filter.id"
          :filter="filter"
          :settings="settings"
          type="normal"
        />
        <q-separator />
        <mod-filter
          v-for="filter in item.pseudos"
          :key="filter.id"
          :filter="filter"
          :settings="settings"
          type="pseudo"
        />

        <q-separator v-if="item.pseudos" />

        <!-- misc option checkboxes -->
        <div class="row items-center">
          <div class="col-auto">
            <q-select
              dense
              options-dense
              stack-label
              v-model="options.usecorrupted"
              :options="corrupts"
              label="Corrupted"
            >
              <q-tooltip>Corrupted</q-tooltip>
            </q-select>
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="item.sockets"
              v-model="options.usesockets"
              :label="`Use Sockets (${item.sockets.total})`"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="item.sockets"
              v-model="options.uselinks"
              :label="`Use Links (${item.sockets.links})`"
            />
          </div>
          <div class="col-auto">
            <q-toggle label="iLvl (min):" v-model="options.useilvl" />
          </div>

          <div class="col-auto">
            <q-input
              dense
              clearable
              type="number"
              v-model.number.lazy="item.ilvl"
              @input="options.useilvl = true"
              @keypress="isNumber($event)"
              class="q-py-xs"
              style="width: 60px"
            />
          </div>

          <div class="col-auto">
            <q-toggle label="Use Item Base" v-model="options.useitembase" />
          </div>
        </div>
        <q-separator />
        <div class="row items-center justify-end">
          <div
            class="col-auto"
            v-if="item.influences && item.influences.length"
          >
            <q-toggle
              v-for="inf in item.influences"
              v-model="options.influences"
              :key="inf"
              :label="inf"
              :val="inf"
              color="purple"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="item.misc && item.misc.synthesis"
              label="Synthesis"
              v-model="options.usesynthesisbase"
              color="orange"
            />
          </div>
        </div>

        <q-separator />

        <div class="row items-center justify-end q-py-xs">
          <div class="col-auto">
            <q-btn
              color="purple"
              accesskey="e"
              icon="open_in_new"
              @click="search(true)"
            >
              Op<u>e</u>n on pathofexile.com
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              accesskey="s"
              icon="search"
              @click="search(false)"
              ><u>S</u>earch</q-btn
            >
          </div>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue';
import { ipcRenderer } from 'electron';
import BaseModFilter from 'components/BaseModFilter.vue';
import ModFilter from 'components/ModFilter.vue';

export default Vue.extend({
  name: 'Mods',

  props: {
    item: Object,
    options: Object,
    settings: Object
  },

  components: {
    BaseModFilter,
    ModFilter
  },

  data() {
    return {
      corrupts: ['Any', 'Yes', 'No']
    };
  },

  methods: {
    getAvg: (prop: any) => {
      return (prop.min + prop.max) / 2;
    },
    isNumber: function(evt: any) {
      const charCode = evt.which ? evt.which : evt.keyCode;
      if (
        charCode > 31 &&
        (charCode < 48 || charCode > 57) &&
        charCode !== 46 &&
        charCode !== 45
      ) {
        evt.preventDefault();
      } else {
        return true;
      }
    },
    search(openbrowser: boolean) {
      ipcRenderer.send('search', this.item, this.options, openbrowser);
    }
  }
});
</script>

<style>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
