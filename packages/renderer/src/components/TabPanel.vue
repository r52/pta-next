<script lang="ts">
import { inject, getCurrentInstance, watchEffect, computed, ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';

export default {
  name: 'TabPanel',
  setup() {
    const instance = getCurrentInstance() as ComponentInternalInstance;
    const { panels, active } = inject('tabsPanelState', {
      panels: ref([] as ComponentInternalInstance[]),
      active: ref(null),
    });
    const index = computed(() =>
      panels.value.findIndex((target) => target.uid === instance.uid),
    );
    const isActive = computed(() => active.value === index.value);

    watchEffect(() => {
      if (index.value === -1) {
        panels.value.push(instance);
      }
    });

    return {
      isActive,
    };
  },
};
</script>

<template>
  <div v-if="isActive">
    <slot />
  </div>
</template>
