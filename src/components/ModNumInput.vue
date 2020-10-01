<template>
  <q-input
    dense
    clearable
    type="number"
    v-model.number="flt[type]"
    v-on:input="flt.enabled = true"
    :disabled="disabled"
    @keypress="isNumber($event)"
    @mousewheel="scrollNum($event)"
    class="q-py-xs"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref } from '@vue/composition-api';
import { isNumber } from '../functions/util';
import { Filter } from 'app/types/item';

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

  setup(props, ctx) {
    const flt = ref(props.filter);

    watch(flt, flt => {
      ctx.emit('update', flt.value);
    });

    let isint = false;

    if (!props.disabled) {
      let val = flt.value[props.type] as number | null;

      if (val == null) {
        if (flt.value.value != null) {
          if (flt.value.value.length > 1) {
            val = (flt.value.value[0] + flt.value.value[1]) / 2;
          } else {
            val = flt.value.value[0];
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

        let val = flt.value[props.type] as number | null;

        if (val == null) {
          if (flt.value.value != null) {
            if (flt.value.value.length > 1) {
              val = (flt.value.value[0] + flt.value.value[1]) / 2;
            } else {
              val = flt.value.value[0];
            }
          } else if (props.current) {
            val = Math.round(props.current);
          }
        }

        const step = isint ? 1 : 0.1;
        const change = step * dir;
        val = (val as number) + change;
        flt.value[props.type] = Math.round(val * 100) / 100;
        flt.value.enabled = true;
      }
    }

    return {
      flt,
      scrollNum,
      isNumber
    };
  }
});
</script>
