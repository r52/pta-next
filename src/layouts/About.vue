<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="q-electron-drag bg-grey-10">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-avatar>
          <img src="icon.png" />
        </q-avatar>

        <q-toolbar-title>
          About PTA-Next
        </q-toolbar-title>

        <q-btn flat round dense icon="close" @click="closeApp" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Links</q-item-label>
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page padding>
        <div class="q-ma-md">
          <q-card class="q-my-md">
            <q-card-section>
              <div class="text-h6">
                PTA-Next v{{ this.$q.electron.remote.app.getVersion() }}
              </div>
            </q-card-section>
            <q-separator dark inset />
            <q-card-section>
              <p>
                <a
                  href="#"
                  @click="openBrowser('https://github.com/r52/pta-next')"
                  class="text-white"
                  >GitHub</a
                >
              </p>
            </q-card-section>
          </q-card>

          <q-card>
            <q-card-section>
              <div class="text-h6">Components</div>
            </q-card-section>

            <q-separator dark inset />

            <q-card-section>
              <p>Node: {{ this.$q.electron.remote.process.versions.node }}</p>
              <p>
                Electron:
                {{ this.$q.electron.remote.process.versions.electron }}
              </p>
              <p>
                Chrome:
                {{ this.$q.electron.remote.process.versions.chrome }}
              </p>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from '@vue/composition-api';
import { useElectronUtil } from '../functions/context';
import EssentialLink from 'components/EssentialLink.vue';

export default defineComponent({
  name: 'About',

  components: {
    EssentialLink
  },

  setup(props, ctx) {
    const leftDrawerOpen = ref(false);
    const essentialLinks = reactive([
      {
        title: 'Github',
        caption: 'github.com/r52/pta-next',
        icon: 'code',
        link: 'https://github.com/r52/pta-next'
      }
    ]);

    const { closeApp, openBrowser } = useElectronUtil(ctx);

    return {
      leftDrawerOpen,
      essentialLinks,
      closeApp,
      openBrowser
    };
  }
});
</script>
