<template>
  <div class="row items-center">
    <div class="col-8">
      <q-toggle
        dense
        class="magic--text"
        v-model.lazy="filter.enabled"
        :label="`(${filter.type}) ${filter.text}`"
      />
    </div>
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
  </div>
</template>

<script lang="ts">
import ModNumInput from 'components/ModNumInput.vue';

export default {
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
    filterval() {
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
};
</script>

<style scoped>
.magic--text {
  color: #88f;
}
</style>
