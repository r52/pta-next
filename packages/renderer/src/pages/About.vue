<template>
  <div class="bg-gray-800 h-full text-white">
    <div class="bg-yellow-900 titlebar flex justify-between items-center">
      <div class="text-3xl p-5">
        About PTA-Next
      </div>
      <div class="justify-self-end pr-2">
        <span class="inline-flex">
          <button
            type="button"
            class="p-2 inline-flex items-center border border-transparent rounded-full hover:bg-gray-400 focus:border-gray-700 active:bg-gray-700"
            @click="closeWindow"
          >
            <XIcon class="h-6 w-6" />
          </button>
        </span>
      </div>
    </div>

    <card>
      <card-section>
        <span class="text-2xl">PTA-Next v{{ appVer }}</span>
      </card-section>
      <card-section>
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500 focus:border-pink-700 active:bg-pink-700"
          @click="openBrowser('https://github.com/r52/pta-next')"
        >
          GitHub Source
        </button>
      </card-section>
    </card>

    <card>
      <card-section>
        <span class="text-2xl">Libraries Used</span>
      </card-section>
      <card-section>
        <electron-versions />
      </card-section>
    </card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { XIcon } from '@heroicons/vue/outline';
import Card from '../components/CardItem.vue';
import CardSection from '/@/components/CardSection.vue';
import ElectronVersions from '/@/components/ElectronVersions.vue';

const appVer = ref('');

const { appVersion, closeWindow, openBrowser } = window.electron;

appVersion().then((result) => {
  appVer.value = result;
});
</script>

<style>
body {
  background-color: #1f2937;
}

.titlebar {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}
</style>
