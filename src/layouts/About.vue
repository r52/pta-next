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
          <img src="statics/icon.png" />
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
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink';

export default {
  name: 'About',

  components: {
    EssentialLink
  },

  data() {
    return {
      leftDrawerOpen: false,
      essentialLinks: [
        {
          title: 'Github',
          caption: 'github.com/r52/pta-next',
          icon: 'code',
          link: 'https://github.com/r52/pta-next'
        }
      ]
    };
  },

  methods: {
    closeApp() {
      const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow();

      if (win) {
        win.close();
      }
    },
    openBrowser(link) {
      this.$q.electron.remote.shell.openExternal(link);
    }
  }
};
</script>
