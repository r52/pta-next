// official PoE Trade Site search api
import { shell } from 'electron';
import cfg from 'electron-cfg';
import Config from '../../lib/config';
import { ItemParser } from '../../lib/itemparser';
import { PTA } from '../../lib/pta';
import log from 'electron-log';
import axios from 'axios';

const uTradeFetch = 'https://www.pathofexile.com/api/trade/fetch/';
const uTradeSearch = 'https://www.pathofexile.com/api/trade/search/';
const uTradeExchange = 'https://www.pathofexile.com/api/trade/exchange/';
const uTradeSite = 'https://www.pathofexile.com/trade/search/';

function processPriceResults(
  response: any,
  event: Electron.IpcMainEvent,
  forcetab: boolean
) {
  //
  const rlist = response['result'] as string[];

  const removedupes = cfg.get(Config.removedupes, Config.default.removedupes);

  const urls = [];

  let n = 0;
  while (n < rlist.length) {
    const bucket = rlist.slice(n, n + 10);
    const codes = bucket.join(',');
    urls.push(axios.get(uTradeFetch + codes + '?query=' + response['id']));
    n = n + 10;
  }

  const rdat = {
    result: [],
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

  // Take care of settings
  const onlineonly = cfg.get(Config.onlineonly, Config.default.onlineonly);
  if (!onlineonly) {
    query.query.status.option = 'any';
  }

  const buyoutonly = cfg.get(Config.buyoutonly, Config.default.buyoutonly);
  if (buyoutonly) {
    query.query = Object.assign(query.query, {
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

  query.query = Object.assign(query.query, {
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

    query.query = Object.assign(query.query, {
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

  if (options['usepdps']['enabled']) {
    if (options['usepdps']['min'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          weapon_filters: {
            filters: {
              pdps: {
                min: options['usepdps']['min']
              }
            }
          }
        }
      });
    }

    if (options['usepdps']['max'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          weapon_filters: {
            filters: {
              pdps: {
                max: options['usepdps']['max']
              }
            }
          }
        }
      });
    }
  }

  if (options['useedps']['enabled']) {
    if (options['useedps']['min'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          weapon_filters: {
            filters: {
              edps: {
                min: options['useedps']['min']
              }
            }
          }
        }
      });
    }

    if (options['useedps']['max'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          weapon_filters: {
            filters: {
              edps: {
                max: options['useedps']['max']
              }
            }
          }
        }
      });
    }
  }

  if (options['usear']['enabled']) {
    if (options['usear']['min'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              ar: {
                min: options['usear']['min']
              }
            }
          }
        }
      });
    }

    if (options['usear']['max'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              ar: {
                max: options['usear']['max']
              }
            }
          }
        }
      });
    }
  }

  if (options['useev']['enabled']) {
    if (options['useev']['min'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              ev: {
                min: options['useev']['min']
              }
            }
          }
        }
      });
    }

    if (options['useev']['max'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              ev: {
                max: options['useev']['max']
              }
            }
          }
        }
      });
    }
  }

  if (options['usees']['enabled']) {
    if (options['usees']['min'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              es: {
                min: options['usees']['min']
              }
            }
          }
        }
      });
    }

    if (options['usees']['max'] > 0) {
      query.query = Object.assign(query.query, {
        filters: {
          armour_filters: {
            filters: {
              es: {
                max: options['usees']['max']
              }
            }
          }
        }
      });
    }
  }

  // Checked mods/pseudos
  let mods = {} as any;

  if ('filters' in item && item['filters']) {
    mods = Object.assign(mods, item['filters']);
  }

  if ('pseudos' in item && item['pseudos']) {
    mods = Object.assign(mods, item['pseudos']);
  }

  for (const prop in mods) {
    const e = mods[prop];

    // set id
    e['id'] = prop;

    if (e['enabled'] == true) {
      e['disabled'] = false;
      delete e['enabled'];
      query.query['stats'][0]['filters'].push(e);
    }
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
    query.query = Object.assign(query.query, {
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
  }

  // Use links
  if (options['uselinks']) {
    query.query = Object.assign(query.query, {
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
  }

  // Use iLvl
  if (options['useilvl']) {
    query.query = Object.assign(query.query, {
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
  }

  // Use item base
  if (options['useitembase']) {
    query.query['type'] = item['type'];
  }

  // Influences

  if ('influences' in options && options['influences'].length) {
    for (const i of options['influences']) {
      const inf = i as string;
      const infkey = inf + '_item';

      query.query = Object.assign(query.query, {
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
    }
  }

  // Synthesis
  if ('usesynthesisbase' in options && options['usesynthesisbase']) {
    query.query = Object.assign(query.query, {
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
  }

  // Corrupt
  if ('usecorrupted' in options) {
    const corrupt = options['usecorrupted'];

    if (corrupt != 'Any') {
      query.query = Object.assign(query.query, {
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
  }

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

      processPriceResults(resp, event, true);
    })
    .catch((error: any) => {
      log.error(error);
    });
}
