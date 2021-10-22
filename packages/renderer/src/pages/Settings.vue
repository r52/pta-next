<template>
  <div class="bg-gray-800 h-full text-white">
    <div class="bg-yellow-900 titlebar flex items-center w-full">
      <div class="flex-none p-2">
        <img src="../../assets/logo.svg">
      </div>
      <div class="flex-grow text-3xl p-4">
        <span class="">Settings</span>
      </div>
      <div class="flex-none pr-2">
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

    <div class="p-2 pb-10 overflow-auto overscroll-auto">
      <tabs v-model="tab">
        <!--
        <tab name="hotkey">
          Hotkey
        </tab>
        -->
        <tab name="client">
          Client
        </tab>
        <tab name="tradeui">
          Trade UI
        </tab>
        <tab name="cheatsheet">
          Cheat Sheets
        </tab>
      </tabs>
      <tab-panels v-model="tab">
        <!-- Hotkey tab 
        <tab-panel name="hotkey">
          <div class="p-1">
            <div class="grid grid-cols-2 items-center justify-between">
              <div>
                <label class="inline-flex items-center">
                  <input
                    v-model="settings.hotkey.quickpaste"
                    type="checkbox"
                    class="
                      rounded
                      bg-gray-200
                      border-transparent
                      focus:border-transparent focus:bg-gray-200
                      text-gray-700
                      focus:ring-1 focus:ring-offset-2 focus:ring-gray-500
                    "
                  >
                  <span
                    class="ml-2"
                  >Quick paste trade whispers when holding modifier key</span>
                </label>
              </div>
              <div>
                <label class="block">
                  <span>Quick Paste Modifier</span>
                  <select
                    v-model="settings.hotkey.quickpastemod"
                    class="
                      block
                      w-full
                      mt-1
                      rounded-md
                      bg-gray-600
                      border-transparent
                      focus:border-gray-500 focus:bg-gray-900 focus:ring-0
                    "
                    :disabled="!settings.hotkey.quickpaste"
                  >
                    <option value="0">Ctrl</option>
                    <option value="1">Shift</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </tab-panel>
        -->

        <!-- Client tab -->
        <tab-panel name="client">
          <div class="p-1">
            <div class="flex items-center">
              <div class="flex-initial px-2">
                <label class="inline-flex items-center">
                  Client Log Location:
                </label>
              </div>
              <div
                v-if="!settings.client.logpath"
                class="flex-grow"
              >
                <label class="block">
                  <span class="text-white-700">Client.txt</span>
                  <input
                    type="file"
                    class="mt-1 block w-full"
                    accept=".txt"
                    @change="clientTxtChanged"
                  >
                </label>
              </div>
              <div
                v-else
                class="flex-grow px-2"
              >
                <span class="flex space-x-2">
                  <button
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
                    @click="removeClienttxt"
                  >
                    Remove Client.txt
                  </button>
                  <label class="block flex-grow">
                    <span class="text-white-700">Current Client.txt</span>
                    <input
                      v-model="settings.client.logpath"
                      type="text"
                      class="
                        mt-1
                        block
                        w-full
                        rounded-md
                        bg-gray-600
                        border-transparent
                        focus:border-gray-500 focus:bg-gray-700 focus:ring-0
                      "
                      disabled
                    >
                  </label>
                </span>
              </div>
            </div>
          </div>
        </tab-panel>

        <!-- Trade UI tab -->
        <tab-panel name="tradeui">
          <div class="p-1">
            <div
              class="grid grid-cols-2 items-center justify-between space-y-2"
            >
              <div class="col-span-2">
                <label class="inline-flex items-center">
                  <input
                    v-model="settings.tradeui.enabled"
                    type="checkbox"
                    class="
                      rounded
                      bg-gray-200
                      border-transparent
                      focus:border-transparent focus:bg-gray-200
                      text-gray-700
                      focus:ring-1 focus:ring-offset-2 focus:ring-gray-500
                    "
                  >
                  <span
                    class="ml-2"
                  >Enable Trade UI features (Client.txt path must be set for
                    this to work!)</span>
                </label>
              </div>
              <div class="col-span-2">
                <label class="inline-flex items-center">
                  <input
                    v-model="settings.tradeui.tradebar"
                    type="checkbox"
                    class="
                      rounded
                      bg-gray-200
                      border-transparent
                      focus:border-transparent focus:bg-gray-200
                      text-gray-700
                      focus:ring-1 focus:ring-offset-2 focus:ring-gray-500
                    "
                  >
                  <span class="ml-2">Show Trade Bar on startup</span>
                </label>
              </div>
              <div class="col-span-2">
                <label class="inline-flex items-center">
                  <input
                    v-model="settings.tradeui.highlight"
                    type="checkbox"
                    class="
                      rounded
                      bg-gray-200
                      border-transparent
                      focus:border-transparent focus:bg-gray-200
                      text-gray-700
                      focus:ring-1 focus:ring-offset-2 focus:ring-gray-500
                    "
                  >
                  <span class="ml-2">Stash Highlighting</span>
                </label>
              </div>
              <div>
                <label>
                  <span
                    class="ml-2"
                  >Quad Stash Tabs for stash highlighting (separate each entry
                    with a comma):</span>
                </label>
              </div>
              <div>
                <input
                  v-model="quadtabs"
                  type="text"
                  class="
                    mt-1
                    w-full
                    rounded-md
                    bg-gray-600
                    border-transparent
                    focus:border-gray-500 focus:bg-gray-700 focus:ring-0
                  "
                  placeholder="Quad Tabs (comma separated)"
                >
              </div>
              <div>
                <label>
                  <span
                    class="ml-2"
                  >Character Name (for leaving parties):</span>
                </label>
              </div>
              <div>
                <input
                  v-model="settings.tradeui.charname"
                  type="text"
                  class="
                    mt-1
                    w-full
                    rounded-md
                    bg-gray-600
                    border-transparent
                    focus:border-gray-500 focus:bg-gray-700 focus:ring-0
                  "
                  placeholder="Character Name"
                >
              </div>
              <div class="col-span-2 p-4">
                <span class="inline-flex items-center p-2">
                  <span class="text-2xl">Incoming Trade Commands</span>
                </span>
                <data-table
                  v-model="settings.tradeui.incoming"
                  :columns="tradeuicolumns"
                  row-key="label"
                  @add="openDialog('Add', settings.tradeui.incoming)"
                  @edit="
                    (data) =>
                      openDialog('Edit', settings.tradeui.incoming, data)
                  "
                  @remove="
                    (data) =>
                      removeTradeCommand(data, settings.tradeui.incoming)
                  "
                />
              </div>

              <div class="col-span-2 p-4">
                <span class="inline-flex items-center p-2">
                  <span class="text-2xl">Outgoing Trade Commands</span>
                </span>
                <data-table
                  v-model="settings.tradeui.outgoing"
                  :columns="tradeuicolumns"
                  row-key="label"
                  @add="openDialog('Add', settings.tradeui.outgoing)"
                  @edit="
                    (data) =>
                      openDialog('Edit', settings.tradeui.outgoing, data)
                  "
                  @remove="
                    (data) =>
                      removeTradeCommand(data, settings.tradeui.outgoing)
                  "
                />
              </div>
            </div>
          </div>

          <modal v-model:open="openDlg">
            <template #body>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle
                  as="h3"
                  class="text-lg leading-6 font-medium text-gray-900"
                >
                  {{ dlgMode }} Command
                </DialogTitle>
                <div class="mt-2 text-gray-500">
                  <div class="grid grid-cols-2 items-center space-y-2">
                    <div>
                      <label>
                        <span class="ml-2">Label:</span>
                      </label>
                    </div>
                    <div>
                      <input
                        v-model="tradeCmdData.label"
                        type="text"
                        class="
                          mt-1
                          w-full
                          rounded-md
                          bg-white-600
                          focus:border-white-500 focus:bg-white-700 focus:ring-0
                        "
                      >
                    </div>

                    <div>
                      <label>
                        <span class="ml-2">Command:</span>
                      </label>
                    </div>
                    <div>
                      <input
                        v-model="tradeCmdData.command"
                        type="text"
                        class="
                          mt-1
                          w-full
                          rounded-md
                          bg-white-600
                          focus:border-white-500 focus:bg-white-700 focus:ring-0
                        "
                      >
                    </div>

                    <div>
                      <label>
                        <span class="ml-2">Closes Notification?:</span>
                      </label>
                    </div>
                    <div>
                      <input
                        v-model="tradeCmdData.close"
                        type="checkbox"
                        class="
                          mt-1
                          rounded-md
                          bg-white-600
                          focus:border-white-500 focus:bg-white-700 focus:ring-0
                        "
                      >
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #buttons="props">
              <button
                type="button"
                class="
                  w-full
                  inline-flex
                  justify-center
                  rounded-md
                  border border-transparent
                  shadow-sm
                  px-4
                  py-2
                  bg-green-600
                  text-base
                  font-medium
                  text-white
                  hover:bg-green-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-offset-2
                  focus:ring-green-500
                  sm:ml-3 sm:w-auto sm:text-sm
                "
                @click="addTradeCommand"
              >
                Save
              </button>
              <button
                ref="cancelButtonRef"
                type="button"
                class="
                  mt-3
                  w-full
                  inline-flex
                  justify-center
                  rounded-md
                  border border-gray-300
                  shadow-sm
                  px-4
                  py-2
                  bg-white
                  text-base
                  font-medium
                  text-gray-700
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-offset-2
                  focus:ring-indigo-500
                  sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                "
                @click="props.closefunc"
              >
                Cancel
              </button>
            </template>
          </modal>
        </tab-panel>

        <tab-panel name="cheatsheet">
          <div class="p-1">
            <div
              class="grid grid-cols-2 items-center justify-between space-y-2"
            >
              <div class="col-span-2">
                Use Image URLs (Clear to use default PTA-Next cheat sheets)
              </div>

              <div>
                <label>
                  <span class="ml-2">Incursion</span>
                </label>
              </div>
              <div>
                <input
                  v-model="settings.cheatsheet.incursion"
                  type="text"
                  class="
                    mt-1
                    w-full
                    rounded-md
                    bg-gray-600
                    border-transparent
                    focus:border-gray-500 focus:bg-gray-700 focus:ring-0
                  "
                  placeholder="Incursion Cheat Sheet (Image URL)"
                >
              </div>
              <div>
                <label>
                  <span class="ml-2">Betrayal</span>
                </label>
              </div>
              <div>
                <input
                  v-model="settings.cheatsheet.betrayal"
                  type="text"
                  class="
                    mt-1
                    w-full
                    rounded-md
                    bg-gray-600
                    border-transparent
                    focus:border-gray-500 focus:bg-gray-700 focus:ring-0
                  "
                  placeholder="Betrayal Cheat Sheet (Image URL)"
                >
              </div>
            </div>
          </div>
        </tab-panel>
      </tab-panels>
    </div>
    <div
      class="
        fixed
        bottom-0
        left-0
        bg-yellow-900
        flex flex-row-reverse
        items-center
        w-full
        p-4
      "
    >
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
          bg-green-600
          hover:bg-green-500
          focus:border-green-700
          active:bg-green-700
        "
        @click="saveSettings"
      >
        Save Settings
      </button>
    </div>

    <notification
      v-model="showNotification"
      class="fixed top-0 inset-x-1/3"
    >
      <template #content>
        <div class="text-sm text-black">
          Settings Successfully saved!
        </div>
      </template>
    </notification>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, toRaw } from 'vue';
import { XIcon } from '@heroicons/vue/outline';
import Tabs from '/@/components/Tabs.vue';
import Tab from '/@/components/Tab.vue';
import TabPanels from '/@/components/TabPanels.vue';
import TabPanel from '/@/components/TabPanel.vue';
import DataTable from '/@/components/DataTable.vue';
import Modal from '/@/components/Modal.vue';
import Notification from '/@/components/Notification.vue';
import { DialogTitle } from '@headlessui/vue';

import { useElectron } from '/@/use/electron';

import Config from '../../../main/src/config';
import type { TradeCommand } from '../../types';

export default defineComponent({
  name: 'Settings',
  components: {
    Tabs,
    Tab,
    TabPanels,
    TabPanel,
    DataTable,
    Modal,
    Notification,
    DialogTitle,
    XIcon,
  },

  setup() {
    // utility functions
    const { closeWindow, openBrowser, getConfig, setConfig } = useElectron();

    const showNotification = ref(false);

    // Settings

    const settings = reactive({
      hotkey: {
        quickpaste: Config.default.quickpaste,
        quickpastemod: Config.default.quickpastemod,
      },
      client: {
        logpath: Config.default.clientlogpath,
      },
      tradeui: {
        enabled: Config.default.tradeui,
        tradebar: Config.default.tradebar,
        charname: Config.default.tradecharname,
        highlight: Config.default.tradestashhighlight,
        quad: Config.default.tradestashquad as string[],
        incoming: Config.default.tradeuiincoming,
        outgoing: Config.default.tradeuioutgoing,
      },
      cheatsheet: {
        incursion: Config.default.cheatsheetincursion,
        betrayal: Config.default.cheatsheetbetrayal,
      },
    });

    getConfig().then((result: Record<string, unknown>) => {
      if (result) {
        Object.assign(settings, result);
      }
    });

    function saveSettings() {
      setConfig(toRaw(settings));

      showNotification.value = true;

      setTimeout(() => {
        showNotification.value = false;
      }, 3000);
    }

    //   // quad tab compute
    const quadtabs = computed({
      get: () => {
        return settings.tradeui.quad.join(',');
      },
      set: (newval: string) => {
        let tabs = newval.split(',');
        tabs = tabs.map((t) => t.trim());
        settings.tradeui.quad = tabs;
      },
    });

    const tradeuicolumns = [
      {
        name: 'label',
        label: 'Label',
        field: 'label',
      },
      {
        name: 'command',
        label: 'Command',
        field: 'command',
      },
      {
        name: 'close',
        label: 'Closes Notification?',
        field: 'close',
      },
    ];

    //   // Trade commands dialog
    const openDlg = ref(false);
    const dlgMode = ref('Add');
    let cmdref = [] as TradeCommand[];

    const tradeCmdData = reactive({
      label: '',
      command: '',
      close: false,
    });

    function openDialog(mode: string, to: TradeCommand[], data?: TradeCommand) {
      cmdref = to;

      tradeCmdData.label = '';
      tradeCmdData.command = '';
      tradeCmdData.close = false;

      if (data) {
        tradeCmdData.label = data.label;
        tradeCmdData.command = data.command;
        tradeCmdData.close = data.close;
      }

      dlgMode.value = mode;
      openDlg.value = true;
    }

    function addTradeCommand() {
      if (tradeCmdData.label && tradeCmdData.command) {
        const idx = cmdref.findIndex(
          (target) => target.label === tradeCmdData.label,
        );
        if (idx === -1) {
          cmdref.push({ ...tradeCmdData });
        } else {
          cmdref[idx].label = tradeCmdData.label;
          cmdref[idx].command = tradeCmdData.command;
          cmdref[idx].close = tradeCmdData.close;
        }
      }

      tradeCmdData.label = '';
      tradeCmdData.command = '';
      tradeCmdData.close = false;

      openDlg.value = false;
    }

    function removeTradeCommand(row: any, from: TradeCommand[]) {
      const idx = from.findIndex((target) => target.label === row.label);

      if (idx > -1) {
        from.splice(idx, 1);
      }
    }

    function removeClienttxt() {
      settings.client.logpath = '';
    }

    function clientTxtChanged(event: Event) {
      const elem = event?.target as HTMLInputElement;

      if (elem.files && elem.files.length) {
        const file = elem.files.item(0) as File;
        // @ts-expect-error: this is an Electron.File, which has the path directive
        settings.client.logpath = file?.path ?? '';
      }
    }

    const tab = ref('client');

    return {
      settings,
      saveSettings,

      quadtabs,

      tab,
      showNotification,

      tradeuicolumns,
      tradeCmdData,
      openDlg,
      dlgMode,
      openDialog,
      addTradeCommand,
      removeTradeCommand,

      clientTxtChanged,
      removeClienttxt,

      closeWindow,
      openBrowser,
    };
  },
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
