/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
// official PoE Trade Site search api
import { shell } from 'electron';
import cfg from 'electron-cfg';
import Config from '../../lib/config';
import { ItemParser } from '../../lib/itemparser';
import { PTA } from '../../lib/pta';
import log from 'electron-log';
import axios from 'axios';
import merge from 'lodash.merge';

const uTradeFetch = 'https://www.pathofexile.com/api/trade/fetch/';
const uTradeSearch = 'https://www.pathofexile.com/api/trade/search/';
const uTradeExchange = 'https://www.pathofexile.com/api/trade/exchange/';
const uTradeSite = 'https://www.pathofexile.com/trade/search/';

function processPriceResults(
  response: any,
  event: Electron.IpcMainEvent,
  searchoptions: any,
  forcetab: boolean
) {
  //
  const rlist = response['result'] as string[];

  const displaylimit = cfg.get(
    Config.displaylimit,
    Config.default.displaylimit
  );
  const removedupes = cfg.get(Config.removedupes, Config.default.removedupes);

  const urls = [];

  let n = 0;
  while (n < rlist.length && n < displaylimit) {
    const bucket = rlist.slice(n, n + 10);
    const codes = bucket.join(',');
    urls.push(axios.get(uTradeFetch + codes + '?query=' + response['id']));
    n = n + 10;
  }

  const rdat = {
    result: [],
    options: searchoptions,
    forcetab: forcetab
  };

  axios.all(urls).then(results => {
    results.forEach(resp => {
      const data = resp.data;
      const list = data['result'] as [];

      rdat.result.push(...list);
    });

    // Delete duplicate accounts
    const accounts = new Set<string>();
    if (removedupes) {
      rdat.result = rdat.result.filter(entry => {
        const acctname = entry['listing']['account']['name'];
        const isUnique = !accounts.has(acctname);

        if (isUnique) {
          accounts.add(acctname);
        }

        return isUnique;
      });
    }

    event.reply('results', rdat);
  });
}

export function searchItemWithOptions(
  event: Electron.IpcMainEvent,
  item: any,
  options: any,
  openbrowser: boolean
) {
  //
  if (
    !('filters' in item) ||
    !Object.keys(item['filters']).length ||
    item['category'] == 'map'
  ) {
    // Cannot advanced search items with no filters
    return null;
  }

  if ('unidentified' in item) {
    return null;
  }

  const query = {
    query: {
      status: {
        option: 'online'
      },
      stats: [
        {
          type: 'and',
          filters: []
        }
      ]
    },
    sort: {
      price: 'asc'
    }
  } as any;

  const sopts = {
    label: 'Search Options',
    children: [
      {
        label: 'League',
        children: [{ label: PTA.getInstance().getLeague() }]
      }
    ]
  } as any;

  // Take care of settings
  const onlineonly = cfg.get(Config.onlineonly, Config.default.onlineonly);
  if (!onlineonly) {
    query.query.status.option = 'any';
    sopts.children.push({ label: 'Online Only' });
  }

  const buyoutonly = cfg.get(Config.buyoutonly, Config.default.buyoutonly);
  if (buyoutonly) {
    query.query = merge(query.query, {
      filters: {
        trade_filters: {
          filters: {
            sale_type: {
              option: 'priced'
            }
          }
        }
      }
    });

    sopts.children.push({ label: 'Buyout Only' });
  }

  const itemparser = ItemParser.getInstance();

  let isUniqueBase = false;
  let searchToken: string;

  if ('name' in item) {
    isUniqueBase = itemparser.uniques.has(item['name']);
    searchToken = item['name'];
  } else {
    isUniqueBase = itemparser.uniques.has(item['type']);
    searchToken = item['type'];
  }

  // Force rarity
  let rarity = 'nonunique';

  if (item['rarity'] == 'Unique') {
    rarity = (item['rarity'] as string).toLowerCase();
  }

  query.query = merge(query.query, {
    filters: {
      type_filters: {
        filters: {
          rarity: {
            option: rarity
          }
        }
      }
    }
  });

  // Force category
  if ('category' in item && item['category']) {
    const category = (item['category'] as string).toLowerCase();

    query.query = merge(query.query, {
      filters: {
        type_filters: {
          filters: {
            category: {
              option: category
            }
          }
        }
      }
    });
  }

  // weapon/armour base mods
  ['pdps', 'edps', 'ar', 'ev', 'es'].forEach(bm => {
    if (options['use' + bm]['enabled']) {
      const filter =
        bm === 'pdps' || bm === 'edps' ? 'weapon_filters' : 'armour_filters';

      const flt = [] as any;

      ['min', 'max'].forEach(lm => {
        if (options['use' + bm][lm] > 0) {
          query.query = merge(query.query, {
            filters: {
              [filter]: {
                filters: {
                  [bm]: {
                    [lm]: options['use' + bm][lm]
                  }
                }
              }
            }
          });

          flt.push({
            label: lm,
            children: [{ label: options['use' + bm][lm] }]
          });
        }
      });

      if (flt.length) {
        sopts.children.push({ label: bm, children: [...flt] });
      }
    }
  });

  // Checked mods/pseudos
  let mods = {} as any;

  if ('filters' in item && item['filters']) {
    mods = merge(mods, item['filters']);
  }

  if ('pseudos' in item && item['pseudos']) {
    mods = merge(mods, item['pseudos']);
  }

  const mflt = [] as any;

  for (const [k, e] of Object.entries<any>(mods)) {
    // set id
    e['id'] = k;

    if (e['enabled'] == true) {
      e['disabled'] = false;
      delete e['enabled'];
      query.query['stats'][0]['filters'].push(e);

      const vflt = [] as any;

      ['min', 'max'].forEach(vl => {
        if (vl in e) {
          vflt.push({ label: vl, children: [{ label: e[vl] }] });
        }
      });

      if (vflt.length) {
        mflt.push({ label: e['text'], children: [...vflt] });
      }
    }
  }

  if (mflt.length) {
    sopts.children.push({ label: 'Mods', children: [...mflt] });
  }

  // Check for unique items
  if (isUniqueBase) {
    const range = itemparser.uniques.get(searchToken);
    for (const entry of range) {
      // For everything else, match type
      if (entry['type'] == item['type']) {
        query.query['type'] = entry['type'];

        if ('name' in entry) {
          query.query['name'] = entry['name'];
        }

        break;
      }
    }
  }

  // Use sockets
  if (options['usesockets']) {
    query.query = merge(query.query, {
      filters: {
        socket_filters: {
          filters: {
            sockets: {
              min: item['sockets']['total']
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Sockets',
      children: [{ label: item['sockets']['total'] }]
    });
  }

  // Use links
  if (options['uselinks']) {
    query.query = merge(query.query, {
      filters: {
        socket_filters: {
          filters: {
            links: {
              min: item['sockets']['links']
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Links',
      children: [{ label: item['sockets']['links'] }]
    });
  }

  // Use iLvl
  if (options['useilvl']) {
    query.query = merge(query.query, {
      filters: {
        misc_filters: {
          filters: {
            ilvl: {
              min: item['ilvl']
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Item Level',
      children: [{ label: item['ilvl'] }]
    });
  }

  // Use item base
  if (options['useitembase']) {
    query.query['type'] = item['type'];
    sopts.children.push({
      label: 'Item Base',
      children: [{ label: item['type'] }]
    });
  }

  // Influences

  if ('influences' in options && options['influences'].length) {
    const inflist = [] as any;

    for (const i of options['influences']) {
      const inf = i as string;
      const infkey = inf + '_item';

      query.query = merge(query.query, {
        filters: {
          misc_filters: {
            filters: {
              [infkey]: {
                option: true
              }
            }
          }
        }
      });

      inflist.push({ label: inf });
    }

    sopts.children.push({ label: 'Influences', children: [...inflist] });
  }

  // Synthesis
  if ('usesynthesisbase' in options && options['usesynthesisbase']) {
    query.query = merge(query.query, {
      filters: {
        misc_filters: {
          filters: {
            synthesised_item: {
              option: true
            }
          }
        }
      }
    });

    sopts.children.push({ label: 'Synthesis' });
  }

  // Corrupt
  if ('usecorrupted' in options) {
    const corrupt = options['usecorrupted'];

    if (corrupt != 'Any') {
      query.query = merge(query.query, {
        filters: {
          misc_filters: {
            filters: {
              corrupted: {
                option: corrupt == 'Yes'
              }
            }
          }
        }
      });
    }

    sopts.children.push({ label: 'Corrupted', children: [{ label: corrupt }] });
  }

  const opttree = [sopts];

  const league = PTA.getInstance().getLeague();

  const url = uTradeSearch + league;

  axios
    .post(url, query)
    .then((response: any) => {
      const resp = response.data;

      if (!('result' in resp) || !('id' in resp)) {
        log.warn('PoE API: Error querying trade API');
        log.warn('PoE API: Site responded with', resp);
        return;
      }

      if (openbrowser) {
        const burl = uTradeSite + league + '/' + resp['id'];
        shell.openExternal(burl);
        return;
      }

      processPriceResults(resp, event, opttree, true);
    })
    .catch((error: any) => {
      log.error(error);
    });
}
