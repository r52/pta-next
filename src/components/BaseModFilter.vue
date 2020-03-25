<template>
  <div class="row items-center">
    <div class="col-8">
      <q-item tag="label" v-ripple>
        <q-item-section avatar>
          <q-toggle dense v-model="options[type].enabled" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="magic--text">{{ label }}</q-item-label>
        </q-item-section>
      </q-item>
    </div>
    <div class="col">
      <mod-num-input type="min" :filter="options[type]" />
    </div>
    <div class="col text-center">
      <span>{{ current.toFixed(2) }}</span>
    </div>
    <div class="col">
      <mod-num-input type="max" :filter="options[type]" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ModNumInput from 'components/ModNumInput.vue';

export default Vue.extend({
  name: 'BaseModFilter',

  components: {
    ModNumInput
  },

  props: {
    label: String,
    options: Object,
    settings: Object,
    type: String,
    current: Number
  },

  created() {
    const range = this.settings.prefillrange / 100.0;
    const value = this.current;
    const diff = range * value;

    if (this.settings.prefillmin) {
      this.options[this.type]['min'] = value - diff;
    }

    if (this.settings.prefillmax) {
      this.options[this.type]['max'] = value + diff;
    }
  }
});
</script>

<style scoped>
.magic--text {
  color: #88f;
}
</style>
