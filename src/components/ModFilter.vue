<template>
  <div class="row items-center">
    <div class="col-8">
      <q-item tag="label" v-ripple>
        <q-item-section avatar>
          <q-toggle dense v-model="filter.enabled" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="magic--text">{{ filter.text }}</q-item-label>
          <q-item-label caption>{{ filter.type }}</q-item-label>
        </q-item-section>
      </q-item>
    </div>
    <template v-if="filter.option">
      <div class="col">
        <q-select
          v-model="filter.selected"
          :options="filter.option.options"
          option-value="id"
          option-label="text"
          emit-value
          map-options
        />
      </div>
    </template>
    <template v-else>
      <div class="col">
        <mod-num-input
          type="min"
          :filter="filter"
          :disabled="filter.value.length < 1 || filter.value.length > 2"
        />
      </div>
      <div class="col text-center vertical-middle">
        <span v-if="filter.value.length">{{ filterval }}</span>
        <span v-else>N/A</span>
      </div>
      <div class="col">
        <mod-num-input
          type="max"
          :filter="filter"
          :disabled="filter.value.length < 1 || filter.value.length > 2"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ModNumInput from 'components/ModNumInput.vue';

export default Vue.extend({
  name: 'ModFilter',

  components: {
    ModNumInput
  },

  props: {
    filter: Object,
    settings: Object,
    type: String
  },

  computed: {
    filterval(): number {
      if (this.filter.value.length > 1) {
        return (this.filter.value[0] + this.filter.value[1]) / 2;
      }

      return this.filter.value[0];
    }
  },

  created() {
    if (this.filter.value.length) {
      const range = this.settings.prefillrange / 100.0;
      const value = this.filterval;
      const diff = range * value;

      if (this.settings.prefillmin) {
        this.filter['min'] = value - diff;
      }

      if (this.settings.prefillmax) {
        this.filter['max'] = value + diff;
      }
    }

    if (
      (this.type == 'normal' && this.settings.prefillnormals) ||
      (this.type == 'pseudo' && this.settings.prefillpseudos)
    ) {
      this.filter.enabled = true;
    }
  }
});
</script>

<style scoped>
.magic--text {
  color: #88f;
}
</style>
