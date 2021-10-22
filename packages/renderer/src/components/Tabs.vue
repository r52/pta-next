<script lang="ts">
import { provide, computed, ref, defineComponent } from 'vue';

export default defineComponent({
  name: 'Tabs',
  props: {
    modelValue: {
      type: [String, Number],
      default: 0,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const active = computed(() => props.modelValue);
    const tabs = ref([]);

    function selectTab(tab: string | number) {
      emit('update:modelValue', tab);
    }

    provide('tabsState', {
      active,
      tabs,
      selectTab,
    });
  },
});
</script>

<template>
  <div class="flex space-x-2">
    <slot />
  </div>
  <div class="bg-gray-300 -m-1 h-1" />
</template>
