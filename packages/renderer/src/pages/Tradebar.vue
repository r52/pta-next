<template>
  <div class="bg-gray-600 h-full text-white w-full">
    <div class="flex flex-row">
      <div>
        <button
          type="button"
          class="
            titlebar
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-md
          "
        >
          <DotsVerticalIcon class="h-4 w-4" />
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-green-500
            hover:bg-gray-400
          "
          @click="sendCommand('self-hideout')"
        >
          <HomeIcon class="h-4 w-4" />
          <span class="tooltiptext">Hideout</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-yellow-300
            hover:bg-gray-400
          "
          @click="sendMsg('test-trade-notification')"
        >
          <ExclamationIcon class="h-4 w-4" />
          <span class="tooltiptext">Test Notification</span>
        </button>
      </div>

      <!-- Debug -->
      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-indigo-300
            hover:bg-gray-400
          "
          @click="sendMsg('stash-debug')"
        >
          <ViewGridIcon class="h-4 w-4" />
          <span class="tooltiptext">Stash Highlighting Debug</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-green-200
            hover:bg-gray-400
          "
          @click="sendMsg('open-trade-history')"
        >
          <ClockIcon class="h-4 w-4" />
          <span class="tooltiptext">Trade History</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-red-500
            hover:bg-gray-400
          "
          @click="sendMsg('open-cheatsheet-incursion')"
        >
          <PaperAirplaneIcon class="h-4 w-4" />
          <span class="tooltiptext">Incursion Cheat Sheet</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-red-200
            hover:bg-gray-400
          "
          @click="sendMsg('open-cheatsheet-betrayal')"
        >
          <GlobeIcon class="h-4 w-4" />
          <span class="tooltiptext">Betrayal Cheat Sheet</span>
        </button>
      </div>

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-yellow-500
            hover:bg-gray-400
          "
          @click="sendMsg('open-settings')"
        >
          <CogIcon class="h-4 w-4" />
          <span class="tooltiptext">Open Settings</span>
        </button>
      </div>

      <div class="flex-grow" />

      <div>
        <button
          type="button"
          class="
            tooltip
            p-1
            inline-flex
            items-center
            border border-transparent
            rounded-sm
            text-white
            hover:bg-gray-400
          "
          @click="closeWindow"
        >
          <XIcon class="h-4 w-4" />
          <span class="tooltiptext">Close Tradebar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useElectron } from '/@/use/electron';
import {
  XIcon,
  DotsVerticalIcon,
  HomeIcon,
  ExclamationIcon,
  ViewGridIcon,
  ClockIcon,
  CogIcon,
  PaperAirplaneIcon,
  GlobeIcon,
} from '@heroicons/vue/solid';

export default defineComponent({
  name: 'Tradebar',

  components: {
    XIcon,
    DotsVerticalIcon,
    HomeIcon,
    ExclamationIcon,
    ViewGridIcon,
    ClockIcon,
    CogIcon,
    PaperAirplaneIcon,
    GlobeIcon,
  },

  setup() {
    const { closeWindow, ipcSend } = useElectron();

    function sendMsg(msg: string) {
      ipcSend(msg);
    }

    function sendCommand(command: string) {
      ipcSend('trade-command', {}, command);
    }

    return {
      sendMsg,
      sendCommand,
      closeWindow,
    };
  },
});
</script>

<style>
html {
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}

body {
  font-family: 'Fontin-SmallCaps';
}

.titlebar {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

button {
  -webkit-app-region: no-drag;
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #374151;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
</style>
