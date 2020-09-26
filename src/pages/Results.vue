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
        :pagination="pagination"
      >
        <template v-slot:body-cell-price="props">
          <q-td :props="props">
            <div v-if="props.value.irate">
              {{ props.value.irate.amount }}
              <img
                :src="`images/${props.value.irate.currency}.png`"
                style="height: 25px; max-width: 25px; vertical-align: middle;"
                class="q-py-none"
              />
              &lt;= {{ props.value.erate.amount }}
              <img
                :src="`images/${props.value.erate.currency}.png`"
                style="height: 25px; max-width: 25px; vertical-align: middle;"
                class="q-py-none"
              />
            </div>
            <div v-else>
              {{ props.value.amount }} {{ props.value.currency }}
              <img
                :src="`images/${props.value.currency}.png`"
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
        @click="openBrowser(results.siteurl)"
      >
        Op<u>e</u>n Results on pathofexile.com
      </q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { getElapsedTime } from '../functions/util';
import { useElectronUtil } from '../functions/context';

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
    obj.age = getElapsedTime(now, Date.parse(entry.listing.indexed));

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
} as {
  [index: string]: {
    label: string;
    sortable: boolean;
    name: string;
    field: string;
    align?: string;
  }[];
};

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

    const { openBrowser } = useElectronUtil(ctx);

    return {
      pagination,
      columns,
      listings,
      openBrowser
    };
  }
});
</script>
