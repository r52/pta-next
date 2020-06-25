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
import { defineComponent, PropType } from '@vue/composition-api';
import { isNumber } from '../functions/util';

export default defineComponent({
  name: 'ModNumInput',

  props: {
    filter: {
      type: Object as PropType<Filter>,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    disabled: Boolean,
    current: Number
  },

  setup(props) {
    let isint = false;

    if (!props.disabled) {
      let val = props.filter[props.type] as number | null;

      if (val == null) {
        if (props.filter.value != null) {
          if (props.filter.value.length > 1) {
            val = (props.filter.value[0] + props.filter.value[1]) / 2;
          } else {
            val = props.filter.value[0];
          }
        } else if (props.current) {
          val = Math.round(props.current);
        }
      }

      isint = Number.isInteger(val as number);
    }

    function scrollNum(evt: WheelEvent) {
      evt.preventDefault();

      if (!props.disabled) {
        const dir = evt.deltaY > 0 ? -1 : 1;

        let val = props.filter[props.type] as number | null;

        if (val == null) {
          if (props.filter.value != null) {
            if (props.filter.value.length > 1) {
              val = (props.filter.value[0] + props.filter.value[1]) / 2;
            } else {
              val = props.filter.value[0];
            }
          } else if (props.current) {
            val = Math.round(props.current);
          }
        }

        const step = isint ? 1 : 0.1;
        const change = step * dir;
        val = (val as number) + change;
        props.filter[props.type] = Math.round(val * 100) / 100;
        props.filter.enabled = true;
      }
    }

    return {
      scrollNum,
      isNumber
    };
  }
});
</script>
