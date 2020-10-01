<template>
  <div class="row items-center">
    <div class="col-8">
      <q-item tag="label" v-ripple>
        <q-item-section avatar>
          <q-toggle dense v-model="flt.enabled" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="magic--text">{{ flt.text }}</q-item-label>
          <q-item-label caption>{{ flt.type }}</q-item-label>
        </q-item-section>
      </q-item>
    </div>
    <template v-if="flt.option">
      <div class="col">
        <q-select
          v-model="flt.selected"
          :options="flt.option.options"
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
          :filter="flt"
          :disabled="flt.value.length < 1 || flt.value.length > 2"
          @update="update"
        />
      </div>
      <div class="col text-center vertical-middle">
        <span v-if="flt.value.length">{{ filterval }}</span>
        <span v-else>N/A</span>
      </div>
      <div class="col">
        <mod-num-input
          type="max"
          :filter="flt"
          :disabled="flt.value.length < 1 || flt.value.length > 2"
          @update="update"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  watch
} from '@vue/composition-api';
import ModNumInput from 'components/ModNumInput.vue';
import { Filter, PTASettings } from 'app/types/item';

export default defineComponent({
  name: 'ModFilter',

  components: {
    ModNumInput
  },

  props: {
    filter: {
      type: Object as PropType<Filter>,
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
    id: {
      type: String,
      required: true
    }
  },

  setup(props, ctx) {
    const flt = ref(props.filter);

    watch(flt, flt => {
      ctx.emit('update', props.type, props.id, flt.value);
    });

    function update(f: Filter) {
      flt.value = f;
    }

    const filterval = computed(() => {
      if (flt.value.value.length > 1) {
        return (flt.value.value[0] + flt.value.value[1]) / 2;
      }

      return flt.value.value[0];
    });

    if (flt.value.value.length) {
      const range = props.settings.prefillrange / 100.0;
      const diff = range * filterval.value;

      if (props.settings.prefillmin && !flt.value.min) {
        flt.value.min = filterval.value - diff;
      }

      if (props.settings.prefillmax && !props.filter.max) {
        flt.value.max = filterval.value + diff;
      }
    }

    if (
      (props.type == 'normal' && props.settings.prefillnormals) ||
      (props.type == 'pseudo' && props.settings.prefillpseudos)
    ) {
      flt.value.enabled = true;
    }

    return {
      flt,
      update,
      filterval
    };
  }
});
</script>

<style scoped>
.magic--text {
  color: #88f;
}
</style>
