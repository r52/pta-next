<template>
  <q-page padding>
    <div>
      <p class="text-h6 text-center">
        Price Prediction via poeprices.info
      </p>
      <p class="text-h6 text-center q-my-xs price">
        {{ prediction.min.toPrecision(4) }} ~
        {{ prediction.max.toPrecision(4) }} {{ prediction.currency }}
      </p>
      <p class="text-center q-my-xs">
        Confidence:
        {{ prediction.pred_confidence_score.toPrecision(4) }} %
      </p>
      <q-table
        :columns="columns"
        :data="listings"
        row-key="name"
        no-data-label="No Results"
        :pagination.sync="pagination"
      />
      <p class="text-center q-my-xs">Consider supporting poeprices.info</p>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

export default defineComponent({
  name: 'Prediction',

  props: {
    prediction: {
      type: Object as PropType<PoEPricesPrediction>,
      required: true
    }
  },

  setup(props) {
    const pagination = {
      rowsPerPage: 10
    };

    const columns = [
      {
        label: 'Mod',
        align: 'left',
        sortable: false,
        name: 'name',
        field: 'name'
      },
      {
        label: 'Contribution (%)',
        sortable: false,
        name: 'contrib',
        field: 'contrib'
      }
    ];

    const listings = computed(() => {
      const lst = [] as { name: string; contrib: string }[];
      props.prediction.pred_explanation.forEach(entry => {
        const obj = {
          name: entry[0] as string,
          contrib: ((entry[1] as number) * 100.0).toPrecision(4)
        };
        lst.push(obj);
      });
      return lst;
    });

    return {
      pagination,
      columns,
      listings
    };
  }
});
</script>

<style scoped>
.price {
  color: #a38d6d;
}
</style>
