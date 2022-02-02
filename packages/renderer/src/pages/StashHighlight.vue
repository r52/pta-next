<template>
  <div>
    <div class="top">
      <div class="flex">
        <div>
          <card>
            <card-section>
              <div class="text-xs text-white">
                Tab: {{ name }}
              </div>
              <div class="text-xs text-white">
                left: {{ x }}, top: {{ y }}
              </div>
            </card-section>
          </card>
        </div>
      </div>
    </div>

    <div
      class="grid"
      :style="'grid-template-columns:' + ' auto'.repeat(quad ? 24 : 12)"
    >
      <div
        v-for="i in quad ? 576 : 144"
        :id="`cell-${i}`"
        :key="i"
        class="grid-item"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Card from '/@/components/CardItem.vue';
import CardSection from '/@/components/CardSection.vue';

import type { TabInfo } from '../../types';

const { ipcOn } = window.electron;

const quad = ref(false);
const name = ref('');
const x = ref(0);
const y = ref(0);

function stopHighlight() {
  const els = document.getElementsByClassName('pulse');
  if (els) {
    Array.from(els).forEach((el) => {
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

ipcOn('highlight', (tabinfo: TabInfo) => {
  handleHighlight(tabinfo);
});

ipcOn('stop-highlight', () => {
  stopHighlight();
});
</script>

<style>
html {
  overflow-y: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
  background-color: #12121200 !important;
}

.top {
  width: 100%;
}

.grid {
  position: absolute;
  top: 15.5%;
  left: 2.5%;
  width: 95%;
  height: 77.3%;
  display: grid;
}

.grid-item {
  margin: 0px;
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
