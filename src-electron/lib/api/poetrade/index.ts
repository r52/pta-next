// official PoE Trade Site search api
import { shell, dialog, BrowserWindow } from 'electron';
import cfg from 'electron-cfg';
import MultiMap from 'multimap';
import log from 'electron-log';
import axios from 'axios';
import merge from 'lodash.merge';

import Config from '../../config';
import { PTA } from '../../pta';

import URLs from '../urls';

export class POETradeAPI implements PriceAPI {
  private exchange: Map<string, string>;
  private currencies: Set<string>;
  private uniques: MultiMap;

  constructor(uniques: MultiMap, splash: BrowserWindow | null) {
    splash?.webContents.send('await-count', 1);

    this.uniques = uniques;
    this.exchange = new Map<string, string>();
    this.currencies = new Set();

    axios.get<Data.DictData>(URLs.pta.currency).then(
      response => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          const o = val;

          this.exchange.set(k, o);
        }

        this.exchange.forEach(val => {
          this.currencies.add(val);
        });

        log.info('Currencies loaded');

        splash?.webContents.send('data-ready');
      },
      () => {
        // TODO: do nothing on fail
      }
    );
  }

  public searchItemWithDefaults(
    event: Electron.IpcMainEvent,
    item: Item
  ): void {
    const league = PTA.getInstance().getLeague();

    // If its a currency and the currency is listed in the bulk exchange, try that first
    // Otherwise, try a regular search
    if (item.category == 'currency' && this.exchange.has(item.type)) {
      this.doCurrencySearch(event, item);
      return;
    }

    const query = {
      query: {
        status: {
          option: 'online'
        },
        stats: [
          {
            type: 'and',
            filters: [] as QueryFilter[]
          }
        ]
      },
      sort: {
        price: 'asc'
      }
    } as PoETradeQuery;

    const sopts = {
      label: 'Search Options',
      children: [
        {
          label: 'League',
          children: [{ label: league }]
        }
      ]
    } as QTreeModel;

    sopts.children = sopts.children ?? ([] as QTreeModel[]);

    let isUniqueBase = false;
    let searchToken = '';

    // Take care of settings
    const onlineonly = cfg.get(
      Config.onlineonly,
      Config.default.onlineonly
    ) as boolean;
    if (!onlineonly) {
      query.query.status.option = 'any';
      sopts.children.push({ label: 'Online Only' });
    }

    const buyoutonly = cfg.get(
      Config.buyoutonly,
      Config.default.buyoutonly
    ) as boolean;
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

    // Search by type if non-unique map, or if it has no name
    if (
      (item.category == 'map' && item.rarity != 'Unique') ||
      item.name == null
    ) {
      if (item.category == 'map' && item.type.startsWith('Blighted')) {
        // Let blighted maps thru to simple search
        isUniqueBase = true;
      } else {
        isUniqueBase = this.uniques.has(item.type);
        searchToken = item.type;
      }
    } else {
      isUniqueBase = this.uniques.has(item.name);
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
      if (searchToken) {
        const range = this.uniques.get(searchToken) as Data.UniqueItemEntry[];
        for (const entry of range) {
          // If has discriminator, match discriminator and type
          if (item.misc?.disc) {
            if (entry.disc == item.misc.disc && entry.type == item.type) {
              if (entry.name) {
                query.query.name = {
                  discriminator: entry.disc,
                  option: entry.name
                };
              }

              query.query.type = {
                discriminator: entry.disc,
                option: entry.type
              };

              break;
            }
          } else if (entry.type == item.type) {
            // For everything else, just match type
            query.query.type = entry.type;

            if (entry.name) {
              query.query.name = entry.name;
            }

            break;
          }
        }
      } else {
        // Force a manual search
        let term = item.name;

        if (term == null) {
          term = item.type;
        }

        if (term != null) {
          query.query = merge(query.query, {
            term: term
          });
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
                  min: item.quality as number
                }
              }
            }
          }
        });

        sopts.children.push({
          label: 'Gem',
          children: [
            {
              label: 'Level',
              children: [{ label: item.misc.gemlevel.toString() }]
            },
            {
              label: 'Quality',
              children: [{ label: (item.quality as number).toString() + '%' }]
            }
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
          children: [{ label: item.sockets.total.toString() }]
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
          children: [{ label: item.sockets.links.toString() }]
        });
      }

      // Force iLvl
      if (
        item.rarity != 'Unique' &&
        item.category != 'card' &&
        item.category != 'map' &&
        item.category != 'prophecy' &&
        item.ilvl
      ) {
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
          children: [{ label: item.ilvl.toString() }]
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
          children: [{ label: item.misc.maptier.toString() }]
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
      if (
        item.category != 'card' &&
        item.category != 'map' &&
        item.category != 'prophecy' &&
        item.influences
      ) {
        const inflist = [] as QTreeModel[];

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
      if (item.synthesised) {
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

        sopts.children.push({
          label: 'Synthesised',
          children: [{ label: 'Yes' }]
        });
      }

      // Force Fractured
      if (item.fractured) {
        query.query = merge(query.query, {
          filters: {
            misc_filters: {
              filters: {
                fractured_item: {
                  option: true
                }
              }
            }
          }
        });

        sopts.children.push({
          label: 'Fractured',
          children: [{ label: 'Yes' }]
        });
      }

      // Default corrupt options
      const corruptoverride = cfg.get(
        Config.corruptoverride,
        Config.default.corruptoverride
      ) as boolean;

      // No such thing as corrupted cards or prophecies
      // Don't force corruption on maps either
      if (
        item.category != 'card' &&
        item.category != 'map' &&
        item.category != 'prophecy'
      ) {
        if (corruptoverride) {
          const corrupt = cfg.get(
            Config.corruptsearch,
            Config.default.corruptsearch
          ) as string;

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

      const url = URLs.official.trade.search + league;

      axios.post<PoEFetchResults>(url, query).then(
        response => {
          const resp = response.data;

          if (!('result' in resp) || !('id' in resp)) {
            event.reply('error', 'Error querying trade site');
            log.warn('PoE API: Error querying trade API');
            log.warn('PoE API: Site responded with', resp);
            return;
          }

          this.processPriceResults(resp, event, opttree, true);
        },
        () => {
          // TODO: do nothing on fail
        }
      );
    } else {
      if (item.filters && Object.keys(item.filters).length > 0) {
        event.reply('forcetab', 'mods');
      } else {
        event.reply('error', 'Price check is not available for this item type');
      }
    }
  }

  public searchItemWithOptions(
    event: Electron.IpcMainEvent,
    item: Item,
    options: ItemOptions,
    openbrowser: boolean
  ): void {
    //
    if (
      item.filters == null ||
      !Object.keys(item.filters).length ||
      item.category == 'map'
    ) {
      // Cannot advanced search items with no filters
      return;
    }

    if (item.unidentified) {
      return;
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
            filters: [] as QueryFilter[]
          }
        ]
      },
      sort: {
        price: 'asc'
      }
    } as PoETradeQuery;

    const sopts = {
      label: 'Search Options',
      children: [
        {
          label: 'League',
          children: [{ label: league }]
        }
      ]
    } as QTreeModel;

    sopts.children = sopts.children ?? ([] as QTreeModel[]);

    // Take care of settings
    const onlineonly = cfg.get(
      Config.onlineonly,
      Config.default.onlineonly
    ) as boolean;
    if (!onlineonly) {
      query.query.status.option = 'any';
      sopts.children.push({ label: 'Online Only' });
    }

    const buyoutonly = cfg.get(
      Config.buyoutonly,
      Config.default.buyoutonly
    ) as boolean;
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

    let isUniqueBase = false;
    let searchToken: string;

    if (item.name) {
      isUniqueBase = this.uniques.has(item.name);
      searchToken = item.name;
    } else {
      isUniqueBase = this.uniques.has(item.type);
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
      if ((options['use' + bm] as MinMaxToggle).enabled) {
        const filter =
          bm === 'pdps' || bm === 'edps' ? 'weapon_filters' : 'armour_filters';

        const flt = [] as QTreeModel[];

        ['min', 'max'].forEach(lm => {
          if ((options['use' + bm] as MinMaxToggle)[lm] != null) {
            query.query = merge(query.query, {
              filters: {
                [filter]: {
                  filters: {
                    [bm]: {
                      [lm]: (options['use' + bm] as MinMaxToggle)[lm]
                    }
                  }
                }
              }
            });

            flt.push({
              label: lm,
              children: [
                {
                  label: ((options['use' + bm] as MinMaxToggle)[
                    lm
                  ] as unknown) as string
                }
              ]
            });
          }
        });

        if (flt.length) {
          sopts.children?.push({ label: bm, children: [...flt] });
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

    const mflt = [] as QTreeModel[];

    for (const [k, e] of Object.entries<Filter>(mods)) {
      if (e.enabled == true) {
        const entry = {
          disabled: false,
          id: k,
          value:
            e.min || e.max || e.selected
              ? {
                  min: e.min,
                  max: e.max,
                  option: e.selected
                }
              : null
        } as QueryFilter;

        query.query.stats[0].filters.push(entry);

        const vflt = [] as QTreeModel[];

        ['min', 'max'].forEach(vl => {
          if (vl in e && e[vl]) {
            vflt.push({ label: vl, children: [{ label: e[vl] as string }] });
          }
        });

        if (vflt.length) {
          mflt.push({ label: e.text, children: [...vflt] });
        }
      }
    }

    if (mflt.length) {
      sopts.children.push({ label: 'Mods', children: [...mflt] });
    }

    // Check for unique items
    if (isUniqueBase && item.rarity == 'Unique') {
      const range = this.uniques.get(searchToken) as Data.UniqueItemEntry[];
      for (const entry of range) {
        // For everything else, match type
        if (entry.type == item.type) {
          query.query.type = entry.type;

          if (entry.name) {
            query.query.name = entry.name;
          }

          break;
        }
      }
    }

    // Use sockets
    if (options.usesockets && item.sockets) {
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
        children: [{ label: item.sockets.total.toString() }]
      });
    }

    // Use links
    if (options.uselinks && item.sockets) {
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
        children: [{ label: item.sockets.links.toString() }]
      });
    }

    // Use iLvl
    if (options.useilvl && item.ilvl) {
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
        children: [{ label: item.ilvl.toString() }]
      });
    }

    // Use item base
    if (options.useitembase) {
      query.query.type = item.type;
      sopts.children.push({
        label: 'Item Base',
        children: [{ label: item.type }]
      });
    }

    // Influences

    if (options.influences != null && options.influences.length) {
      const inflist = [] as QTreeModel[];

      for (const inf of options.influences) {
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
    if (options.usesynthesised) {
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

      sopts.children.push({
        label: 'Synthesised',
        children: [{ label: 'Yes' }]
      });
    }

    // Fractured
    if (options.usefractured) {
      query.query = merge(query.query, {
        filters: {
          misc_filters: {
            filters: {
              fractured_item: {
                option: true
              }
            }
          }
        }
      });

      sopts.children.push({
        label: 'Fractured',
        children: [{ label: 'Yes' }]
      });
    }

    // Corrupt
    if (options.usecorrupted != null) {
      const corrupt = options.usecorrupted;

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
        children: [{ label: corrupt }]
      });
    }

    const opttree = [sopts];

    const url = URLs.official.trade.search + league;

    axios.post<PoEFetchResults>(url, query).then(
      response => {
        const resp = response.data;

        if (!('result' in resp) || !('id' in resp)) {
          log.warn('PoE API: Error querying trade API');
          log.warn('PoE API: Site responded with', resp);
          event.reply('error', 'Error querying trade site');
          return;
        }

        if (openbrowser) {
          const burl =
            URLs.official.trade.site + 'search/' + league + '/' + resp['id'];
          void shell.openExternal(burl);
          return;
        }

        this.processPriceResults(resp, event, opttree, true);
      },
      () => {
        // TODO: do nothing on fail
      }
    );
  }

  private processPriceResults(
    response: PoEFetchResults,
    event: Electron.IpcMainEvent,
    searchoptions: QTreeModel[] | null,
    forcetab: boolean,
    exchange = false
  ) {
    //
    const rlist = response.result;

    let displaylimit = cfg.get(
      Config.displaylimit,
      Config.default.displaylimit
    ) as number;

    // enforce display limits
    if (displaylimit > 50) {
      displaylimit = 50;
      cfg.set(Config.displaylimit, displaylimit);
    } else if (displaylimit < 10) {
      displaylimit = 10;
      cfg.set(Config.displaylimit, displaylimit);
    }

    const removedupes = cfg.get(
      Config.removedupes,
      Config.default.removedupes
    ) as boolean;
    const league = PTA.getInstance().getLeague();

    const urls = [];

    let n = 0;
    while (n < rlist.length && n < displaylimit) {
      const bucket = rlist.slice(n, n + 10);
      const codes = bucket.join(',');
      let url = URLs.official.trade.fetch + codes + '?query=' + response['id'];

      if (exchange) {
        url += '&exchange';
      }

      urls.push(axios.get<{ result: PoETradeListing[] }>(url));
      n = n + 10;
    }

    const rdat = {
      result: [],
      options: searchoptions,
      forcetab: forcetab,
      exchange: exchange,
      siteurl:
        URLs.official.trade.site +
        (exchange ? 'exchange/' : 'search/') +
        league +
        '/' +
        response['id']
    } as PoETradeResults;

    Promise.all(urls).then(
      results => {
        results.forEach(resp => {
          const data = resp.data;
          const list = data.result;

          rdat.result.push(...list);
        });

        // Delete duplicate accounts
        const accounts = new Set<string>();
        if (removedupes) {
          rdat.result = rdat.result.filter(entry => {
            const acctname = entry.listing.account.name;
            const isUnique = !accounts.has(acctname);

            if (isUnique) {
              accounts.add(acctname);
            }

            return isUnique;
          });
        }

        event.reply('results', rdat);
      },
      () => {
        // TODO: do nothing on fail
      }
    );
  }

  private doCurrencySearch(event: Electron.IpcMainEvent, item: Item) {
    const query = {
      exchange: {
        status: {
          option: 'online'
        },
        have: [] as string[],
        want: [] as string[]
      }
    };

    let p_curr = cfg.get(
      Config.primarycurrency,
      Config.default.primarycurrency
    ) as string;
    let s_curr = cfg.get(
      Config.secondarycurrency,
      Config.default.secondarycurrency
    ) as string;

    // Reset setting that no longer exists
    if (!this.currencies.has(p_curr)) {
      p_curr = Config.default.primarycurrency;
      cfg.set(Config.primarycurrency, p_curr);
    }

    if (!this.currencies.has(s_curr)) {
      s_curr = Config.default.secondarycurrency;
      cfg.set(Config.secondarycurrency, s_curr);
    }

    // Check for existing currencies
    if (!this.exchange.has(item.type)) {
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

    const url = URLs.official.trade.exchange + PTA.getInstance().getLeague();

    const want = this.exchange.get(item.type) as string;
    let have = p_curr;

    if (want == p_curr) {
      have = s_curr;
    }

    query.exchange.want.push(want);
    query.exchange.have.push(have);

    if (have != s_curr && want != s_curr) {
      query.exchange.have.push(s_curr);
    }

    axios.post<PoEFetchResults>(url, query).then(
      results => {
        const pdata = results.data;

        if ('result' in pdata && 'id' in pdata) {
          this.processPriceResults(pdata, event, null, true, true);
        }
      },
      () => {
        // TODO: do nothing on fail
      }
    );
  }
}
