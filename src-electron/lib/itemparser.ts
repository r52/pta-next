/* eslint-disable @typescript-eslint/no-explicit-any */
import MultiMap from 'multimap';
import log from 'electron-log';
import axios from 'axios';
import Fuse from 'fuse.js';

import URLs from './api/urls';

function escapeRegExp(string: string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

class ItemText {
  text: string;
  lines: string[];
  currentline: number;

  constructor(itemtext: string) {
    this.text = itemtext;

    this.lines = itemtext.split(/\r?\n/g);
    this.currentline = 0;
  }

  readLine() {
    if (this.currentline < this.lines.length) {
      const line = this.lines[this.currentline];
      this.currentline++;

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
}

export class ItemParser {
  private modData: Map<string, string>;
  private uniques: MultiMap;
  private baseCat: Map<string, string>;
  private baseMap: Map<string, Record<string, any>>;
  private excludes: Set<string>;
  private statsById: Map<string, Record<string, any>>;
  private weaponLocals: Set<string>;
  private armourLocals: Set<string>;
  private enchantRules: Map<string, Record<string, any>>;
  private pseudoRules: Map<string, Record<string, any>[]>;
  private discriminators: Map<string, Set<string>>;
  private priorityRules: Map<string, Record<string, any>>;

  private mapDisc = 'warfortheatlas';

  private stats: { [index: string]: StatType };

  private section = '';

  public constructor(uniques: MultiMap) {
    ///////////////////////////////////////////// Download excludes/stats
    this.excludes = new Set();
    this.statsById = new Map();
    this.stats = {};

    axios.get(URLs.pta.exclude).then((response: any) => {
      const data = response.data;

      for (const e of data['excludes']) {
        this.excludes.add(e);
      }

      log.info('Excludes loaded');

      axios.get(URLs.official.stats).then((response: any) => {
        const data = response.data;

        const stt = data['result'];

        for (const type of stt) {
          const el = type['entries'];
          const tlb = (type['label'] as string).toLowerCase();

          for (const et of el as StatFilter[]) {
            if (!this.excludes.has(et.id)) {
              this.statsById.set(et.id, et);
            }

            // construct option fuse
            if (et.option != null) {
              const index = Fuse.createIndex(['text'], et.option.options);
              et.option.fuse = new Fuse(
                et.option.options,
                {
                  keys: ['text'],
                  shouldSort: true,
                  threshold: 0.6,
                  location: 0,
                  distance: 1000,
                  includeScore: false
                },
                index
              );
            }
          }

          // construct fuse
          const entries = el as StatFilter[];
          const index = Fuse.createIndex<StatFilter>(['text'], entries);
          this.stats[tlb] = {
            entries: entries,
            fuse: new Fuse(
              entries,
              {
                keys: ['text'],
                shouldSort: true,
                threshold: 0.5,
                location: 0,
                includeScore: false
              },
              index
            )
          };
        }

        log.info('Mod stats loaded');
      });
    });

    ///////////////////////////////////////////// Save unique items
    this.uniques = uniques;

    ///////////////////////////////////////////// Load base categories/RePoE base data
    this.baseCat = new Map();
    this.baseMap = new Map();

    axios.get(URLs.pta.basecat).then((response: any) => {
      const data = response.data;

      for (const [k, o] of Object.entries(data)) {
        this.baseCat.set(k, o as string);
      }

      log.info('Base categories loaded');

      axios.get(URLs.repoe.base).then((response: any) => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          const o = val as any;

          const typeName = o['name'] as string;
          const itemClass = o['item_class'] as string;
          const implicits = o['implicits'].length as number;

          if (this.baseCat.has(itemClass)) {
            const itemCat = this.baseCat.get(itemClass);

            const cat = {} as any;

            cat['category'] = itemCat;
            cat['implicits'] = implicits;

            this.baseMap.set(typeName, cat);
          }
        }

        log.info('Item base data loaded');
      });
    });

    ///////////////////////////////////////////// Load RePoE mod data
    this.modData = new Map();

    axios.get(URLs.repoe.mods).then((response: any) => {
      const data = response.data;

      for (const [k, val] of Object.entries(data)) {
        const o = val as any;

        const modname = o['name'] as string;
        const modtype = o['generation_type'] as string;

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
    });

    ///////////////////////////////////////////// Load local rules
    this.armourLocals = new Set();
    this.weaponLocals = new Set();

    axios.get(URLs.pta.armour).then((response: any) => {
      const data = response.data;

      for (const e of data['data']) {
        this.armourLocals.add(e);
      }

      log.info('Armour locals loaded');
    });

    axios.get(URLs.pta.weapon).then((response: any) => {
      const data = response.data;

      for (const e of data['data']) {
        this.weaponLocals.add(e);
      }

      log.info('Weapon locals loaded');
    });

    ///////////////////////////////////////////// Load enchant rules
    this.enchantRules = new Map();

    axios.get(URLs.pta.enchant).then((response: any) => {
      const data = response.data;

      for (const [k, val] of Object.entries(data)) {
        const o = val as any;

        this.enchantRules.set(k, o);
      }

      log.info('Enchant rules loaded');
    });

    ///////////////////////////////////////////// Load pseudo rules
    this.pseudoRules = new Map();

    axios.get(URLs.pta.pseudo).then((response: any) => {
      const data = response.data;

      for (const [k, val] of Object.entries(data)) {
        const o = val as Array<any>;

        this.pseudoRules.set(k, o);
      }

      log.info('Pseudo rules loaded');
    });

    ///////////////////////////////////////////// Mod Discriminators
    this.discriminators = new Map();

    axios.get(URLs.pta.disc).then((response: any) => {
      const data = response.data;

      for (const [k, val] of Object.entries(data)) {
        const o = val as any;

        const set = new Set<string>();

        for (const value of o['unused']) {
          set.add(value as string);
        }

        this.discriminators.set(k, set);
      }

      log.info('Discriminator rules loaded');
    });

    ///////////////////////////////////////////// Priority rules
    this.priorityRules = new Map();

    axios.get(URLs.pta.priority).then((response: any) => {
      const data = response.data;

      for (const [k, val] of Object.entries(data)) {
        this.priorityRules.set(k, val as any);
      }

      log.info('Priority rules loaded');
    });
  }

  public parse(itemtext: string): Item | null {
    itemtext = itemtext.trim();

    const item = {} as Item;
    let sections = 0;

    const lines = new ItemText(itemtext);

    let line = lines.readLine();

    if (!line) {
      log.warn('Parse called on empty text');
      return null;
    }

    if (!line.startsWith('Rarity:')) {
      log.warn('Parse called on non PoE item text');
      return null;
    }

    item.origtext = itemtext;

    // Rarity
    const parts = line.split(': ');
    item.rarity = parts[1];

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
      sections++;
    } else {
      item.name = this.readName(nametype as string);
      item.type = this.readType(item, type as string);
    }

    // Process category
    if ('Gem' == item.rarity) {
      item.category = 'gem';

      // Initialize quality
      item.quality = 0;
    } else if ('Divination Card' == item.rarity) {
      item.category = item.rarity = 'card';
    }

    if (item.type.endsWith('Map')) {
      item.category = 'map';

      item.misc = item.misc ?? ({} as Misc);
      item.misc.disc = this.mapDisc; // Default map discriminator

      item.type = item.type.replace('Elder ', '');
      item.type = item.type.replace('Shaped ', '');
    }

    if (item.category == null && this.uniques.has(item.type)) {
      const search = this.uniques.get(item.type);
      if (search) {
        const je = search[0];
        if (je['type'] == 'Prophecy') {
          // this is a prophecy
          item.name = item.type;
          item.type = 'Prophecy';
          item.category = 'prophecy';
        }
      }
    }

    if (item.category == null) {
      if (this.baseMap.has(item.type)) {
        const cat = this.baseMap.get(item.type) as any;
        item.category = cat['category'];
      }
    }

    // Read the rest of the crap

    while ((line = lines.readLine()) !== false) {
      // Skip
      if (line.startsWith('---')) {
        this.section = '';
        sections++;
        continue;
      }

      if (!this.parseProp(item, line) && sections > 1) {
        // parse item stat
        this.parseStat(item, line, lines);
      }
    }

    // Process special/pseudo rules
    if (item.filters != null && Object.keys(item.filters).length) {
      for (const [key, fil] of Object.entries<Filter>(item.filters)) {
        if (this.pseudoRules.has(key)) {
          const rules = this.pseudoRules.get(key);

          if (rules) {
            for (const r of rules) {
              const pid = r['id'] as string;

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

    return item;
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
      item.misc = item.misc ?? ({} as Misc);
      item.misc.synthesis = true;
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
        item['quality'] = this.readPropInt(v);
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

  private parseStat(item: Item, stat: string, stream: ItemText) {
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
        item.misc.disc = master;
      }

      return true;
    }

    if (stat == 'Unidentified') {
      item.unidentified = true;
      return true;
    }

    if (stat == 'Shaper Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('shaper');
      return true;
    }

    if (stat == 'Elder Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('elder');
      return true;
    }

    if (stat == 'Crusader Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('crusader');
      return true;
    }

    if (stat == 'Redeemer Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('redeemer');

      return true;
    }

    if (stat == 'Hunter Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('hunter');

      return true;
    }

    if (stat == 'Warlord Item') {
      item.influences = item.influences ?? ([] as string[]);
      item.influences.push('warlord');

      return true;
    }

    if (stat == 'Corrupted') {
      item.corrupted = true;
      return true;
    }

    if (stat == 'Synthesised Item') {
      // Should already have been processed
      item.misc = item.misc ?? ({} as Misc);
      item.misc.synthesis = true;
      return true;
    }

    // Vaal gems
    if (item.category && item.category == 'gem' && stat.startsWith('Vaal ')) {
      item.type = stat;
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
      (stat.includes('reduced') || stat.includes('less'))
    ) {
      // If the stat line has a "reduced" value, try to
      // flip it and try again

      if (stat.includes('reduced')) {
        stat = stat.replace('reduced', 'increased');
        valstat = valstat.replace('reduced', 'increased');
      } else {
        stat = stat.replace('less', 'more');
        valstat = valstat.replace('less', 'more');
      }

      // set factor
      factor = -1;
    }

    // Handle enchant rules
    if (this.enchantRules.has(stat)) {
      const rule = this.enchantRules.get(stat) as any;

      if ('id' in rule) {
        found = true;
        foundEntry = this.statsById.get(rule['id']) as StatFilter;
      }

      if ('value' in rule) {
        val.push(rule['value']);
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

      stat = stat.substring(0, stat.indexOf(': ') + 2);
    }

    if (!found) {
      const results = this.stats[stattype].fuse.search(stat);

      // loop thru the first couple of results
      let idx = 0;
      while (results.length && idx < results.length) {
        const entry = results[idx].item;

        // check priority rules
        if (this.priorityRules.has(entry.id)) {
          const rule = this.priorityRules.get(entry.id) as Record<string, any>;

          if (item.filters == null) {
            // This mod has priorities but item has no filters yet
            idx++;
            continue;
          }

          const keys = Object.keys(item.filters);

          // check each priority
          const priorities = rule['priority'] as string[];
          const pass = priorities.every(p => {
            return keys.includes(p);
          });

          if (!pass) {
            // doesn't pass priority rules
            idx++;
            continue;
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

          const results = foundEntry.option.fuse.search(search);

          // look for exact matches within results
          results.some(e => {
            if (e.item.text.includes(search)) {
              selected = e.item.id;
              return true;
            }

            return false;
          });
        }
      }

      // insert this filter
      const filter = {
        ...foundEntry,
        value: [...val],
        enabled: false,
        selected: selected,
        min: null,
        max: null
      } as Filter;

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
