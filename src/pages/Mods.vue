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
          :current="getAvg(item.weapon.mqpdps) * item.weapon.aps"
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
          :current="item.armour.mqar"
        />
        <base-mod-filter
          v-if="item.armour && item.armour.ev"
          label="Evasion"
          :options="options"
          :settings="settings"
          type="useev"
          :current="item.armour.mqev"
        />
        <base-mod-filter
          v-if="item.armour && item.armour.es"
          label="Energy Shield"
          :options="options"
          :settings="settings"
          type="usees"
          :current="item.armour.mqes"
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
              style="width: 100px;"
            />
          </div>
          <q-space />
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
        </div>
        <q-separator />
        <div class="row items-center justify-end">
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
              class="q-pa-xs"
              style="width: 60px"
            />
          </div>

          <div class="col-auto">
            <q-toggle label="Use Item Base" v-model="options.useitembase" />
          </div>
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
import { defineComponent, PropType } from '@vue/composition-api';
import { isNumber } from '../functions/util';
import { ipcRenderer } from 'electron';
import BaseModFilter from 'components/BaseModFilter.vue';
import ModFilter from 'components/ModFilter.vue';

export default defineComponent({
  name: 'Mods',

  props: {
    item: {
      type: (Object as unknown) as PropType<Item>,
      required: true
    },
    options: {
      type: (Object as unknown) as PropType<ItemOptions>,
      required: true
    },
    settings: {
      type: (Object as unknown) as PropType<PTASettings>,
      required: true
    }
  },

  components: {
    BaseModFilter,
    ModFilter
  },

  setup(props) {
    const corrupts = ['Any', 'Yes', 'No'];

    function getAvg(range: NumericRange) {
      return (range.min + range.max) / 2;
    }

    function search(openbrowser: boolean) {
      ipcRenderer.send('search', props.item, props.options, openbrowser);
    }

    return {
      corrupts,
      getAvg,
      isNumber,
      search
    };
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
