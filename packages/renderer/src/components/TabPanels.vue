<script lang="ts">
import { ref, provide, computed } from 'vue';

export default {
  name: 'TabPanels',
  props: {
    modelValue: [String, Number],
  },
  setup(props) {
    provide('tabsPanelState', {
      active: computed(() => props.modelValue),
      panels: ref([]),
    });
  },
};
</script>

<template>
  <div class="py-8 rounded-bl-md rounded-br-md overflow-hidden">
    <slot />
  </div>
</template>
