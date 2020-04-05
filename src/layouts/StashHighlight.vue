<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page>
        <div class="top">
          <div class="row">
            <div class="col-auto">
              <q-card class="q-ma-sm">
                <q-card-section>
                  <div class="text-caption">Tab: {{ name }}</div>
                  <div class="text-caption text-grey">
                    left: {{ x }}, top: {{ y }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <template>
          <div
            class="grid"
            :style="'grid-template-columns:' + ' auto'.repeat(quad ? 48 : 12)"
          >
            <div
              class="grid-item"
              v-for="i in quad ? 2304 : 144"
              :key="i"
              :id="`cell-${i}`"
            ></div>
          </div>
        </template>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcRenderer } from 'electron';

export default Vue.extend({
  name: 'StashHighlight',

  data() {
    return {
      quad: false,
      name: '',
      x: 0,
      y: 0,
    };
  },

  methods: {
    stopHighlight() {
      const els = document.getElementsByClassName('pulse');
      if (els) {
        Array.from(els).forEach((el) => {
          el.classList.remove('pulse');
        });
      }
    },
    handleHighlight(tabinfo: TabInfo) {
      this.quad = tabinfo.quad;
      this.name = tabinfo.name;
      this.x = tabinfo.x;
      this.y = tabinfo.y;

      this.stopHighlight();

      const cell = tabinfo.x + (tabinfo.y - 1) * (tabinfo.quad ? 48 : 12);

      const e = document.getElementById('cell-' + cell);
      if (e) {
        e.classList.add('pulse');
      }
    },
  },

  created() {
    ipcRenderer.on('highlight', (event, tabinfo) => {
      this.handleHighlight(tabinfo);
    });

    ipcRenderer.on('stop-highlight', () => {
      this.stopHighlight();
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('highlight');
    ipcRenderer.removeAllListeners('stop-highlight');
  },
});
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../statics/fonts/Fontin-SmallCaps.woff) format('woff');
}

html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #12121200 !important;
}

.top {
  width: 100%;
  min-height: 120px;
}

.grid {
  width: 100%;
  min-height: calc(100vh - 120px);
  display: grid;
}

.grid-item {
  margin: 15px;
}

.pulse {
  display: block;
  border-radius: 0%;
  box-shadow: 0 0 0 rgba(255, 255, 255, 1);
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
