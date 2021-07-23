<template>
  <div
    class="
      m-4
      p-4
      border border-transparent
      rounded-lg
      shadow-md
      bg-gray-600
      divide-y divide-indigo-300
    "
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'Card',
});
</script>
