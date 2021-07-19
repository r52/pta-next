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
            class="p-2 inline-flex items-center border rounded-full"
            @click="closeWindow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <card>
      <card-section>
        <span class="text-2xl">PTA-Next {{ appVer }}</span>
      </card-section>
      <card-section>
        <button
          type="button"
          class="
            inline-flex
            items-center
            px-4
            py-2
            border border-transparent
            text-base
            leading-6
            font-medium
            rounded-md
            text-white
            bg-pink-600
            hover:bg-pink-500
            focus:border-pink-700
            active:bg-pink-700
          "
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
        <ul aria-labelledby="versions">
          <li
            v-for="(version, lib) in versions"
            :key="lib"
          >
            <strong>{{ lib }}</strong>: v{{ version }}
          </li>
        </ul>
      </card-section>
    </card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Card from '/@/components/Card.vue';
import CardSection from '/@/components/CardSection.vue';
import { useElectron } from '/@/use/electron';

export default defineComponent({
  name: 'App',
  components: {
    Card,
    CardSection,
  },
  setup() {
    const appVer = ref('');

    const { versions, appVersion, closeWindow, openBrowser } = useElectron();

    appVersion().then((result) => {
      appVer.value = result;
    });

    // It makes no sense to make "versions" reactive
    return { versions, appVer, closeWindow, openBrowser };
  },
});
</script>

<style scoped>
.titlebar {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}
</style>
