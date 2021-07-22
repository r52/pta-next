<script lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, inject, watchEffect, getCurrentInstance, ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';

export default {
  name: 'Tab',
  props: {
    name: {
      type: String,
      required: true,
      default: '',
    },
  },
  setup(props) {
    const instance = getCurrentInstance() as ComponentInternalInstance;
    const { tabs, selectTab, active } = inject('tabsState', {
      active: ref(null),
      tabs: ref([] as ComponentInternalInstance[]),
      selectTab: (_: unknown) => {
        // default empty
      },
    });
    const index = computed(() =>
      tabs.value.findIndex(
        (target: ComponentInternalInstance) => target.uid === instance.uid,
      ),
    );
    const isActive = computed(
      () => index.value > -1 && props.name === active.value,
    );

    const activateTab = () => {
      selectTab(props.name);
    };

    watchEffect(() => {
      if (index.value === -1) {
        tabs.value.push(instance);
      }
    });

    return {
      activateTab,
      isActive,
    };
  },
};
</script>

<template>
  <div
    :class="
      isActive
        ? 'border-b-4 border-green-500 box-content'
        : 'border-b-2 border-white'
    "
    class="
      flex
      items-center
      px-6
      py-3
      rounded-tl-md rounded-tr-md
      overflow-hidden
      cursor-pointer
    "
    @click="activateTab"
  >
    <slot />
  </div>
</template>
