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

<script>
export default {
  name: 'Prediction',

  props: {
    prediction: Object
  },

  computed: {
    listings() {
      const lst = [];
      this.prediction.pred_explanation.forEach(entry => {
        const obj = {};
        obj['name'] = entry[0];
        obj['contrib'] = (entry[1] * 100.0).toPrecision(4);
        lst.push(obj);
      });
      return lst;
    }
  },

  data() {
    return {
      columns: [
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
      ],
      pagination: {
        rowsPerPage: 10
      }
    };
  }
};
</script>

<style scoped>
.price {
  color: #a38d6d;
}
</style>
