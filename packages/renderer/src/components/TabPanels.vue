<script lang="ts">
import { ref, provide, computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'TabPanels',
  props: {
    modelValue: {
      type: [String, Number],
      default: 0,
    },
  },
  setup(props) {
    provide('tabsPanelState', {
      active: computed(() => props.modelValue),
      panels: ref([]),
    });
  },
});
</script>

<template>
  <div class="py-8 rounded-bl-md rounded-br-md overflow-hidden">
    <slot />
  </div>
</template>
