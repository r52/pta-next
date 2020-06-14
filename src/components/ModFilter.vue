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
import { defineComponent, PropType, computed } from '@vue/composition-api';
import ModNumInput from 'components/ModNumInput.vue';

export default defineComponent({
  name: 'ModFilter',

  components: {
    ModNumInput
  },

  props: {
    filter: {
      type: (Object as unknown) as PropType<Filter>,
      required: true
    },
    settings: {
      type: (Object as unknown) as PropType<PTASettings>,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const filterval = computed(() => {
      if (props.filter.value.length > 1) {
        return (props.filter.value[0] + props.filter.value[1]) / 2;
      }

      return props.filter.value[0];
    });

    if (props.filter.value.length) {
      const range = props.settings.prefillrange / 100.0;
      const diff = range * filterval.value;

      if (props.settings.prefillmin) {
        props.filter.min = filterval.value - diff;
      }

      if (props.settings.prefillmax) {
        props.filter.max = filterval.value + diff;
      }
    }

    if (
      (props.type == 'normal' && props.settings.prefillnormals) ||
      (props.type == 'pseudo' && props.settings.prefillpseudos)
    ) {
      props.filter.enabled = true;
    }

    return {
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
