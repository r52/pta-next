<template>
  <div class="p-2">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CardSection',
});
</script>
