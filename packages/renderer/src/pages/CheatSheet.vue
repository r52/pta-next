<template>
  <div class="bg-gray-800 h-full text-white">
    <div class="bg-yellow-900 titlebar flex justify-between items-center">
      <div class="text-3xl p-5">
        {{ title }}
      </div>
      <div class="justify-self-end pr-2">
        <span class="inline-flex">
          <button
            type="button"
            class="
              p-2
              inline-flex
              items-center
              border border-transparent
              rounded-full
              hover:bg-gray-400
              focus:border-gray-700
              active:bg-gray-700
            "
            @click="closeWindow"
          >
            <XIcon class="h-6 w-6" />
          </button>
        </span>
      </div>
    </div>

    <div>
      <img :src="cheatSheetPath">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useElectron } from '/@/use/electron';
// @ts-expect-error: heroicons have no declaration
import { XIcon } from '@heroicons/vue/outline';

export default defineComponent({
  name: 'CheatSheet',
  components: {
    XIcon,
  },

  setup() {
    const { closeWindow, ipcOn } = useElectron();

    const title = ref('Cheat Sheet');
    const cheatSheetPath = ref('');

    function getCheatsheetImage(name: string) {
      return new URL(`/assets/cheatsheets/${name}.png`, import.meta.url).href;
    }

    ipcOn('cheatsheet-type', (type: string, path: string) => {
      title.value = type + ' Cheat Sheet';

      if (path.startsWith('http')) {
        cheatSheetPath.value = path;
      } else {
        cheatSheetPath.value = getCheatsheetImage(path);
      }
    });

    return {
      title,
      cheatSheetPath,
      closeWindow,
    };
  },
});
</script>

<style>
body {
  font-family: 'Fontin-SmallCaps';
}

.cap {
  text-transform: capitalize;
}
</style>
