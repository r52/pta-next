<template>
  <div class="row items-center">
    <div class="col-8">
      <q-item tag="label" v-ripple>
        <q-item-section avatar>
          <q-toggle dense v-model="opts[type].enabled" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="magic--text">{{ label }}</q-item-label>
        </q-item-section>
      </q-item>
    </div>
    <div class="col">
      <mod-num-input
        type="min"
        :filter="opts[type]"
        :current="current"
        @update="update"
      />
    </div>
    <div class="col text-center">
      <span
        >{{ current.toFixed(2) }}
        <q-tooltip>at max quality</q-tooltip>
      </span>
    </div>
    <div class="col">
      <mod-num-input
        type="max"
        :filter="opts[type]"
        :current="current"
        @update="update"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import ModNumInput from 'components/ModNumInput.vue';
import { ItemOptions, PTASettings, MinMaxToggle } from 'app/types/item';

export default defineComponent({
  name: 'BaseModFilter',

  components: {
    ModNumInput
  },

  props: {
    label: String,
    options: {
      type: Object as PropType<ItemOptions>,
      required: true
    },
    settings: {
      type: Object as PropType<PTASettings>,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    current: {
      type: Number,
      required: true
    }
  },

  setup(props, ctx) {
    const opts = ref(props.options);

    watch(opts, opts => {
      ctx.emit('update', opts.value);
    });

    function update(flt: MinMaxToggle) {
      opts.value[props.type] = flt;
    }

    const range = props.settings.prefillrange / 100.0;
    const value = props.current;
    const diff = range * value;

    const tog = opts.value[props.type] as MinMaxToggle;

    if (props.settings.prefillmin && !tog.min) {
      tog.min = Math.round(value - diff);
    }

    if (props.settings.prefillmax && !tog.max) {
      tog.max = Math.round(value + diff);
    }

    return {
      opts,
      update
    };
  }
});
</script>

<style scoped>
.magic--text {
  color: #88f;
}
</style>
