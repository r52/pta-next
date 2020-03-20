<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-avatar>
          <img src="statics/icon.png" />
        </q-avatar>
        <q-toolbar-title>
          Settings
        </q-toolbar-title>

        <q-btn flat round dense icon="close" @click="closeApp" />
      </q-toolbar>

      <q-tabs v-model="tab">
        <q-tab name="hotkey" icon="space_bar" label="Hotkey" />
        <q-tab name="price" icon="shop" label="Price Check" />
      </q-tabs>
    </q-header>
    <q-footer>
      <q-toolbar>
        <q-space />
        <q-btn label="Save" color="green" @click="saveSettings()" />
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="hotkey">
          <div class="text-h6">Hotkey</div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>

        <q-tab-panel name="price">
          <q-card>
            <q-card-section>
              <div class="text-h6">Price Check</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-select
                v-model="settings.league"
                :options="leagues"
                label="League"
                map-options
              />
              <div class="row items-center">
                <div class="col">
                  <q-toggle
                    v-model="settings.corruptoverride"
                    label="Corrupt Override"
                  />
                </div>
                <div class="col">
                  <q-select
                    v-model="settings.corruptsearch"
                    :options="corrupts"
                    label="Corrupt Override Option"
                    :disable="!settings.corruptoverride"
                    style="width: 250px"
                  />
                </div>
              </div>

              <q-select
                v-model="settings.primarycurrency"
                :options="currencies"
                label="Primary Currency"
                map-options
              />

              <q-select
                v-model="settings.secondarycurrency"
                :options="currencies"
                label="Secondary Currency"
                map-options
              />

              <q-slider
                v-model="settings.displaylimit"
                :min="0"
                :max="100"
                :step="10"
                label
                :label-value="'Max results: ' + settings.displaylimit"
              />

              <q-toggle v-model="settings.onlineonly" label="Online Only" />
              <q-toggle v-model="settings.buyoutonly" label="Buyout Only" />
              <q-toggle
                v-model="settings.removedupes"
                label="Remove duplicates from the same account"
              />
            </q-card-section>
          </q-card>
          <q-card>
            <q-card-section>
              <div class="text-h6">Pre-Selected Options</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-toggle
                v-model="settings.prefillmin"
                label="Pre-fill minimums"
              />
              <q-toggle
                v-model="settings.prefillmax"
                label="Pre-fill maximums"
              />
              <q-slider
                v-model="settings.prefillrange"
                :min="0"
                :max="100"
                :step="5"
                label
                :label-value="'Pre-fill range (+/-%): ' + settings.prefillrange"
              />
              <q-toggle
                v-model="settings.prefillnormals"
                label="Pre-fill normal mods"
              />
              <q-toggle
                v-model="settings.prefillpseudos"
                label="Pre-fill pseudo mods"
              />
              <q-toggle v-model="settings.prefillilvl" label="Pre-fill iLvl" />
              <q-toggle
                v-model="settings.prefillbase"
                label="Pre-fill Item Base"
              />
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import cfg from 'electron-cfg';
import Config from '../../src-electron/lib/config';

export default {
  name: 'Settings',

  data() {
    let leagues = this.$q.electron.remote.getGlobal('pta').leagues;

    leagues = leagues.map((lg, idx) => {
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

    return {
      tab: 'hotkey',
      leagues: Object.freeze(leagues),
      corrupts: ['Any', 'Yes', 'No'],
      currencies: Object.freeze(currencies),
      settings: {
        league: cfg.get(Config.league, Config.default.league),
        displaylimit: cfg.get(Config.displaylimit, Config.default.displaylimit),
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
        prefillmin: cfg.get(Config.prefillmin, Config.default.prefillmin),
        prefillmax: cfg.get(Config.prefillmax, Config.default.prefillmax),
        prefillrange: cfg.get(Config.prefillrange, Config.default.prefillrange),
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
      }
    };
  },

  methods: {
    saveSettings() {
      const settings = this.settings;

      cfg.set(Config.league, settings.league);
      cfg.set(Config.displaylimit, settings.displaylimit);
      cfg.set(Config.corruptoverride, settings.corruptoverride);
      cfg.set(Config.corruptsearch, settings.corruptsearch);
      cfg.set(Config.primarycurrency, settings.primarycurrency);
      cfg.set(Config.secondarycurrency, settings.secondarycurrency);
      cfg.set(Config.onlineonly, settings.onlineonly);
      cfg.set(Config.buyoutonly, settings.buyoutonly);
      cfg.set(Config.removedupes, settings.removedupes);
      cfg.set(Config.prefillmin, settings.prefillmin);
      cfg.set(Config.prefillmax, settings.prefillmax);
      cfg.set(Config.prefillrange, settings.prefillrange);
      cfg.set(Config.prefillnormals, settings.prefillnormals);
      cfg.set(Config.prefillpseudos, settings.prefillpseudos);
      cfg.set(Config.prefillilvl, settings.prefillilvl);
      cfg.set(Config.prefillbase, settings.prefillbase);

      this.$q.notify({
        color: 'green',
        message: 'Settings saved!',
        position: 'top',
        actions: [{ icon: 'close', color: 'white' }],
        timeout: 2500
      });
    },
    closeApp() {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getFocusedWindow().close();
      }
    }
  }
};
</script>
