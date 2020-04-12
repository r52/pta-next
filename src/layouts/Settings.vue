<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar class="q-electron-drag bg-grey-10">
        <q-avatar>
          <img src="statics/icon.png" />
        </q-avatar>
        <q-toolbar-title>
          Settings
        </q-toolbar-title>

        <q-btn flat round dense icon="close" @click="closeApp" />
      </q-toolbar>

      <q-tabs v-model="tab" class="bg-brown-8">
        <q-tab name="hotkey" icon="space_bar" label="Hotkey" />
        <q-tab name="price" icon="shop" label="Price Check" />
        <q-tab name="macro" icon="gamepad" label="Macros" />
        <q-tab name="client" icon="desktop_windows" label="Client" />
        <q-tab name="tradeui" icon="swap_horiz" label="Trade UI" />
      </q-tabs>
    </q-header>
    <q-footer>
      <q-toolbar class="bg-grey-9">
        <q-space />
        <q-btn label="Save" color="green" @click="saveSettings()" />
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-page padding>
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="hotkey">
            <q-card>
              <div class="q-pa-xs">
                <div class="row items-center justify-end">
                  <a href="#" @click="openKeyRef()" class="text-orange"
                    >Keycode Reference</a
                  >
                </div>

                <div class="row items-center">
                  <div class="col">
                    <q-toggle
                      v-model="settings.hotkey.simplehotkeyenabled"
                      label="Simple Hotkey"
                    />
                  </div>
                  <div class="col">
                    <q-input
                      color="teal"
                      v-model="settings.hotkey.simplehotkey"
                      label="Simple Hotkey"
                      :disable="!settings.hotkey.simplehotkeyenabled"
                    />
                  </div>
                </div>

                <div class="row items-center">
                  <div class="col">
                    <q-toggle
                      v-model="settings.hotkey.advancedhotkeyenabled"
                      label="Advanced Hotkey"
                    />
                  </div>
                  <div class="col">
                    <q-input
                      color="teal"
                      v-model="settings.hotkey.advancedhotkey"
                      label="Advanced Hotkey"
                      :disable="!settings.hotkey.advancedhotkeyenabled"
                    />
                  </div>
                </div>

                <div class="row items-center">
                  <div class="col">
                    <q-toggle
                      v-model="settings.hotkey.wikihotkeyenabled"
                      label="Wiki Hotkey"
                    />
                  </div>
                  <div class="col">
                    <q-input
                      color="teal"
                      v-model="settings.hotkey.wikihotkey"
                      label="Wiki Hotkey"
                      :disable="!settings.hotkey.wikihotkeyenabled"
                    />
                  </div>
                </div>

                <div class="row items-center">
                  <div class="col">
                    <q-toggle
                      v-model="settings.hotkey.quickpaste"
                      label="Quick paste trade whispers when holding modifier key"
                    />
                  </div>
                  <div class="col-auto">
                    <q-select
                      v-model="settings.hotkey.quickpastemod"
                      :options="quickpastemods"
                      label="Quick Paste Modifier"
                      :disable="!settings.hotkey.quickpaste"
                      style="width: 250px;"
                      map-options
                    />
                  </div>
                </div>

                <div class="row items-center">
                  <div class="col">
                    <q-toggle
                      v-model="settings.hotkey.cscroll"
                      label="Ctrl+Mouse Wheel scrolls through stash tabs"
                    />
                  </div>
                </div>
              </div>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="price">
            <q-card>
              <q-card-section>
                <div class="text-h6">Price Check</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="q-pa-xs">
                  <div class="row items-center">
                    <div class="col">
                      <q-select
                        v-model="settings.pricecheck.league"
                        :options="leagues"
                        label="League"
                        map-options
                      />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col">
                      <q-toggle
                        v-model="settings.pricecheck.corruptoverride"
                        label="Corrupt Override"
                      />
                    </div>
                    <div class="col-auto">
                      <q-select
                        v-model="settings.pricecheck.corruptsearch"
                        :options="corrupts"
                        label="Corrupt Override Option"
                        :disable="!settings.pricecheck.corruptoverride"
                        style="width: 250px;"
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      <q-select
                        v-model="settings.pricecheck.primarycurrency"
                        :options="currencies"
                        label="Primary Currency"
                        map-options
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      <q-select
                        v-model="settings.pricecheck.secondarycurrency"
                        :options="currencies"
                        label="Secondary Currency"
                        map-options
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      Maximum number of results to query:
                      <q-tooltip
                        >Keep this value low to improve trade site load
                        times</q-tooltip
                      >
                    </div>
                    <div class="col">
                      <q-slider
                        v-model="settings.pricecheck.displaylimit"
                        :min="10"
                        :max="50"
                        :step="10"
                        label
                        :label-value="
                          settings.pricecheck.displaylimit + ' results'
                        "
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.onlineonly"
                        label="Online Only"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.buyoutonly"
                        label="Buyout Only"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.removedupes"
                        label="Remove duplicates from the same account"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.poeprices"
                        label="Perform poeprices.info price prediction"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
            <q-card>
              <q-card-section>
                <div class="text-h6">Pre-Selected Options</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="q-pa-xs">
                  <div class="row items-center">
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillmin"
                        label="Pre-fill minimums"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillmax"
                        label="Pre-fill maximums"
                      />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col">Pre-fill range (+/-%):</div>
                    <div class="col">
                      <q-slider
                        v-model="settings.pricecheck.prefillrange"
                        :min="0"
                        :max="100"
                        :step="5"
                        label
                        :label-value="
                          '+/- ' + settings.pricecheck.prefillrange + '%'
                        "
                      />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillnormals"
                        label="Pre-fill normal mods"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillpseudos"
                        label="Pre-fill pseudo mods"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillilvl"
                        label="Pre-fill iLvl"
                      />
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="settings.pricecheck.prefillbase"
                        label="Pre-fill Item Base"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="macro">
            <div class="row justify-end q-py-xs">
              <a href="#" @click="openKeyRef()" class="text-orange justify-end"
                >Keycode Reference</a
              >
            </div>
            <q-table
              title="Custom Macros"
              :data="settings.macros.list"
              :columns="macroColumns"
              row-key="name"
              :filter="macroFilter"
            >
              <template v-slot:top-right>
                <q-input
                  dense
                  debounce="300"
                  color="primary"
                  v-model="macroFilter"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>

              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th auto-width />
                  <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                  >
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td auto-width>
                    <q-btn
                      size="sm"
                      color="accent"
                      round
                      dense
                      @click="deleteMacro(props.key)"
                      icon="remove"
                    />
                  </q-td>
                  <q-td key="name" :props="props">
                    {{ props.row.name }}
                  </q-td>
                  <q-td key="key" :props="props">
                    {{ props.row.key }}
                    <q-popup-edit
                      v-model="props.row.key"
                      title="Update Key"
                      buttons
                    >
                      <q-input v-model="props.row.key" dense autofocus />
                    </q-popup-edit>
                  </q-td>
                  <q-td key="type" :props="props">
                    {{ props.row.type }}
                    <q-popup-edit v-model="props.row.type">
                      <q-select
                        v-model="props.row.type"
                        :options="macroTypes"
                        label="Macro Type"
                        dense
                        options-dense
                        autofocus
                      />
                    </q-popup-edit>
                  </q-td>
                  <q-td key="command" :props="props">
                    {{ props.row.command }}
                    <q-popup-edit
                      v-model="props.row.command"
                      title="Update Command"
                    >
                      <q-input v-model="props.row.command" dense autofocus />
                    </q-popup-edit>
                  </q-td>
                </q-tr>
              </template>
            </q-table>

            <q-dialog v-model="macroDialog">
              <q-card style="min-width: 350px;">
                <q-card-section>
                  <div class="text-h6">New Macro</div>
                </q-card-section>

                <q-card-section class="q-pt-none">
                  <q-input
                    dense
                    v-model="macroAdd.name"
                    label="Name"
                    autofocus
                  />
                  <q-input dense v-model="macroAdd.key" label="Key" />
                  <q-select
                    v-model="macroAdd.type"
                    :options="macroTypes"
                    label="Type"
                  />
                  <q-input dense v-model="macroAdd.command" label="Command" />
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn flat label="Cancel" v-close-popup />
                  <q-btn flat label="Add" @click="addMacro" v-close-popup />
                </q-card-actions>
              </q-card>
            </q-dialog>

            <q-page-sticky position="bottom-right" :offset="[18, 18]">
              <q-btn fab icon="add" color="accent" @click="openMacroDialog" />
            </q-page-sticky>
          </q-tab-panel>

          <q-tab-panel name="client">
            <q-card>
              <q-card-section>
                <div class="text-h6">Game Client</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="q-pa-xs">
                  <div class="row items-center">
                    <div class="col">
                      Client Log location:
                    </div>
                    <div class="col">
                      <q-file
                        v-model="settings.client.logpath"
                        label="Client.txt"
                        accept=".txt"
                        clearable
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="tradeui">
            <q-card>
              <q-card-section>
                <div class="text-h6">Trade UI</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div class="q-pa-xs">
                  <div class="row items-center">
                    <div class="col">
                      <q-toggle
                        v-model="settings.tradeui.enabled"
                        label="Enable Trade UI features (Client.txt path must be set for this to work!)"
                      />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col">
                      <q-toggle
                        v-model="settings.tradeui.tradebar"
                        label="Show Trade Bar on startup"
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      Quad Stash Tabs for stash highlighting (separate each
                      entry with a comma):
                    </div>
                    <div class="col">
                      <q-input v-model="quadtabs" label="Quad Tabs" />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      <q-toggle
                        v-model="settings.tradeui.highlight"
                        label="Stash highlighting (setup alignment using Trade bar)"
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col">
                      Character Name (for leaving parties):
                    </div>
                    <div class="col">
                      <q-input
                        v-model="settings.tradeui.charname"
                        label="Character Name"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card>
              <q-card-section>
                <div class="text-h6">Commands</div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-table
                  title="Incoming Trade Commands"
                  :data="settings.tradeui.incoming"
                  :columns="tradeColumns"
                  row-key="label"
                >
                  <template v-slot:top-right>
                    <q-btn
                      color="primary"
                      label="Add Command"
                      @click="openTradeCmdDialog('incoming')"
                    />
                  </template>

                  <template v-slot:header="props">
                    <q-tr :props="props">
                      <q-th auto-width />
                      <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                      >
                        {{ col.label }}
                      </q-th>
                    </q-tr>
                  </template>

                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td auto-width>
                        <q-btn
                          size="sm"
                          color="accent"
                          round
                          dense
                          @click="deleteTradeCmd(props.key, 'incoming')"
                          icon="remove"
                        />
                      </q-td>
                      <q-td key="label" :props="props">
                        {{ props.row.label }}
                      </q-td>
                      <q-td key="command" :props="props">
                        {{ props.row.command }}
                        <q-popup-edit
                          v-model="props.row.command"
                          title="Update Command"
                        >
                          <q-input
                            v-model="props.row.command"
                            dense
                            autofocus
                          />
                        </q-popup-edit>
                      </q-td>
                      <q-td key="close" :props="props">
                        <q-checkbox v-model="props.row.close" />
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-table
                  title="Outgoing Trade Commands"
                  :data="settings.tradeui.outgoing"
                  :columns="tradeColumns"
                  row-key="label"
                >
                  <template v-slot:top-right>
                    <q-btn
                      color="primary"
                      label="Add Command"
                      @click="openTradeCmdDialog('outgoing')"
                    />
                  </template>

                  <template v-slot:header="props">
                    <q-tr :props="props">
                      <q-th auto-width />
                      <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                      >
                        {{ col.label }}
                      </q-th>
                    </q-tr>
                  </template>

                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td auto-width>
                        <q-btn
                          size="sm"
                          color="accent"
                          round
                          dense
                          @click="deleteTradeCmd(props.key, 'outgoing')"
                          icon="remove"
                        />
                      </q-td>
                      <q-td key="label" :props="props">
                        {{ props.row.label }}
                      </q-td>
                      <q-td key="command" :props="props">
                        {{ props.row.command }}
                        <q-popup-edit
                          v-model="props.row.command"
                          title="Update Command"
                        >
                          <q-input
                            v-model="props.row.command"
                            dense
                            autofocus
                          />
                        </q-popup-edit>
                      </q-td>
                      <q-td key="close" :props="props">
                        <q-checkbox v-model="props.row.close" />
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>

            <q-dialog v-model="tradeCmdDialog">
              <q-card style="min-width: 350px;">
                <q-card-section>
                  <div class="text-h6">New Command</div>
                </q-card-section>

                <q-card-section class="q-pt-none">
                  <q-input
                    dense
                    v-model="tradeCmdAdd.label"
                    label="Label"
                    autofocus
                  />
                  <q-input
                    dense
                    v-model="tradeCmdAdd.command"
                    label="Command"
                  />
                  <q-checkbox
                    v-model="tradeCmdAdd.close"
                    label="Closes Notification?"
                  />
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn flat label="Cancel" v-close-popup />
                  <q-btn
                    flat
                    label="Add"
                    @click="addTradeCmd(tradeCmdAddType)"
                    v-close-popup
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-tab-panel>
        </q-tab-panels>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
import Vue from 'vue';
import { ipcRenderer } from 'electron';
import cfg from 'electron-cfg';
import Config from '../../src-electron/lib/config';

export default Vue.extend({
  name: 'Settings',

  computed: {
    quadtabs: {
      get(): string {
        return this.settings.tradeui.quad.join(',');
      },
      set(newval: string) {
        let tabs = newval.split(',');
        tabs = tabs.map(t => t.trim());
        this.settings.tradeui.quad = tabs;
      }
    }
  },

  data() {
    let leagues = this.$q.electron.remote.getGlobal('pta').leagues;

    leagues = leagues.map((lg: string, idx: number) => {
      return {
        label: lg,
        value: idx
      };
    });

    const currencies = [
      { label: 'Orb of Alteration', value: 'alt' },
      { label: 'Orb of Fusing', value: 'fuse' },
      { label: 'Orb of Alchemy', value: 'alch' },
      { label: 'Chaos Orb', value: 'chaos' },
      { label: "Gemcutter's Prism", value: 'gcp' },
      { label: 'Exalted Orb', value: 'exa' },
      { label: 'Chromatic Orb', value: 'chrom' },
      { label: "Jeweller's Orb", value: 'jew' },
      { label: "Engineer's Orb", value: 'engineers-orb' },
      { label: 'Orb of Chance', value: 'chance' },
      { label: "Cartographer's Chisel", value: 'chisel' },
      { label: 'Orb of Scouring', value: 'scour' },
      { label: 'Blessed Orb', value: 'blessed' },
      { label: 'Orb of Regret', value: 'regret' },
      { label: 'Regal Orb', value: 'regal' },
      { label: 'Divine Orb', value: 'divine' },
      { label: 'Vaal Orb', value: 'vaal' },
      { label: 'Orb of Annulment', value: 'orb-of-annulment' },
      { label: 'Orb of Binding', value: 'orb-of-binding' },
      { label: 'Ancient Orb', value: 'ancient-orb' },
      { label: 'Orb of Horizons', value: 'orb-of-horizons' },
      { label: "Harbinger's Orb", value: 'harbingers-orb' },
      { label: 'Scroll of Wisdom', value: 'wis' },
      { label: 'Portal Scroll', value: 'port' },
      { label: "Armourer's Scrap", value: 'scr' },
      { label: "Blacksmith's Whetstone", value: 'whe' },
      { label: "Glassblower's Bauble", value: 'ba' },
      { label: 'Orb of Transmutation', value: 'tra' },
      { label: 'Orb of Augmentation', value: 'aug' },
      { label: 'Mirror of Kalandra', value: 'mir' },
      { label: 'Perandus Coin', value: 'p' },
      { label: 'Silver Coin', value: 'silver' }
    ];

    const macroColumns = [
      {
        name: 'name',
        align: 'left',
        label: 'Name',
        field: 'name'
      },
      {
        name: 'key',
        align: 'left',
        label: 'Key',
        field: 'key'
      },
      {
        name: 'type',
        align: 'left',
        label: 'Type',
        field: 'type'
      },
      {
        name: 'command',
        align: 'left',
        label: 'Command',
        field: 'command'
      }
    ];

    const macros = cfg.get(Config.macros, Config.default.macros);

    const clientpath = cfg.get(
      Config.clientlogpath,
      Config.default.clientlogpath
    );

    let clientfile = null;

    if (clientpath) {
      clientfile = { name: clientpath, path: clientpath } as File;
    }

    const tradeuicolumns = [
      {
        name: 'label',
        align: 'left',
        label: 'Label',
        field: 'label'
      },
      {
        name: 'command',
        align: 'left',
        label: 'Command',
        field: 'command'
      },
      {
        name: 'close',
        align: 'left',
        label: 'Closes Notification?',
        field: 'close'
      }
    ];

    return {
      tab: 'hotkey',
      leagues: Object.freeze(leagues),
      quickpastemods: [
        {
          label: 'Ctrl',
          value: 'ctrlKey'
        },
        {
          label: 'Shift',
          value: 'shiftKey'
        }
      ],
      corrupts: ['Any', 'Yes', 'No'],
      macroTypes: ['chat', 'url'],
      macroColumns: macroColumns,
      macroFilter: '',
      macroAdd: {
        name: '',
        key: '',
        type: '',
        command: ''
      },
      macroDialog: false,
      currencies: Object.freeze(currencies),
      tradeColumns: tradeuicolumns,
      tradeCmdDialog: false,
      tradeCmdAddType: '',
      tradeCmdAdd: {
        label: '',
        command: '',
        close: false
      },
      settings: {
        hotkey: {
          simplehotkey: cfg.get(
            Config.simplehotkey,
            Config.default.simplehotkey
          ),
          simplehotkeyenabled: cfg.get(
            Config.simplehotkeyenabled,
            Config.default.simplehotkeyenabled
          ),
          advancedhotkey: cfg.get(
            Config.advancedhotkey,
            Config.default.advancedhotkey
          ),
          advancedhotkeyenabled: cfg.get(
            Config.advancedhotkeyenabled,
            Config.default.advancedhotkeyenabled
          ),
          wikihotkey: cfg.get(Config.wikihotkey, Config.default.wikihotkey),
          wikihotkeyenabled: cfg.get(
            Config.wikihotkeyenabled,
            Config.default.wikihotkeyenabled
          ),
          quickpaste: cfg.get(Config.quickpaste, Config.default.quickpaste),
          quickpastemod: cfg.get(
            Config.quickpastemod,
            Config.default.quickpastemod
          ),
          cscroll: cfg.get(Config.cscroll, Config.default.cscroll)
        },
        pricecheck: {
          league: cfg.get(Config.league, Config.default.league),
          displaylimit: cfg.get(
            Config.displaylimit,
            Config.default.displaylimit
          ),
          corruptoverride: cfg.get(
            Config.corruptoverride,
            Config.default.corruptoverride
          ),
          corruptsearch: cfg.get(
            Config.corruptsearch,
            Config.default.corruptsearch
          ),
          primarycurrency: cfg.get(
            Config.primarycurrency,
            Config.default.primarycurrency
          ),
          secondarycurrency: cfg.get(
            Config.secondarycurrency,
            Config.default.secondarycurrency
          ),
          onlineonly: cfg.get(Config.onlineonly, Config.default.onlineonly),
          buyoutonly: cfg.get(Config.buyoutonly, Config.default.buyoutonly),
          removedupes: cfg.get(Config.removedupes, Config.default.removedupes),
          poeprices: cfg.get(Config.poeprices, Config.default.poeprices),
          prefillmin: cfg.get(Config.prefillmin, Config.default.prefillmin),
          prefillmax: cfg.get(Config.prefillmax, Config.default.prefillmax),
          prefillrange: cfg.get(
            Config.prefillrange,
            Config.default.prefillrange
          ),
          prefillnormals: cfg.get(
            Config.prefillnormals,
            Config.default.prefillnormals
          ),
          prefillpseudos: cfg.get(
            Config.prefillpseudos,
            Config.default.prefillpseudos
          ),
          prefillilvl: cfg.get(Config.prefillilvl, Config.default.prefillilvl),
          prefillbase: cfg.get(Config.prefillbase, Config.default.prefillbase)
        },
        client: {
          logpath: clientfile
        },
        macros: {
          list: macros
        },
        tradeui: {
          enabled: cfg.get(Config.tradeui, Config.default.tradeui),
          tradebar: cfg.get(Config.tradebar, Config.default.tradebar),
          charname: cfg.get(Config.tradecharname, Config.default.tradecharname),
          highlight: cfg.get(
            Config.tradestashhighlight,
            Config.default.tradestashhighlight
          ),
          quad: cfg.get(Config.tradestashquad, Config.default.tradestashquad),
          incoming: cfg.get(
            Config.tradeuiincoming,
            Config.default.tradeuiincoming
          ),
          outgoing: cfg.get(
            Config.tradeuioutgoing,
            Config.default.tradeuioutgoing
          )
        }
      }
    };
  },

  methods: {
    openMacroDialog() {
      this.macroAdd.name = '';
      this.macroAdd.key = '';
      this.macroAdd.type = '';
      this.macroAdd.command = '';

      this.macroDialog = true;
    },
    addMacro() {
      if (
        this.macroAdd.name &&
        this.macroAdd.key &&
        this.macroAdd.type &&
        this.macroAdd.command
      ) {
        this.settings.macros.list.push({ ...this.macroAdd });
      }

      this.macroAdd.name = '';
      this.macroAdd.key = '';
      this.macroAdd.type = '';
      this.macroAdd.command = '';
    },
    deleteMacro(key: string) {
      this.settings.macros.list = this.settings.macros.list.filter((e: any) => {
        return e.name != key;
      });
    },
    openTradeCmdDialog(type: string) {
      this.tradeCmdAddType = type;
      this.tradeCmdAdd.label = '';
      this.tradeCmdAdd.command = '';
      this.tradeCmdAdd.close = false;

      this.tradeCmdDialog = true;
    },
    addTradeCmd(type: string) {
      if (this.tradeCmdAdd.label && this.tradeCmdAdd.command) {
        if (type == 'incoming') {
          this.settings.tradeui.incoming.push({ ...this.tradeCmdAdd });
        } else {
          this.settings.tradeui.outgoing.push({ ...this.tradeCmdAdd });
        }
      }

      this.tradeCmdAdd.label = '';
      this.tradeCmdAdd.command = '';
      this.tradeCmdAdd.close = false;
    },
    deleteTradeCmd(label: string, type: string) {
      if (type == 'incoming') {
        this.settings.tradeui.incoming = this.settings.tradeui.incoming.filter(
          (e: any) => {
            return e.label != label;
          }
        );
      } else {
        this.settings.tradeui.outgoing = this.settings.tradeui.outgoing.filter(
          (e: any) => {
            return e.label != label;
          }
        );
      }
    },
    saveSettings() {
      const settings = this.settings;

      // hotkeys
      cfg.set(Config.simplehotkey, settings.hotkey.simplehotkey);
      cfg.set(Config.simplehotkeyenabled, settings.hotkey.simplehotkeyenabled);
      cfg.set(Config.advancedhotkey, settings.hotkey.advancedhotkey);
      cfg.set(
        Config.advancedhotkeyenabled,
        settings.hotkey.advancedhotkeyenabled
      );
      cfg.set(Config.wikihotkey, settings.hotkey.wikihotkey);
      cfg.set(Config.wikihotkeyenabled, settings.hotkey.wikihotkeyenabled);
      cfg.set(Config.quickpaste, settings.hotkey.quickpaste);
      cfg.set(Config.quickpastemod, settings.hotkey.quickpastemod);
      cfg.set(Config.cscroll, settings.hotkey.cscroll);

      // price check
      cfg.set(Config.league, settings.pricecheck.league);
      cfg.set(Config.displaylimit, settings.pricecheck.displaylimit);
      cfg.set(Config.corruptoverride, settings.pricecheck.corruptoverride);
      cfg.set(Config.corruptsearch, settings.pricecheck.corruptsearch);
      cfg.set(Config.primarycurrency, settings.pricecheck.primarycurrency);
      cfg.set(Config.secondarycurrency, settings.pricecheck.secondarycurrency);
      cfg.set(Config.onlineonly, settings.pricecheck.onlineonly);
      cfg.set(Config.buyoutonly, settings.pricecheck.buyoutonly);
      cfg.set(Config.removedupes, settings.pricecheck.removedupes);
      cfg.set(Config.poeprices, settings.pricecheck.poeprices);
      cfg.set(Config.prefillmin, settings.pricecheck.prefillmin);
      cfg.set(Config.prefillmax, settings.pricecheck.prefillmax);
      cfg.set(Config.prefillrange, settings.pricecheck.prefillrange);
      cfg.set(Config.prefillnormals, settings.pricecheck.prefillnormals);
      cfg.set(Config.prefillpseudos, settings.pricecheck.prefillpseudos);
      cfg.set(Config.prefillilvl, settings.pricecheck.prefillilvl);
      cfg.set(Config.prefillbase, settings.pricecheck.prefillbase);

      cfg.set(Config.macros, settings.macros.list);

      // notify hotkey change
      ipcRenderer.send('hotkeys-changed');

      // notify client log change
      const origclient = cfg.get(
        Config.clientlogpath,
        Config.default.clientlogpath
      );

      if (settings.client.logpath) {
        const logpath = settings.client.logpath.path;
        cfg.set(Config.clientlogpath, logpath);

        if (origclient != logpath) {
          ipcRenderer.send('clientlog-changed', logpath);
        }
      } else {
        // null/cleared
        cfg.set(Config.clientlogpath, '');

        if (origclient) {
          ipcRenderer.send('clientlog-changed', '');
        }
      }

      // trade ui
      cfg.set(Config.tradeui, settings.tradeui.enabled);
      cfg.set(Config.tradebar, settings.tradeui.tradebar);
      cfg.set(Config.tradecharname, settings.tradeui.charname);
      cfg.set(Config.tradestashhighlight, settings.tradeui.highlight);
      cfg.set(Config.tradestashquad, settings.tradeui.quad);
      cfg.set(Config.tradeuiincoming, settings.tradeui.incoming);
      cfg.set(Config.tradeuioutgoing, settings.tradeui.outgoing);

      ipcRenderer.send('tradeui-enabled', settings.tradeui.enabled);
      ipcRenderer.send('set-stash-highlight', settings.tradeui.highlight);

      this.$q.notify({
        color: 'green',
        message: 'Settings saved!',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
        timeout: 2500
      });
    },
    closeApp() {
      const win = this.$q.electron.remote.getCurrentWindow();

      if (win) {
        win.close();
      }
    },
    openKeyRef() {
      this.$q.electron.remote.shell.openExternal(
        'https://www.electronjs.org/docs/api/accelerator'
      );
    }
  }
});
</script>

<style>
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #888;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
