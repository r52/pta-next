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
          v-if="itm.weapon && itm.weapon.pdps"
          label="Physical DPS"
          :options="opts"
          :settings="settings"
          type="usepdps"
          :current="getAvg(itm.weapon.mqpdps) * itm.weapon.aps"
          @update="updateBaseMod"
        />
        <base-mod-filter
          v-if="itm.weapon && itm.weapon.edps"
          label="Elemental DPS"
          :options="opts"
          :settings="settings"
          type="useedps"
          :current="getAvg(itm.weapon.edps) * itm.weapon.aps"
          @update="updateBaseMod"
        />
        <base-mod-filter
          v-if="itm.armour && itm.armour.ar"
          label="Armour"
          :options="opts"
          :settings="settings"
          type="usear"
          :current="itm.armour.mqar"
          @update="updateBaseMod"
        />
        <base-mod-filter
          v-if="itm.armour && itm.armour.ev"
          label="Evasion"
          :options="opts"
          :settings="settings"
          type="useev"
          :current="itm.armour.mqev"
          @update="updateBaseMod"
        />
        <base-mod-filter
          v-if="itm.armour && itm.armour.es"
          label="Energy Shield"
          :options="opts"
          :settings="settings"
          type="usees"
          :current="itm.armour.mqes"
          @update="updateBaseMod"
        />

        <q-separator v-if="itm.weapon || itm.armour" />

        <!-- mods -->
        <mod-filter
          v-for="filter in itm.filters"
          :key="filter.id"
          :id="filter.id"
          :filter="filter"
          :settings="settings"
          type="normal"
          @update="updateFilter"
        />
        <q-separator />
        <mod-filter
          v-for="filter in itm.pseudos"
          :key="filter.id"
          :id="filter.id"
          :filter="filter"
          :settings="settings"
          type="pseudo"
          @update="updateFilter"
        />

        <q-separator v-if="itm.pseudos" />

        <!-- misc option checkboxes -->
        <div class="row items-center">
          <div class="col-auto">
            <q-select
              dense
              options-dense
              stack-label
              v-model="opts.usecorrupted"
              :options="corrupts"
              label="Corrupted"
              style="width: 100px;"
            />
          </div>
          <q-space />
          <div class="col-auto">
            <q-toggle
              v-if="itm.sockets"
              v-model="opts.usesockets"
              :label="`Use Sockets (${itm.sockets.total})`"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="itm.sockets"
              v-model="opts.uselinks"
              :label="`Use Links (${itm.sockets.links})`"
            />
          </div>
        </div>
        <q-separator />
        <div class="row items-center justify-end">
          <div class="col-auto">
            <q-toggle label="iLvl (min):" v-model="opts.useilvl" />
          </div>

          <div class="col-auto">
            <q-input
              dense
              clearable
              type="number"
              v-model.number.lazy="itm.ilvl"
              @input="opts.useilvl = true"
              @keypress="isNumber($event)"
              class="q-pa-xs"
              style="width: 60px"
            />
          </div>

          <div class="col-auto">
            <q-toggle label="Use Item Base" v-model="opts.useitembase" />
          </div>
          <div class="col-auto" v-if="itm.influences && itm.influences.length">
            <q-toggle
              v-for="inf in itm.influences"
              v-model="opts.influences"
              :key="inf"
              :label="inf"
              :val="inf"
              color="purple"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="itm.synthesised"
              label="Synthesised"
              v-model="opts.usesynthesised"
              color="orange"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-if="itm.fractured"
              label="Fractured"
              v-model="opts.usefractured"
              color="amber"
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
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { isNumber } from '../functions/util';
import { ipcRenderer } from 'electron';
import BaseModFilter from 'components/BaseModFilter.vue';
import ModFilter from 'components/ModFilter.vue';

export default defineComponent({
  name: 'Mods',

  props: {
    item: {
      type: Object as PropType<Item>,
      required: true
    },
    options: {
      type: Object as PropType<ItemOptions>,
      required: true
    },
    settings: {
      type: Object as PropType<PTASettings>,
      required: true
    }
  },

  components: {
    BaseModFilter,
    ModFilter
  },

  setup(props) {
    const itm = ref(props.item);
    const opts = ref(props.options);

    function updateBaseMod(o: ItemOptions) {
      opts.value = o;
    }

    function updateFilter(type: string, id: string, f: Filter) {
      if (type == 'normal' && itm.value.filters) {
        itm.value.filters[id] = f;
      } else if (type == 'pseudo' && itm.value.pseudos) {
        itm.value.pseudos[id] = f;
      }
    }

    const corrupts = ['Any', 'Yes', 'No'];

    function getAvg(range: NumericRange) {
      return (range.min + range.max) / 2;
    }

    function search(openbrowser: boolean) {
      ipcRenderer.send('search', itm.value, opts.value, openbrowser);
    }

    return {
      itm,
      opts,
      updateBaseMod,
      updateFilter,
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
