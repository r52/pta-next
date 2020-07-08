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
            :style="'grid-template-columns:' + ' auto'.repeat(quad ? 24 : 12)"
          >
            <div
              class="grid-item"
              v-for="i in quad ? 576 : 144"
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
import { defineComponent, ref, onBeforeUnmount } from '@vue/composition-api';
import { ipcRenderer } from 'electron';

export default defineComponent({
  name: 'StashHighlight',

  setup() {
    const quad = ref(false);
    const name = ref('');
    const x = ref(0);
    const y = ref(0);

    function stopHighlight() {
      const els = document.getElementsByClassName('pulse');
      if (els) {
        Array.from(els).forEach(el => {
          el.classList.remove('pulse');
        });
      }
    }

    function handleHighlight(tabinfo: TabInfo) {
      quad.value = tabinfo.quad;
      name.value = tabinfo.name;
      x.value = tabinfo.x;
      y.value = tabinfo.y;

      stopHighlight();

      const cell = tabinfo.x + (tabinfo.y - 1) * (tabinfo.quad ? 24 : 12);

      const e = document.getElementById('cell-' + cell.toString());
      if (e) {
        e.classList.add('pulse');
      }
    }

    ipcRenderer.on('highlight', (event, tabinfo) => {
      handleHighlight(tabinfo);
    });

    ipcRenderer.on('stop-highlight', () => {
      stopHighlight();
    });

    onBeforeUnmount(() => {
      ipcRenderer.removeAllListeners('highlight');
      ipcRenderer.removeAllListeners('stop-highlight');
    });

    return {
      quad,
      name,
      x,
      y,
      stopHighlight,
      handleHighlight
    };
  }
});
</script>

<style>
@font-face {
  font-family: 'Fontin-SmallCaps';
  src: url(../fonts/Fontin-SmallCaps.woff) format('woff');
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
  margin: 20px;
}

.pulse {
  display: block;
  border-radius: 0%;
  box-shadow: 0 0 0 rgba(255, 255, 255, 1);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(255, 255, 255, 1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 1);
  }
}
</style>
