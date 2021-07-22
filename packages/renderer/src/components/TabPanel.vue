<script lang="ts">
import { inject, getCurrentInstance, watchEffect, computed, ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';

export default {
  name: 'TabPanel',
  props: {
    name: {
      type: String,
      required: true,
      default: '',
    },
  },
  setup(props) {
    const instance = getCurrentInstance() as ComponentInternalInstance;
    const { panels, active } = inject('tabsPanelState', {
      panels: ref([] as ComponentInternalInstance[]),
      active: ref(null),
    });
    const index = computed(() =>
      panels.value.findIndex((target) => target.uid === instance.uid),
    );
    const isActive = computed(
      () => index.value > -1 && props.name === active.value,
    );

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
