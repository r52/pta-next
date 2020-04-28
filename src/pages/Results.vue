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
        no-data-label="No Results"
        :pagination.sync="pagination"
      >
        <template v-slot:body-cell-price="props">
          <q-td :props="props">
            <div v-if="props.value.irate">
              {{ props.value.irate.amount }}
              <img
                :src="`statics/images/${props.value.irate.currency}.png`"
                style="height: 25px; max-width: 25px; vertical-align: middle;"
                class="q-py-none"
              />
              &lt;= {{ props.value.erate.amount }}
              <img
                :src="`statics/images/${props.value.erate.currency}.png`"
                style="height: 25px; max-width: 25px; vertical-align: middle;"
                class="q-py-none"
              />
            </div>
            <div v-else>
              {{ props.value.amount }} {{ props.value.currency }}
              <img
                :src="`statics/images/${props.value.currency}.png`"
                style="height: 25px; max-width: 25px; vertical-align: middle;"
                class="q-py-none"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </div>
    <div class="row items-center justify-end q-py-xs">
      <q-btn
        color="purple"
        accesskey="e"
        icon="open_in_new"
        @click="openInBrowser"
      >
        Op<u>e</u>n Results on pathofexile.com
      </q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue';

export default Vue.extend({
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
    type(): string {
      let type = 'default';

      if (this.item.category == 'gem') {
        type = 'gem';
      }

      if (this.results.exchange) {
        type = 'exchange';
      }

      return type;
    },
    columns(): any[] {
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
      } as { [index: string]: any[] };

      return columns[this.type];
    },
    listings(): any[] {
      const lst: any[] = [];
      const now = this.now();
      const type = this.type;

      this.results.result.forEach((entry: any) => {
        const obj = {} as any;

        // name
        obj['name'] = entry['listing']['account']['name'];

        // price
        if (type == 'exchange') {
          const irate = {
            amount: entry['listing']['price']['item']['amount'],
            currency: entry['listing']['price']['item']['currency']
          };

          const erate = {
            amount: entry['listing']['price']['exchange']['amount'],
            currency: entry['listing']['price']['exchange']['currency']
          };

          obj['price'] = {
            irate: irate,
            erate: erate
          };
        } else {
          const amount = entry['listing']['price']['amount'];
          const currency = entry['listing']['price']['currency'];

          obj['price'] = {
            amount: amount,
            currency: currency
          };
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
    },
    openInBrowser() {
      this.$q.electron.remote.shell.openExternal(this.results.siteurl);
    }
  }
});
</script>
