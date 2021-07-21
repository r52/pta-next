<script lang="ts">
import { provide, computed, ref } from 'vue';

export default {
  name: 'Tabs',
  props: {
    modelValue: {
      type: [String, Number],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const active = computed(() => props.modelValue);
    const tabs = ref([]);

    function selectTab(tab: any) {
      emit('update:modelValue', tab);
    }

    provide('tabsState', {
      active,
      tabs,
      selectTab,
    });
  },
};
</script>

<template>
  <div class="flex space-x-2">
    <slot />
  </div>
  <div class="bg-gray-300 -m-1 h-1" />
</template>
