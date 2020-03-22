<template>
  <q-input
    dense
    clearable
    type="number"
    v-model.number="filter[type]"
    v-on:input="filter.enabled = true"
    :disabled="disabled"
    @keypress="isNumber($event)"
    class="q-py-xs"
  />
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue';

export default Vue.extend({
  name: 'ModNumInput',

  props: {
    filter: Object,
    type: String,
    disabled: Boolean
  },

  methods: {
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
    }
  }
});
</script>
