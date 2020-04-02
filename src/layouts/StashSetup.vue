<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container>
      <q-page>
        <div class="q-electron-drag bg-grey-9 top">
          <div class="row">
            <div class="col-auto">
              <q-card class="q-ma-sm">
                <q-card-section>
                  <div class="text-caption">Tab: T</div>
                  <div class="text-caption text-grey">
                    left: 6, top: 9
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <div class="text-h5 q-mt-sm q-mb-xs">
                Resize and align this grid to your stash
              </div>
            </div>
          </div>
        </div>
        <div class="grid"></div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'StashSetup'
};
</script>

<style>
html {
  overflow-y: hidden !important;
}

body {
  background-color: #121212e6 !important;
}

.top {
  width: 100%;
  min-height: 120px;
}

.grid {
  width: 100%;
  min-height: calc(100vh - 120px);
  border-style: solid;
  border-width: 2px;
}
</style>
