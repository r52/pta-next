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
import { defineComponent, PropType } from '@vue/composition-api';

function getRelTime(t1: number, t2: number) {
  let dif = t1 - t2;

  // convert to seconds
  dif = Math.floor(dif / 1000);

  if (dif < 60) return dif.toString() + ' seconds';

  // minutes
  if (dif < 3600) return Math.floor(dif / 60).toString() + ' minutes';

  if (dif < 86400) return Math.floor(dif / 3600).toString() + ' hours';

  return Math.floor(dif / 86400).toString() + ' days';
}

function parseListings(type: string, results: PoETradeListing[]) {
  const lst: PriceListing[] = [];
  const now = Date.now();

  results.forEach((entry: PoETradeListing) => {
    const obj = {} as PriceListing;

    // name
    obj.name = entry.listing.account.name;

    // price
    if (
      type == 'exchange' &&
      entry.listing.price.item != null &&
      entry.listing.price.exchange != null
    ) {
      const irate = {
        amount: entry.listing.price.item.amount,
        currency: entry.listing.price.item.currency
      } as PriceRate;

      const erate = {
        amount: entry.listing.price.exchange.amount,
        currency: entry.listing.price.exchange.currency
      } as PriceRate;

      obj.price = {
        irate: irate,
        erate: erate
      };

      // rate
      const rate = irate.amount / erate.amount;
      obj.rate =
        rate.toPrecision(3) + ' ' + irate.currency + '/' + erate.currency;
    } else {
      const amount = entry.listing.price.amount;
      const currency = entry.listing.price.currency;

      obj.price = {
        amount: amount,
        currency: currency
      };
    }

    // specials
    if (type == 'gem') {
      // quality/level
      let q = '0%';
      let lvl = '1';
      const prop = entry.item.properties;

      for (const p of prop) {
        if (p.name == 'Quality') {
          const val = p.values[0][0] as string;
          q = val.replace(/^\D+/g, '');
        }

        if (p.name == 'Level') {
          lvl = p.values[0][0] as string;
        }
      }

      obj.quality = q;
      obj.level = lvl;
    }

    // age
    obj.age = getRelTime(now, Date.parse(entry['listing']['indexed']));

    lst.push(obj);
  });

  return lst;
}

const columnTable = {
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

export default defineComponent({
  name: 'Results',

  props: {
    item: {
      type: Object as PropType<Item>,
      required: true
    },
    results: {
      type: Object as PropType<PoETradeResults>,
      required: true
    }
  },

  setup(props, ctx) {
    const pagination = { rowsPerPage: 10 };

    let type = 'default';

    if (props.item.category == 'gem') {
      type = 'gem';
    }

    if (props.results.exchange) {
      type = 'exchange';
    }

    const columns = columnTable[type];

    const listings = parseListings(type, props.results.result);

    function openInBrowser() {
      ctx.root.$q.electron.remote.shell.openExternal(props.results.siteurl);
    }

    return {
      pagination,
      columns,
      listings,
      openInBrowser
    };
  }
});
</script>
