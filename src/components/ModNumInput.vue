<template>
  <q-input
    dense
    clearable
    type="number"
    v-model.number="filter[type]"
    v-on:input="filter.enabled = true"
    :disabled="disabled"
    @keypress="isNumber($event)"
    @mousewheel="scrollNum($event)"
    class="q-py-xs"
  />
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue';

export default Vue.extend({
  name: 'ModNumInput',

  data() {
    let isint = false;

    if (!this.disabled) {
      let val = this.filter[this.type];

      if (val == null) {
        if (this.filter.value != null) {
          if (this.filter.value.length > 1) {
            val = (this.filter.value[0] + this.filter.value[1]) / 2;
          } else {
            val = this.filter.value[0];
          }
        } else {
          val = Math.round(this.current);
        }
      }

      isint = Number.isInteger(val);
    }

    return {
      isInt: isint,
    };
  },

  props: {
    filter: Object,
    type: String,
    disabled: Boolean,
    current: Number,
  },

  methods: {
    scrollNum(evt: WheelEvent) {
      evt.preventDefault();

      if (!this.disabled) {
        const dir = evt.deltaY > 0 ? -1 : 1;

        let val = this.filter[this.type];

        if (val == null) {
          if (this.filter.value != null) {
            if (this.filter.value.length > 1) {
              val = (this.filter.value[0] + this.filter.value[1]) / 2;
            } else {
              val = this.filter.value[0];
            }
          } else {
            val = Math.round(this.current);
          }
        }

        const step = this.isInt ? 1 : 0.1;
        const change = step * dir;
        val = val + change;
        this.filter[this.type] = Math.round(val * 100) / 100;
        this.filter.enabled = true;
      }
    },
    isNumber: function (evt: any) {
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
  },
});
</script>
