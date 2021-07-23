<template>
  <div>
    <div class="bg-gray-500 top">
      <div class="flex">
        <div>
          <card>
            <card-section>
              <div class="text-xs text-white">
                Tab: T
              </div>
              <div class="text-xs text-white">
                left: 6, top: 9
              </div>
            </card-section>
          </card>
        </div>
        <div>
          <div class="text-3xl mt-2 mb-1">
            Resize and align this grid to your stash
          </div>
        </div>
      </div>
    </div>
    <div class="grid" />
  </div>
</template>

<script>
import Card from '/@/components/Card.vue';
import CardSection from '/@/components/CardSection.vue';

export default {
  name: 'StashSetup',
  components: {
    Card,
    CardSection,
  },
};
</script>

<style>
html {
  overflow-y: hidden !important;
}

body {
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
  border-style: solid;
  border-width: 2px;
}
</style>
