import { app, dialog, BrowserWindow } from 'electron';
import MultiMap from 'multimap';
import log from 'electron-log';
import axios from 'axios';
import URLs from './api/urls';
import {
  NumericRange,
  StatFilter,
  StatType,
  Misc,
  Armour,
  Weapon,
  Requirements,
  Sockets,
  Filter,
  Item
} from 'app/types/item';
import { Searcher } from 'fast-fuzzy';
import { Data } from 'app/types/data';

function escapeRegExp(string: string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function calculateMaxQuality(item: Item, mod: string, quality: number) {
  const percentmods = {
    pdps: [
      // #% increased Physical Damage
      'explicit.stat_1509134228',
      'implicit.stat_1509134228',
      'fractured.stat_1509134228',
      'crafted.stat_1509134228'
    ],
    ar: [
      'explicit.stat_1062208444', // #% increased Armour (Local)
      'implicit.stat_1062208444',
      'fractured.stat_1062208444',
      'crafted.stat_1062208444',

      'explicit.stat_3321629045', // #% increased Armour and Energy Shield (Local)
      'fractured.stat_3321629045',
      'crafted.stat_3321629045',

      'explicit.stat_2451402625', // #% increased Armour and Evasion (Local)
      'fractured.stat_2451402625',
      'crafted.stat_2451402625',

      'explicit.stat_3523867985', // #% increased Armour, Evasion and Energy Shield (Local)
      'crafted.stat_3523867985'
    ],
    ev: [
      'explicit.stat_124859000', // #% increased Evasion Rating (Local)
      'implicit.stat_124859000',
      'fractured.stat_124859000',
      'crafted.stat_124859000',

      'explicit.stat_2451402625', // #% increased Armour and Evasion (Local)
      'fractured.stat_2451402625',
      'crafted.stat_2451402625',

      'explicit.stat_1999113824', // #% increased Evasion and Energy Shield (Local)
      'fractured.stat_1999113824',
      'crafted.stat_1999113824',

      'explicit.stat_3523867985', // #% increased Armour, Evasion and Energy Shield (Local)
      'crafted.stat_3523867985'
    ],
    es: [
      'explicit.stat_4015621042', // #% increased Energy Shield (Local)
      'implicit.stat_4015621042',
      'fractured.stat_4015621042',
      'crafted.stat_4015621042',

      'explicit.stat_3321629045', // #% increased Armour and Energy Shield (Local)
      'fractured.stat_3321629045',
      'crafted.stat_3321629045',

      'explicit.stat_1999113824', // #% increased Evasion and Energy Shield (Local)
      'fractured.stat_1999113824',
      'crafted.stat_1999113824',

      'explicit.stat_3523867985', // #% increased Armour, Evasion and Energy Shield (Local)
      'crafted.stat_3523867985'
    ]
  } as { [index: string]: string[] };

  if (!(mod in percentmods)) {
    log.warn('Trying to calculate max quality on invalid mod', mod);
    return 0;
  }

  let baseval = 100;

  percentmods[mod].forEach(m => {
    if (item.filters && m in item.filters) {
      baseval += item.filters[m].value[0];
    }
  });

  baseval += quality;

  const ooratio = baseval / 100.0;
  let nratio = ooratio;

  if (quality < 20) {
    // bump up to 20% quality
    baseval += 20 - quality;
    nratio = baseval / 100.0;
  }

  switch (mod) {
    case 'pdps': {
      if (item.weapon?.pdps) {
        // XXX: this calculation isn't entirely consistent with PoE internally
        // but it's close enough and nobody knows how PoE behaves internally anyways
        // with regards to rounding
        const origmin = Math.round(item.weapon.pdps.min / ooratio);
        const origmax = Math.round(item.weapon.pdps.max / ooratio);

        const mq = {
          min: Math.round(origmin * nratio),
          max: Math.round(origmax * nratio)
        } as NumericRange;

        item.weapon.mqpdps = mq;
      }
      break;
    }
    case 'ar': {
      if (item.armour?.ar) {
        const origval = item.armour.ar / ooratio;
        item.armour.mqar = Math.round(origval * nratio);
      }
      break;
    }
    case 'ev': {
      if (item.armour?.ev) {
        const origval = item.armour.ev / ooratio;
        item.armour.mqev = Math.round(origval * nratio);
      }
      break;
    }
    case 'es': {
      if (item.armour?.es) {
        const origval = item.armour.es / ooratio;
        item.armour.mqes = Math.round(origval * nratio);
      }
      break;
    }
  }
}

class ItemText {
  text: string;
  lines: string[];
  currentline: number;
  sections: number;
  currentsection: number;

  constructor(itemtext: string) {
    this.text = itemtext;

    this.lines = itemtext.split(/\r?\n/g);
    this.currentline = 0;
    this.sections = 0;
    this.currentsection = 0;
  }

  calcSections() {
    this.sections = 1;
    this.lines.forEach(line => {
      if (line.startsWith('---')) {
        this.sections++;
      }
    });
  }

  readLine() {
    if (this.currentline < this.lines.length) {
      const line = this.lines[this.currentline];
      this.currentline++;

      if (line.startsWith('---')) {
        this.currentsection++;
      }

      return line;
    }

    return false;
  }

  peek() {
    if (this.currentline + 1 < this.lines.length) {
      const line = this.lines[this.currentline + 1];
      return line;
    }

    return false;
  }

  peekLast() {
    const line = this.lines[this.lines.length - 1];
    return line;
  }

  pop() {
    this.lines.pop();
  }
}

export class ItemParser {
  private modData: Map<string, string>;
  private uniques: MultiMap;
  private baseCat: Map<string, string>;
  private baseMap: Map<string, Data.BaseMap>;
  private excludes: Set<string>;
  private statsById: Map<string, StatFilter>;
  private weaponLocals: Set<string>;
  private armourLocals: Set<string>;
  private specialRules: Map<string, Data.SpecialRule>;
  private pseudoRules: Map<string, Data.PseudoRule[]>;
  private discriminators: Map<string, Set<string>>;
  private priorityRules: Map<string, Data.PriorityRule>;

  private mapDisc = 'warfortheatlas';

  private stats: { [index: string]: StatType };

  private section = '';

  public constructor(uniques: MultiMap, splash: BrowserWindow | null) {
    splash?.webContents.send('await-count', 11);

    ///////////////////////////////////////////// Download excludes/stats
    this.excludes = new Set();
    this.statsById = new Map<string, StatFilter>();
    this.stats = {};

    axios
      .get<Data.Excludes>(URLs.pta.exclude)
      .then(response => {
        const data = response.data;

        for (const e of data.excludes) {
          this.excludes.add(e);
        }

        log.info('Excludes loaded');
        splash?.webContents.send('data-ready');

        axios
          .get<Data.Stats>(URLs.official.stats)
          .then(response => {
            const data = response.data;

            const stt = data.result;

            for (const type of stt) {
              const entrylist = type.entries;
              const typelabel = type.label.toLowerCase();

              for (const entry of entrylist) {
                if (!this.excludes.has(entry.id)) {
                  this.statsById.set(entry.id, entry);
                }

                // construct option fuzzy search
                if (entry.option != null) {
                  entry.option.searcher = new Searcher(entry.option.options, {
                    keySelector: o => o.text,
                    ignoreCase: false,
                    ignoreSymbols: false,
                    returnMatchData: true
                  });
                }
              }

              // construct fuzzy search
              this.stats[typelabel] = {
                entries: entrylist,
                searcher: new Searcher(entrylist, {
                  keySelector: o => o.text,
                  ignoreCase: false,
                  ignoreSymbols: false,
                  returnMatchData: true
                })
              };
            }

            log.info('Mod stats loaded');
            splash?.webContents.send('data-ready');
          })
          .catch(e => {
            log.error(e);
            dialog.showErrorBox(
              'Fatal Error',
              'Failed to download Mod data. Check log for more details.'
            );
            app.exit(1);
          });
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Exclude data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Save unique items
    this.uniques = uniques;

    ///////////////////////////////////////////// Load base categories/RePoE base data
    this.baseCat = new Map<string, string>();
    this.baseMap = new Map<string, Data.BaseMap>();

    axios
      .get<Data.DictData>(URLs.pta.basecat)
      .then(response => {
        const data = response.data;

        for (const [k, o] of Object.entries(data)) {
          this.baseCat.set(k, o);
        }

        log.info('Base categories loaded');
        splash?.webContents.send('data-ready');

        axios
          .get<Data.BaseItems>(URLs.repoe.base)
          .then(response => {
            const data = response.data;

            for (const val of Object.values(data)) {
              const typeName = val.name;
              const itemClass = val.item_class;
              const implicits = val.implicits.length;

              if (this.baseCat.has(itemClass)) {
                const itemCat = this.baseCat.get(itemClass) as string;

                const cat = {
                  category: itemCat,
                  implicits: implicits
                };

                this.baseMap.set(typeName, cat);
              }
            }

            log.info('Item base data loaded');
            splash?.webContents.send('data-ready');
          })
          .catch(e => {
            log.error(e);
            dialog.showErrorBox(
              'Fatal Error',
              'Failed to download Item base data. Check log for more details.'
            );
            app.exit(1);
          });
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Base category data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Load RePoE mod data
    this.modData = new Map<string, string>();

    axios
      .get<Data.BaseMods>(URLs.repoe.mods)
      .then(response => {
        const data = response.data;

        for (const val of Object.values(data)) {
          const modname = val.name;
          const modtype = val.generation_type;

          if (!modname) {
            // Skip the mods with no name
            continue;
          }

          if (modtype !== 'prefix' && modtype !== 'suffix') {
            // We only care about magic mods for now here so
            // skip all other mod types like corrupted/unique mods
            continue;
          }

          this.modData.set(modname, modtype);
        }

        log.info('Mod types loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Mod types data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Load local rules
    this.armourLocals = new Set();
    this.weaponLocals = new Set();

    axios
      .get<Data.ArrayData>(URLs.pta.armour)
      .then(response => {
        const data = response.data;

        for (const e of data.data) {
          this.armourLocals.add(e);
        }

        log.info('Armour locals loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Armour locals data. Check log for more details.'
        );
        app.exit(1);
      });

    axios
      .get<Data.ArrayData>(URLs.pta.weapon)
      .then(response => {
        const data = response.data;

        for (const e of data.data) {
          this.weaponLocals.add(e);
        }

        log.info('Weapon locals loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Weapon locals data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Load enchant rules
    this.specialRules = new Map<string, Data.SpecialRule>();

    axios
      .get<Data.Specials>(URLs.pta.special)
      .then(response => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          this.specialRules.set(k, val);
        }

        log.info('Enchant rules loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Enchant rules data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Load pseudo rules
    this.pseudoRules = new Map<string, Data.PseudoRule[]>();

    axios
      .get<Data.Pseudos>(URLs.pta.pseudo)
      .then(response => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          this.pseudoRules.set(k, val);
        }

        log.info('Pseudo rules loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Pseudo rules data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Mod Discriminators
    this.discriminators = new Map<string, Set<string>>();

    axios
      .get<Data.Discriminators>(URLs.pta.disc)
      .then(response => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          const set = new Set<string>();

          for (const value of val.unused) {
            set.add(value);
          }

          this.discriminators.set(k, set);
        }

        log.info('Discriminator rules loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Discriminator rules data. Check log for more details.'
        );
        app.exit(1);
      });

    ///////////////////////////////////////////// Priority rules
    this.priorityRules = new Map<string, Data.PriorityRule>();

    axios
      .get<Data.Priority>(URLs.pta.priority)
      .then(response => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          this.priorityRules.set(k, val);
        }

        log.info('Priority rules loaded');
        splash?.webContents.send('data-ready');
      })
      .catch(e => {
        log.error(e);
        dialog.showErrorBox(
          'Fatal Error',
          'Failed to download Priority rules data. Check log for more details.'
        );
        app.exit(1);
      });
  }

  private getNumFlavourSections(item: Item): number {
    let sections = 0;

    if (
      item.rarity == 'Unique' &&
      (item.unidentified == null || item.unidentified == false)
    ) {
      sections++;
    }

    if (
      item.category == 'flask' ||
      item.category == 'map' ||
      item.category == 'gem' ||
      item.category?.startsWith('jewel')
    ) {
      sections++;
    }

    return sections;
  }

  public async parse(itemtext: string): Promise<Item | null> {
    itemtext = itemtext.trim();

    const item = {} as Item;

    const lines = new ItemText(itemtext);

    // Preprocess out bottom sections
    this.preprocessItemText(item, lines);

    let line = lines.readLine();

    if (!line) {
      log.warn('Parse called on empty text');
      return null;
    }

    if (!line.startsWith('Item Class:')) {
      log.warn('Parse called on non PoE item text');
      return null;
    }

    item.origtext = itemtext;

    // Item class
    let parts = line.split(': ');
    item.class = parts[1];

    line = lines.readLine();

    // Rarity
    if (line && line.startsWith('Rarity:')) {
      parts = line.split(': ');
      item.rarity = parts[1];
    }

    let nametype = lines.readLine();
    let type = lines.readLine();

    if (nametype && nametype.startsWith('You cannot')) {
      // Item requirements not met msg (why is this needed GGG?!)
      // Ignore it and read the subsequent lines
      nametype = lines.readLine();
      type = lines.readLine();
    }

    if (type && type.startsWith('---')) {
      // nametype has to be item type and not name
      item.type = this.readType(item, nametype as string);
    } else {
      item.name = this.readName(nametype as string);
      item.type = this.readType(item, type as string);
    }

    // Process category
    if ('Gem' == item.rarity) {
      item.category = 'gem';

      // Initialize quality
      item.quality = 0;
      this.readAlternateGem(item);
    } else if ('Divination Card' == item.rarity) {
      item.category = item.rarity = 'card';
    } else if ('Currency' == item.rarity) {
      item.category = item.rarity = 'currency';
    }

    if (item.type.endsWith('Map')) {
      item.category = 'map';

      // Don't apply standard discriminator to blighted maps
      if (!item.type.startsWith('Blighted')) {
        item.misc = item.misc ?? ({} as Misc);
        item.misc.disc = this.mapDisc; // Default map discriminator
      }

      item.type = item.type.replace('Elder ', '');
      item.type = item.type.replace('Shaped ', '');
    }

    if (item.category == 'prophecy') {
      item.name = item.type;
      item.type = 'Prophecy';
    }

    if (item.category == null && this.uniques.has(item.type)) {
      const search = this.uniques.get(item.type) as Data.UniqueItemEntry[];
      if (search) {
        const je = search[0];
        if (je.type == 'Prophecy') {
          // this is a prophecy
          item.name = item.type;
          item.type = 'Prophecy';
          item.category = 'prophecy';
        }
      }
    }

    if (item.category == null) {
      if (this.baseMap.has(item.type)) {
        const cat = this.baseMap.get(item.type) as Data.BaseMap;
        item.category = cat.category;
      }
    }

    // Read the rest of the crap

    const promises = [] as Promise<boolean>[];

    while ((line = lines.readLine()) !== false) {
      // Skip flavour text
      if (
        lines.currentsection >=
        lines.sections - this.getNumFlavourSections(item)
      ) {
        continue;
      }

      // Skip section text
      if (line.startsWith('---')) {
        this.section = '';
        continue;
      }

      if (!this.parseProp(item, line) && lines.currentsection > 1) {
        // parse item stat
        promises.push(this.parseStat(item, line, lines));
      }
    }

    await Promise.all(promises);

    // Process special/pseudo rules
    if (item.filters != null && Object.keys(item.filters).length) {
      for (const [key, fil] of Object.entries<Filter>(item.filters)) {
        if (this.pseudoRules.has(key)) {
          const rules = this.pseudoRules.get(key);

          if (rules) {
            for (const r of rules) {
              const pid = r['id'];

              const pentry = this.statsById.get(pid);

              item.pseudos =
                item.pseudos ?? ({} as { [index: string]: Filter });

              if (!(pid in item.pseudos)) {
                const psEntry = ({
                  ...pentry,
                  enabled: false,
                  value: [] as number[],
                  selected: null,
                  min: null,
                  max: null
                } as unknown) as Filter;

                for (const v of fil.value) {
                  psEntry.value.push(v * r['factor']);
                }

                item.pseudos[pid] = psEntry;
              } else {
                const psEntry = item.pseudos[pid];

                for (let i = 0; i < fil.value.length; i++) {
                  const v = fil.value[i];

                  // XXX: only support one operation right now
                  // also remove is useless
                  if (r['op'] == 'add') {
                    psEntry.value[i] = psEntry.value[i] + v * r['factor'];
                  }
                }
              }
            }
          }
        }
      }
    }

    // Process quality on base mods
    if (item.weapon && item.weapon.pdps) {
      calculateMaxQuality(item, 'pdps', item.quality ?? 0);
    }

    if (item.armour) {
      if (item.armour.ar) {
        calculateMaxQuality(item, 'ar', item.quality ?? 0);
      }

      if (item.armour.es) {
        calculateMaxQuality(item, 'es', item.quality ?? 0);
      }

      if (item.armour.ev) {
        calculateMaxQuality(item, 'ev', item.quality ?? 0);
      }
    }

    return item;
  }

  private preprocessItemText(item: Item, lines: ItemText) {
    // Preprocess out bottom sections
    // so flavour text can be processed out

    let res: string;

    (function() {
      while ((res = lines.peekLast())) {
        if (res.startsWith('Note:')) {
          lines.pop();
          continue;
        }

        switch (res) {
          case '--------':
            lines.pop();
            break;
          case 'Synthesised Item':
            item.synthesised = true;
            lines.pop();
            break;
          case 'Fractured Item':
            item.fractured = true;
            lines.pop();
            break;
          case 'Corrupted':
            item.corrupted = true;
            lines.pop();
            break;
          case 'Shaper Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('shaper');
            lines.pop();
            break;
          case 'Elder Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('elder');
            lines.pop();
            break;
          case 'Crusader Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('crusader');
            lines.pop();
            break;
          case 'Redeemer Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('redeemer');
            lines.pop();
            break;
          case 'Hunter Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('hunter');
            lines.pop();
            break;
          case 'Warlord Item':
            item.influences = item.influences ?? ([] as string[]);
            item.influences.push('warlord');
            lines.pop();
            break;
          case 'Right-click to add this prophecy to your character.':
            item.category = 'prophecy';
            lines.pop();
            break;
          default:
            return;
        }
      }
    })();

    lines.calcSections();
  }

  private readAlternateGem(item: Item) {
    item.misc = item.misc ?? ({} as Misc);

    item.misc.gemalternatequality = 0;

    if (item.type.startsWith('Anomalous ')) {
      item.type = item.type.replace('Anomalous ', '');
      item.misc.gemalternatequality = 1;
    } else if (item.type.startsWith('Divergent ')) {
      item.type = item.type.replace('Divergent ', '');
      item.misc.gemalternatequality = 2;
    } else if (item.type.startsWith('Phantasmal ')) {
      item.type = item.type.replace('Phantasmal ', '');
      item.misc.gemalternatequality = 3;
    }
  }

  private readName(name: string) {
    name = name.replace(/<<.*?>>|<.*?>/g, '');
    return name;
  }

  private readType(item: Item, type: string) {
    type = type.replace(/<<.*?>>|<.*?>/g, '');
    type = type.replace('Superior ', '');

    if (type.startsWith('Synthesised ')) {
      type = type.replace('Synthesised ', '');
      item.synthesised = true;
    }

    if (item.rarity === 'Magic') {
      // Parse out magic affixes
      // Try to get rid of all suffixes by forward catching " of"
      const re = /[\w'-]+/g;

      let words = Array.from(type.matchAll(re), m => m[0]);

      const prefix = words[0];

      // Remove prefixes
      if (this.modData.has(prefix) && this.modData.get(prefix) == 'prefix') {
        words.shift();
      }

      if (words.includes('of')) {
        words = words.slice(0, words.indexOf('of'));
      }

      type = words.join(' ');
    }

    return type;
  }

  private parseProp(item: Item, prop: string) {
    const parts = prop.split(':');

    if (parts.length < 2) {
      return false;
    }

    const p = parts[0];
    const v = parts[1].trim();

    switch (p) {
      case 'Quality':
      case 'Quality (Elemental Damage)':
      case 'Quality (Caster Modifiers)':
      case 'Quality (Attack Modifiers)':
      case 'Quality (Defence Modifiers)':
      case 'Quality (Life and Mana Modifiers)':
      case 'Quality (Resistance Modifiers)':
      case 'Quality (Attribute Modifiers)':
        item.quality = this.readPropInt(v);
        break;
      case 'Evasion Rating':
        item.armour = item.armour ?? ({} as Armour);
        item.armour.ev = this.readPropInt(v);
        break;
      case 'Energy Shield':
        item.armour = item.armour ?? ({} as Armour);
        item.armour.es = this.readPropInt(v);
        break;
      case 'Armour':
        item.armour = item.armour ?? ({} as Armour);
        item.armour.ar = this.readPropInt(v);
        break;
      case 'Chance to Block':
        item.armour = item.armour ?? ({} as Armour);
        item.armour.block = this.readPropInt(v);
        break;
      case 'Physical Damage':
        item.weapon = item.weapon ?? ({} as Weapon);
        item.weapon.pdps = this.readPropIntRange(v);
        break;
      case 'Critical Strike Chance':
        item.weapon = item.weapon ?? ({} as Weapon);
        item.weapon.crit = this.readPropFloat(v);
        break;
      case 'Attacks per Second':
        item.weapon = item.weapon ?? ({} as Weapon);
        item.weapon.aps = this.readPropFloat(v);
        break;
      case 'Elemental Damage':
        item.weapon = item.weapon ?? ({} as Weapon);
        item.weapon.edps = this.readPropIntRange(v);
        break;
      case 'Requirements':
        this.section = 'Requirements';
        break;
      case 'Level':
        if (this.section == 'Requirements') {
          item.requirements = item.requirements || ({} as Requirements);
          item.requirements.lvl = this.readPropInt(v);
        } else {
          item.misc = item.misc ?? ({} as Misc);
          item.misc.gemlevel = this.readPropInt(v);
        }
        break;
      case 'Str':
        item.requirements = item.requirements || ({} as Requirements);
        item.requirements.str = this.readPropInt(v);
        break;
      case 'Dex':
        item.requirements = item.requirements || ({} as Requirements);
        item.requirements.dex = this.readPropInt(v);
        break;
      case 'Int':
        item.requirements = item.requirements || ({} as Requirements);
        item.requirements.int = this.readPropInt(v);
        break;
      case 'Sockets':
        item.sockets = this.readSockets(v);
        break;
      case 'Item Level':
        item.ilvl = this.readPropInt(v);
        break;
      case 'Experience':
        item.misc = item.misc ?? ({} as Misc);
        item.misc.gemprogress = v;
        break;
      case 'Map Tier':
        item.misc = item.misc ?? ({} as Misc);
        item.misc.maptier = this.readPropInt(v);
        break;
      default:
        return false;
    }

    return true;
  }

  private readPropInt(prop: string): number {
    // Remove augmented tag
    prop = prop.replace(' (augmented)', '');

    const re = /^([+-]?[\d.]+)%?/g;

    const match = prop.match(re);

    if (match) {
      const val = match[0];
      return parseInt(val);
    }

    return 0;
  }

  private readPropIntRange(prop: string): NumericRange {
    const val = {
      min: 0,
      max: 0
    } as NumericRange;

    // If it is a list, process list
    if (prop.includes(', ')) {
      // Split and recursively read
      const list = prop.split(', ');

      for (const item of list) {
        const nxt = this.readPropIntRange(item);
        val.min = val.min + nxt.min;
        val.max = val.max + nxt.max;
      }

      return val;
    }

    // Otherwise process single entry

    // Remove augmented tag
    prop = prop.replace(' (augmented)', '');

    const re = /\d+/g;

    const match = Array.from(prop.matchAll(re), m => m[0]);

    if (match) {
      const v1 = match[0];
      const v2 = match[1];

      val.min = parseInt(v1);
      val.max = parseInt(v2);
    }

    return val;
  }

  private readPropFloat(prop: string): number {
    // Remove augmented tag
    prop = prop.replace(' (augmented)', '');

    const re = /[+-]?\d+(\.\d+)?/g;
    const match = prop.match(re);

    if (match) {
      const val = match[0];
      return parseFloat(val);
    }

    return 0.0;
  }

  private readSockets(prop: string): Sockets {
    const sockets = {
      links: 0,
      total: 0,
      R: 0,
      G: 0,
      B: 0,
      W: 0,
      A: 0,
      D: 0
    } as Sockets;

    const llist = prop.split(' ');

    for (const lpart of llist) {
      const socks = lpart.split('-');

      if (socks.length > 1 && socks.length > sockets.links) {
        // New max links
        sockets.links = socks.length;
      }

      for (const s of socks) {
        sockets[s] = sockets[s] + 1;
        sockets.total = sockets.total + 1;
      }
    }

    return sockets;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async parseStat(item: Item, stat: string, stream: ItemText) {
    const origstat = String(stat);

    // Special rule for A Master Seeks Help
    if (
      item.category &&
      item.name &&
      item.category == 'prophecy' &&
      item.name == 'A Master Seeks Help'
    ) {
      const re = /^You will find (\w+) and complete her mission\.$/;
      const match = re.exec(stat);
      if (match && match.length > 1) {
        const master = match[1];

        item.misc = item.misc ?? ({} as Misc);
        item.misc.disc = master.toLowerCase();
      }

      return true;
    }

    if (item.category == 'card' || item.category == 'prophecy') {
      // Ignore all card/prophecy lines
      return true;
    }

    if (stat == 'Unidentified') {
      item.unidentified = true;
      return true;
    }

    // Vaal gems
    if (item.category == 'gem') {
      if (stat.startsWith('Vaal ')) {
        item.type = stat;
      }

      // Don't care about gem mods
      return true;
    }

    let stattype = 'explicit';

    if (stat.endsWith('(crafted)')) {
      stattype = 'crafted';
      stat = stat.replace(' (crafted)', '');
    }

    if (stat.endsWith('(implicit)')) {
      stattype = 'implicit';
      stat = stat.replace(' (implicit)', '');
    }

    if (stat.endsWith('(enchant)')) {
      stattype = 'enchant';
      stat = stat.replace(' (enchant)', '');
    }

    if (stat.endsWith('(fractured)')) {
      stattype = 'fractured';
      stat = stat.replace(' (fractured)', '');
    }

    let valstat = String(stat);

    let found = false;
    let foundEntry: StatFilter | null = null;

    // Match numerics
    const re = /(?<!\d)[+-]?\d+(\.\d+)?/g;

    let val: number[] = [];
    let factor = 1;

    // Craft search token
    stat = stat.replace(re, '#');

    // Process local rules
    if (item.weapon || item.armour) {
      const islocalstat =
        (item.weapon && this.weaponLocals.has(stat)) ||
        (item.armour && this.armourLocals.has(stat));

      if (islocalstat) {
        stat += ' (Local)';
        valstat += ' (Local)';
      }
    }

    if (
      stat.includes('#') &&
      ((stat.includes('reduced') && !stat.includes('reduced Mana')) ||
        stat.includes('reduced Mana Reserved') ||
        stat.includes('less')) &&
      !stat.startsWith('Players have')
    ) {
      // If the stat line has a "reduced" value, try to
      // flip it and try again

      if (
        (stat.includes('reduced') && !stat.includes('reduced Mana')) ||
        stat.includes('reduced Mana Reserved')
      ) {
        stat = stat.replace('reduced', 'increased');
        valstat = valstat.replace('reduced', 'increased');
      } else {
        stat = stat.replace('less', 'more');
        valstat = valstat.replace('less', 'more');
      }

      // set factor
      factor = -1;
    }

    // Handle special rules
    if (this.specialRules.has(stat) || this.specialRules.has(valstat)) {
      let rule: Data.SpecialRule;

      if (this.specialRules.has(valstat)) {
        rule = this.specialRules.get(valstat) as Data.SpecialRule;
      } else {
        rule = this.specialRules.get(stat) as Data.SpecialRule;
      }

      if (rule.id) {
        found = true;
        foundEntry = this.statsById.get(rule.id) as StatFilter;
      }

      if (rule.search) {
        // Fix search term
        stat = rule.search;
      }

      if (rule.fixes) {
        // Fix value matching
        rule.fixes.forEach(fix => {
          if (fix.if == valstat) {
            valstat = fix.val;
          }
        });
      }

      if (rule.value) {
        val.push(rule.value);
      }
    }

    // Handle special mods with a colon
    if (stat.includes(': ')) {
      if (
        stat.startsWith('Added Small Passive Skills grant: ') &&
        stattype !== 'enchant'
      ) {
        // ignore first line of double lined cluster jewel enchants
        log.debug('Ignored/unprocessed line', origstat);
        return false;
      }

      if (stattype === 'enchant') {
        stat = stat.substring(0, stat.indexOf(': ') + 2);
      }
    }

    // Handle anointments
    if (stat.startsWith('Allocates ') && stattype === 'enchant') {
      stat = stat.substring(0, stat.indexOf(' '));
    }

    if (!found) {
      let results = this.stats[stattype].searcher.search(stat, {
        returnMatchData: true
      });

      // Don't bother checking more than the first couple of results
      // since the results are sorted
      results = results.slice(0, 5);

      // loop thru the first couple of results
      let idx = 0;
      while (results.length && idx < results.length) {
        const entry = results[idx].item;

        // Skip ones that are excessively different in size
        if (
          entry.text.length > stat.length * 1.25 ||
          entry.text.length < stat.length * 0.75
        ) {
          idx++;
          continue;
        }

        // check priority rules
        if (this.priorityRules.has(entry.id)) {
          const rule = this.priorityRules.get(entry.id) as Data.PriorityRule;

          if (rule.single) {
            // There can only be a single one of these
            if (
              item.filters != null &&
              Object.keys(item.filters).includes(entry.id)
            ) {
              idx++;
              continue;
            }
          } else {
            if (item.filters == null) {
              // This mod has priorities but item has no filters yet
              idx++;
              continue;
            }

            const keys = Object.keys(item.filters);

            // check each priority
            const priorities = rule.priority;
            const pass = priorities.every(p => {
              return keys.includes(p);
            });

            if (!pass) {
              // doesn't pass priority rules
              idx++;
              continue;
            }
          }
        }

        // check excludes
        if (this.excludes.has(entry.id)) {
          // Exclude skip
          idx++;
          continue;
        }

        if (
          item.category &&
          this.discriminators.has(entry.id) &&
          (this.discriminators.get(entry.id) as Set<string>).has(item.category)
        ) {
          // Discriminator skip
          idx++;
          continue;
        }

        foundEntry = entry;
        found = true;
        break;
      }
    }

    if (!found || !foundEntry) {
      log.debug('Ignored/unprocessed line', origstat);
      return false;
    }

    if (foundEntry) {
      // process multiline mods
      const lines = (foundEntry.text.match(/\n/g) || '').length + 1;

      if (lines > 1) {
        const multiline: string[] = [];

        multiline.push(valstat);

        while (multiline.length < lines) {
          const nextline = stream.readLine();
          multiline.push(nextline as string);
        }

        valstat = multiline.join('\n');
      }

      // Check numerics/options
      let selected: number | null = null;

      if (foundEntry.text.includes('#')) {
        if (foundEntry.option == null) {
          let textreg = escapeRegExp(foundEntry.text);
          textreg = textreg.replace(/#/g, '(.+)');

          const rg = new RegExp(textreg);
          const matches = rg.exec(valstat);

          if (matches) {
            // delete the full match line
            matches.shift();

            if (matches.length) {
              val = matches.map(Number);
              val = val.map(x => x * factor);
            } else {
              // shouldn't ever get here
              val = [];
            }
          }
        } else {
          let search = valstat.substring(foundEntry.text.indexOf('#'));
          const end = foundEntry.text.substring(
            foundEntry.text.indexOf('#') + 1
          );

          if (end) {
            search = search.replace(end, '');
          }

          const results = foundEntry.option.searcher.search(search, {
            returnMatchData: true
          });

          // look for exact matches within results
          results.some(e => {
            if (e.item?.text.includes(search)) {
              selected = e.item.id;
              return true;
            }

            return false;
          });
        }
      } else if (
        stat.includes('#') &&
        foundEntry.type == 'implicit' &&
        foundEntry.text.startsWith('Grant')
      ) {
        // Special case for corrupted implicits
        let matches;

        while ((matches = re.exec(valstat)) !== null) {
          val.push(Number(matches[0]));
        }

        val = val.map(x => x * factor);
      }

      // insert this filter
      const filter = {
        id: foundEntry.id,
        type: foundEntry.type,
        text: foundEntry.text,
        value: [...val],
        enabled: false,
        selected: selected,
        min: null,
        max: null
      } as Filter;

      if (foundEntry.option) {
        filter.option = { options: foundEntry.option.options };
      }

      item.filters = item.filters ?? ({} as { [index: string]: Filter });

      // If the item already has this filter, merge them
      if (filter.id in item.filters) {
        const efil = item.filters[filter.id];

        const count = efil.value.length;

        // Only merge if they have the same length count
        if (count == filter.value.length) {
          for (let i = 0; i < count; i++) {
            efil.value[i] = efil.value[i] + filter.value[i];
          }
        }
      } else {
        item.filters[filter.id] = { ...filter };
      }

      return true;
    }

    return false;
  }
}
