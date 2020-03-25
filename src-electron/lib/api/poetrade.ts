/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
// official PoE Trade Site search api
import { shell, dialog } from 'electron';
import cfg from 'electron-cfg';
import Config from '../config';
import { ItemParser } from '../itemparser';
import { PTA } from '../pta';
import * as poeprices from './poeprices';
import log from 'electron-log';
import axios from 'axios';
import merge from 'lodash.merge';
import apis from '../../lib/api/apis';

function processPriceResults(
  response: any,
  event: Electron.IpcMainEvent,
  searchoptions: any,
  forcetab: boolean,
  exchange = false
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
    let url = apis.official.trade.fetch + codes + '?query=' + response['id'];

    if (exchange) {
      url += '&exchange';
    }

    urls.push(axios.get(url));
    n = n + 10;
  }

  const rdat = {
    result: [],
    options: searchoptions,
    forcetab: forcetab,
    exchange: exchange
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

function doCurrencySearch(event: Electron.IpcMainEvent, item: Item) {
  const itemparser = ItemParser.getInstance();

  const query = {
    exchange: {
      status: {
        option: 'online'
      },
      have: [] as string[],
      want: [] as string[]
    }
  };

  let p_curr = cfg.get(Config.primarycurrency, Config.default.primarycurrency);
  let s_curr = cfg.get(
    Config.secondarycurrency,
    Config.default.secondarycurrency
  );

  // Reset setting that no longer exists
  if (!itemparser.currencies.has(p_curr)) {
    p_curr = Config.default.primarycurrency;
    cfg.set(Config.primarycurrency, p_curr);
  }

  if (!itemparser.currencies.has(s_curr)) {
    s_curr = Config.default.secondarycurrency;
    cfg.set(Config.secondarycurrency, s_curr);
  }

  // Check for existing currencies
  if (!itemparser.exchange.has(item.type)) {
    dialog.showErrorBox(
      'Currency Error',
      'Could not find this currency in the database. If you believe that this is a mistake, please file a bug report on GitHub.'
    );

    log.warn('Currency not found:', item.type);
    log.warn(
      'If you believe that this is a mistake, please file a bug report on GitHub.'
    );
    return;
  }

  const url = apis.official.trade.exchange + PTA.getInstance().getLeague();

  const want = itemparser.exchange.get(item.type) as string;
  let have = p_curr;

  if (want == p_curr) {
    have = s_curr;
  }

  query.exchange.want.push(want);

  const urls = [];

  query.exchange.have.push(have);

  urls.push(axios.post(url, query));

  if (have != s_curr && want != s_curr) {
    have = s_curr;

    query.exchange.have.pop();
    query.exchange.have.push(have);

    urls.push(axios.post(url, query));
  }

  axios.all(urls).then(results => {
    results.some(resp => {
      const data = resp.data;

      if ('result' in data && 'id' in data) {
        processPriceResults(data, event, null, true, true);
        return true;
      }

      return false;
    });
  });
}

export function searchItemWithDefaults(
  event: Electron.IpcMainEvent,
  item: Item
) {
  const itemparser = ItemParser.getInstance();
  const league = PTA.getInstance().getLeague();

  // If its a currency and the currency is listed in the bulk exchange, try that first
  // Otherwise, try a regular search
  if (item.category == 'currency' && itemparser.exchange.has(item.type)) {
    doCurrencySearch(event, item);
    return;
  }

  // poeprices.info
  const usepoeprices = cfg.get(Config.poeprices, Config.default.poeprices);

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
        children: [{ label: league }]
      }
    ]
  } as any;

  let isUniqueBase = false;
  let searchToken = '';

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

  // Search by type if rare map, or if it has no name
  if ((item.category == 'map' && item.rarity == 'Rare') || item.name == null) {
    isUniqueBase = itemparser.uniques.has(item.type);
    searchToken = item.type;
  } else {
    isUniqueBase = itemparser.uniques.has(item.name);
    searchToken = item.name;
  }

  // Force rarity if unique
  if (item.rarity == 'Unique') {
    const rarity = item.rarity.toLowerCase();

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
  }

  // Force category
  if ('category' in item && item.category) {
    const category = item.category.toLowerCase();

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

  // Check for unique items
  if (isUniqueBase) {
    const range = itemparser.uniques.get(searchToken);
    for (const entry of range) {
      // If has discriminator, match discriminator and type
      if (item.misc?.disc) {
        if (entry['disc'] == item.misc.disc && entry['type'] == item.type) {
          if ('name' in entry) {
            query.query['name'] = {
              discriminator: entry['disc'],
              option: entry['name']
            };
          }

          query.query['type'] = {
            discriminator: entry['disc'],
            option: entry['type']
          };

          break;
        }
      } else if (entry['type'] == item.type) {
        // For everything else, just match type
        query.query['type'] = entry['type'];

        if ('name' in entry) {
          query.query['name'] = entry['name'];
        }

        break;
      }
    }

    // Default Gem options
    if (item.category == 'gem' && item.misc?.gemlevel) {
      query.query = merge(query.query, {
        filters: {
          misc_filters: {
            filters: {
              gem_level: {
                min: item.misc.gemlevel
              },
              quality: {
                min: item.quality
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Gem',
        children: [
          { label: 'Level', children: [{ label: item.misc.gemlevel }] },
          { label: 'Quality', children: [{ label: item.quality + '%' }] }
        ]
      });
    }

    // Default socket options
    if (item.sockets && item.sockets.total == 6) {
      query.query = merge(query.query, {
        filters: {
          socket_filters: {
            filters: {
              sockets: {
                min: item.sockets.total
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Sockets',
        children: [{ label: item.sockets.total }]
      });
    }

    // Default link options
    if (item.sockets && item.sockets.links > 4) {
      query.query = merge(query.query, {
        filters: {
          socket_filters: {
            filters: {
              links: {
                min: item.sockets.links
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Links',
        children: [{ label: item.sockets.links }]
      });
    }

    // Force iLvl
    if (item.rarity != 'Unique' && item.category != 'card' && item.ilvl) {
      query.query = merge(query.query, {
        filters: {
          misc_filters: {
            filters: {
              ilvl: {
                min: item.ilvl
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Item Level',
        children: [{ label: item.ilvl }]
      });
    }

    // Force map tier
    if (item.category == 'map' && item.misc?.maptier) {
      query.query = merge(query.query, {
        filters: {
          map_filters: {
            filters: {
              map_tier: {
                min: item.misc.maptier
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Map Tier',
        children: [{ label: item.misc.maptier }]
      });
    }

    // Note discriminator
    if (item.misc?.disc) {
      sopts.children.push({
        label: 'Discriminator',
        children: [{ label: item.misc.disc }]
      });
    }

    // Force Influences
    if (item.category != 'card' && item.influences) {
      const inflist = [] as any[];

      for (const i of item.influences) {
        const inf = i;
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

      if (inflist.length > 0) {
        sopts.children.push({ label: 'Influences', children: [...inflist] });
      }
    }

    // Force Synthesis
    if (item.misc?.synthesis) {
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

    // Default corrupt options
    const corruptoverride = cfg.get(
      Config.corruptoverride,
      Config.default.corruptoverride
    );

    // No such thing as corrupted cards or prophecies
    if (item.category != 'card' && item.category != 'prophecy') {
      if (corruptoverride) {
        const corrupt = cfg.get(
          Config.corruptsearch,
          Config.default.corruptsearch
        );

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

        sopts.children.push({
          label: 'Corrupted',
          children: [{ label: corrupt + ' (override)' }]
        });
      } else {
        const corrupt = item.corrupted ?? false;

        query.query = merge(query.query, {
          filters: {
            misc_filters: {
              filters: {
                corrupted: {
                  option: corrupt
                }
              }
            }
          }
        });

        sopts.children.push({
          label: 'Corrupted',
          children: [{ label: corrupt ? 'Yes' : 'No' }]
        });
      }
    }

    sopts.children.push({ label: 'Mods ignored' });

    const opttree = [sopts];

    const url = apis.official.trade.search + league;

    axios.post(url, query).then((response: any) => {
      const resp = response.data;

      if (!('result' in resp) || !('id' in resp)) {
        event.reply('error', 'Error querying trade site');
        log.warn('PoE API: Error querying trade API');
        log.warn('PoE API: Site responded with', resp);
        return;
      }

      processPriceResults(resp, event, opttree, true);
    });
  } else {
    if (usepoeprices && item.rarity != 'Magic') {
      // poeprices.info
      poeprices.searchPoePricesInfo(event, item);
    } else if (item.filters && Object.keys(item.filters).length > 0) {
      event.reply('forcetab', 'mods');
    } else {
      event.reply('error', 'Price check is not available for this item type');
    }

    // XXX: potentially add more apis
  }
}

export function searchItemWithOptions(
  event: Electron.IpcMainEvent,
  item: Item,
  options: any,
  openbrowser: boolean
) {
  //
  if (
    item.filters == null ||
    !Object.keys(item.filters).length ||
    item.category == 'map'
  ) {
    // Cannot advanced search items with no filters
    return false;
  }

  if (item.unidentified) {
    return false;
  }

  const league = PTA.getInstance().getLeague();

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
        children: [{ label: league }]
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

  if (item.name) {
    isUniqueBase = itemparser.uniques.has(item.name);
    searchToken = item.name;
  } else {
    isUniqueBase = itemparser.uniques.has(item.type);
    searchToken = item.type;
  }

  // Force rarity
  let rarity = 'nonunique';

  if (item.rarity == 'Unique') {
    rarity = item.rarity.toLowerCase();
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
  if (item.category) {
    const category = item.category.toLowerCase();

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
  let mods = {} as { [index: string]: Filter };

  if (item.filters) {
    mods = merge(mods, item.filters);
  }

  if (item.pseudos) {
    mods = merge(mods, item.pseudos);
  }

  const mflt = [] as any[];

  for (const [k, e] of Object.entries<Filter>(mods)) {
    // set id
    e.id = k;

    if (e.enabled == true) {
      e.disabled = false;
      delete e.enabled;
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
      if (entry['type'] == item.type) {
        query.query['type'] = entry['type'];

        if ('name' in entry) {
          query.query['name'] = entry['name'];
        }

        break;
      }
    }
  }

  // Use sockets
  if (options['usesockets'] && item.sockets) {
    query.query = merge(query.query, {
      filters: {
        socket_filters: {
          filters: {
            sockets: {
              min: item.sockets.total
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Sockets',
      children: [{ label: item.sockets.total }]
    });
  }

  // Use links
  if (options['uselinks'] && item.sockets) {
    query.query = merge(query.query, {
      filters: {
        socket_filters: {
          filters: {
            links: {
              min: item.sockets.links
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Links',
      children: [{ label: item.sockets.links }]
    });
  }

  // Use iLvl
  if (options['useilvl'] && item.ilvl) {
    query.query = merge(query.query, {
      filters: {
        misc_filters: {
          filters: {
            ilvl: {
              min: item.ilvl
            }
          }
        }
      }
    });

    sopts.children.push({
      label: 'Item Level',
      children: [{ label: item.ilvl }]
    });
  }

  // Use item base
  if (options['useitembase']) {
    query.query['type'] = item.type;
    sopts.children.push({
      label: 'Item Base',
      children: [{ label: item.type }]
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

  const url = apis.official.trade.search + league;

  axios.post(url, query).then((response: any) => {
    const resp = response.data;

    if (!('result' in resp) || !('id' in resp)) {
      log.warn('PoE API: Error querying trade API');
      log.warn('PoE API: Site responded with', resp);
      event.reply('error', 'Error querying trade site');
      return;
    }

    if (openbrowser) {
      const burl = apis.official.trade.site + league + '/' + resp['id'];
      shell.openExternal(burl);
      return;
    }

    processPriceResults(resp, event, opttree, true);
  });
}
