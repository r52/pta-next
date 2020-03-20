<template>
  <q-page padding>
    <div>
      <q-tree
        v-if="results.options"
        :nodes="results.options"
        node-key="label"
        no-connectors
      />

      <q-table
        :data="listings"
        :columns="columns"
        row-key="name"
        no-data-label="I didn't find anything for you"
        :pagination.sync="pagination"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
export default {
  name: 'Results',

  props: {
    item: Object,
    results: Object
  },

  data() {
    return {
      pagination: {
        rowsPerPage: 10
      }
    };
  },

  computed: {
    type() {
      let type = 'default';

      if (this.item.category == 'gem') {
        type = 'gem';
      }

      if (this.results.exchange) {
        type = 'exchange';
      }

      return type;
    },
    columns() {
      const columns = {
        default: [
          {
            label: 'Account Name',
            align: 'left',
            sortable: false,
            name: 'name',
            field: 'name'
          },
          {
            label: 'Price',
            sortable: false,
            name: 'price',
            field: 'price'
          },
          {
            label: 'Age',
            sortable: false,
            name: 'age',
            field: 'age'
          }
        ],
        gem: [
          {
            label: 'Account Name',
            align: 'start',
            sortable: false,
            name: 'name',
            field: 'name'
          },
          {
            label: 'Price',
            sortable: false,
            name: 'price',
            field: 'price'
          },
          {
            label: 'Q%',
            sortable: false,
            name: 'quality',
            field: 'quality'
          },
          {
            label: 'Lvl',
            sortable: false,
            name: 'level',
            field: 'level'
          },
          {
            label: 'Age',
            sortable: false,
            name: 'age',
            field: 'age'
          }
        ],
        exchange: [
          {
            label: 'Account Name',
            align: 'start',
            sortable: false,
            name: 'name',
            field: 'name'
          },
          {
            label: 'Price',
            sortable: false,
            name: 'price',
            field: 'price'
          },
          {
            label: 'Rate',
            sortable: false,
            name: 'rate',
            field: 'rate'
          },
          {
            label: 'Age',
            sortable: false,
            name: 'age',
            field: 'age'
          }
        ]
      };

      return columns[this.type];
    },
    listings() {
      const lst = [];
      const now = this.now();
      const type = this.type;

      this.results.result.forEach(entry => {
        const obj = {} as any;

        // name
        obj['name'] = entry['listing']['account']['name'];

        // price
        if (type == 'exchange') {
          const irate =
            entry['listing']['price']['item']['amount'].toString() +
            ' ' +
            entry['listing']['price']['item']['currency'];
          const erate =
            entry['listing']['price']['exchange']['amount'].toString() +
            ' ' +
            entry['listing']['price']['exchange']['currency'];

          obj['price'] = irate + ' <= ' + erate;
        } else {
          const amount = entry['listing']['price']['amount'];
          const currency = entry['listing']['price']['currency'];

          obj['price'] = amount.toString() + ' ' + currency;
        }

        // specials
        if (type == 'exchange') {
          // rate
          const rate =
            entry['listing']['price']['item']['amount'] /
            entry['listing']['price']['exchange']['amount'];
          const ic = entry['listing']['price']['item']['currency'];
          const ec = entry['listing']['price']['exchange']['currency'];
          obj['rate'] = rate.toPrecision(3) + ' ' + ic + '/' + ec;
        }

        if (type == 'gem') {
          // quality/level
          let q = '0%';
          let lvl = '1';
          const prop = entry['item']['properties'];

          for (const p of prop) {
            if (p['name'] == 'Quality') {
              const val = p['values'][0][0];
              q = val.replace(/^\D+/g, '');
            }

            if (p['name'] == 'Level') {
              lvl = p['values'][0][0];
            }
          }

          obj['quality'] = q;
          obj['level'] = lvl;
        }

        // age
        obj['age'] = this.getRelTime(
          now,
          Date.parse(entry['listing']['indexed'])
        );

        lst.push(obj);
      });

      return lst;
    }
  },

  methods: {
    now() {
      return Date.now();
    },
    getRelTime(t1: number, t2: number) {
      let dif = t1 - t2;

      // convert to seconds
      dif = Math.floor(dif / 1000);

      if (dif < 60) return dif.toString() + ' seconds';

      // minutes
      if (dif < 3600) return Math.floor(dif / 60).toString() + ' minutes';

      if (dif < 86400) return Math.floor(dif / 3600).toString() + ' hours';

      return Math.floor(dif / 86400).toString() + ' days';
    }
  }
};
</script>
