import MultiMap from 'multimap';
import log from 'electron-log';
import axios from 'axios';

// URLs

// official
const uApiStats = 'https://www.pathofexile.com/api/trade/data/stats';
const uApiItems = 'https://www.pathofexile.com/api/trade/data/items';

// RePoE
const uRepoeBase =
  'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.min.json';
const uRepoeMods =
  'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/mods.min.json';

// PTA
const uPtaBasecat =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/base_categories.json';
const uPtaArmourlocals =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/armour_locals.json';
const uPtaWeaponlocals =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/weapon_locals.json';
const uPtaEnchantrules =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/enchant_rules.json';
const uPtaPseudorules =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/pseudo_rules.json';
const uPtaDisc =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/discriminators.json';
const uPtaExcludes =
  'https://raw.githubusercontent.com/r52/pta-data/master/data/excludes.json';

function replaceAt(str: string, idx: number, len: number, rep: string) {
  const replacement = str.substring(0, idx) + rep + str.substring(idx + len);
  return replacement;
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
  private static instance: ItemParser;

  modData: Map<string, string>;
  uniques: MultiMap;
  baseCat: Map<string, string>;
  baseMap: Map<string, Record<string, any>>;
  excludes: Set<string>;
  statsByText: MultiMap;
  statsById: Map<string, Record<string, any>>;
  weaponLocals: Set<string>;
  armourLocals: Set<string>;
  enchantRules: Map<string, Record<string, any>>;
  pseudoRules: Map<string, Record<string, any>[]>;
  discriminators: Map<string, Set<string>>;
  mapDisc = 'warfortheatlas';

  private section = '';

  private constructor() {
    ///////////////////////////////////////////// Download excludes/stats
    this.excludes = new Set();
    this.statsById = new Map();
    this.statsByText = new MultiMap();

    axios
      .get(uPtaExcludes)
      .then((response: any) => {
        const data = response.data;

        for (const e of data['excludes']) {
          this.excludes.add(e);
        }

        log.info('Excludes loaded');

        axios
          .get(uApiStats)
          .then((response: any) => {
            const data = response.data;

            const stt = data['result'];

            for (const type of stt) {
              const el = type['entries'];

              for (const et of el) {
                // Cut the key for multiline mods
                let text = et['text'];
                const id = et['id'];

                const nl = text.search('\n');
                if (nl > 0) {
                  text = text.substring(0, nl);
                }

                if (!this.excludes.has(id)) {
                  this.statsByText.set(text, et);
                  this.statsById.set(id, et);
                }
              }
            }

            log.info('Mod stats loaded');
          })
          .catch((error: any) => {
            log.error(error);
          });
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Download unique items
    this.uniques = new MultiMap();

    axios
      .get(uApiItems)
      .then((response: any) => {
        const data = response.data;
        const itm = data['result'];

        for (const type of itm) {
          const el = type['entries'];

          for (const et of el) {
            if ('name' in et) {
              this.uniques.set(et['name'], et);
            } else if ('type' in et) {
              this.uniques.set(et['type'], et);
            } else {
              log.debug('Item entry has neither name nor type:', et);
            }
          }
        }

        log.info('Unique item data loaded');
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Load base categories/RePoE base data
    this.baseCat = new Map();
    this.baseMap = new Map();

    axios
      .get(uPtaBasecat)
      .then((response: any) => {
        const data = response.data;

        for (const [k, o] of Object.entries(data)) {
          this.baseCat.set(k, o as string);
        }

        log.info('Base categories loaded');

        axios
          .get(uRepoeBase)
          .then((response: any) => {
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
          })
          .catch((error: any) => {
            log.error(error);
          });
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Load RePoE mod data
    this.modData = new Map();

    axios
      .get(uRepoeMods)
      .then((response: any) => {
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
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Load local rules
    this.armourLocals = new Set();
    this.weaponLocals = new Set();

    axios
      .get(uPtaArmourlocals)
      .then((response: any) => {
        const data = response.data;

        for (const e of data['data']) {
          this.armourLocals.add(e);
        }

        log.info('Armour locals loaded');
      })
      .catch((error: any) => {
        log.error(error);
      });

    axios
      .get(uPtaWeaponlocals)
      .then((response: any) => {
        const data = response.data;

        for (const e of data['data']) {
          this.weaponLocals.add(e);
        }

        log.info('Weapon locals loaded');
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Load enchant rules
    this.enchantRules = new Map();

    axios
      .get(uPtaEnchantrules)
      .then((response: any) => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          const o = val as any;

          this.enchantRules.set(k, o);
        }

        log.info('Enchant rules loaded');
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Load pseudo rules
    this.pseudoRules = new Map();

    axios
      .get(uPtaPseudorules)
      .then((response: any) => {
        const data = response.data;

        for (const [k, val] of Object.entries(data)) {
          const o = val as Array<any>;

          this.pseudoRules.set(k, o);
        }

        log.info('Pseudo rules loaded');
      })
      .catch((error: any) => {
        log.error(error);
      });

    ///////////////////////////////////////////// Mod Discriminators
    this.discriminators = new Map();

    axios
      .get(uPtaDisc)
      .then((response: any) => {
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
      })
      .catch((error: any) => {
        log.error(error);
      });
  }

  public static getInstance(): ItemParser {
    if (!ItemParser.instance) {
      ItemParser.instance = new ItemParser();
    }

    return ItemParser.instance;
  }

  public parse(itemtext: string) {
    const item = {} as any;
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

    item['origtext'] = itemtext;

    // Rarity
    const parts = line.split(': ');
    item['rarity'] = parts[1];

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
      item['type'] = this.readType(item, nametype as string);
      sections++;
    } else {
      item['name'] = this.readName(nametype as string);
      item['type'] = this.readType(item, type as string);
    }

    // Process category
    if ('Gem' == item['rarity']) {
      item['category'] = 'gem';

      // Initialize quality
      item['quality'] = 0;
    } else if ('Divination Card' == item['rarity']) {
      item['category'] = item['rarity'] = 'card';
    }

    if (item['type'].endsWith('Map')) {
      item['category'] = 'map';
      item['misc']['disc'] = this.mapDisc; // Default map discriminator

      item['type'] = item['type'].replace('Elder ', '');
      item['type'] = item['type'].replace('Shaped ', '');
    }

    if (
      (!('category' in item) || !item['category']) &&
      this.uniques.has(item['type'])
    ) {
      const search = this.uniques.get(item['type']);
      if (search) {
        const je = search[0];
        if (je['type'] == 'Prophecy') {
          // this is a prophecy
          item['name'] = item['type'];
          item['type'] = 'Prophecy';
          item['category'] = 'prophecy';
        }
      }
    }

    if (!('category' in item) || !item['category']) {
      if (this.baseMap.has(item['type'])) {
        const cat = this.baseMap.get(item['type']) as any;
        item['category'] = cat['category'];
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

      if (line.includes(':')) {
        // parse item prop
        this.parseProp(item, line);
      } else if (sections > 1) {
        // parse item stat
        this.parseStat(item, line, lines);
      }
    }

    // Process special/pseudo rules
    if (Object.keys(item['filters']).length) {
      for (const key in item['filters']) {
        const fil = item['filters'][key];

        if (this.pseudoRules.has(key)) {
          const rules = this.pseudoRules.get(key);

          if (rules) {
            for (const r of rules) {
              const pid = r['id'];

              const pentry = this.statsById.get(pid);

              if (!(pid in item['pseudos'])) {
                const psEntry = { ...pentry, enabled: false, value: [] } as any;

                for (const v of fil['value']) {
                  psEntry['value'].push(v * r['factor']);
                }

                item['pseudo'][pid] = psEntry;
              } else {
                const psEntry = item['pseudos'][pid];

                for (let i = 0; i < fil['value'].length; i++) {
                  const v = fil['value'][i];

                  // XXX: only support one operation right now
                  // also remove is useless
                  if (r['op'] == 'add') {
                    psEntry['value'][i] = psEntry['value'][i] + v * r['factor'];
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

  private readType(item: any, type: string) {
    type = type.replace(/<<.*?>>|<.*?>/g, '');
    type = type.replace('Superior ', '');

    if (type.startsWith('Synthesised ')) {
      type = type.replace('Synthesised ', '');
      item['misc']['synthesis'] = true;
    }

    if (item['rarity'] === 'Magic') {
      // Parse out magic affixes
      // Try to get rid of all suffixes by forward catching " of"
      const re = /[\w'-]+/g;

      let words = Array.from(type.matchAll(re), m => m[0]);

      const prefix = words[0];

      // Remove prefixes
      if (this.modData.has(prefix) && this.modData.get(prefix) == 'prefix') {
        words.shift();
      }

      if (words.indexOf('of')) {
        words = words.slice(0, words.indexOf('of'));
      }

      type = words.join(' ');
    }

    return type;
  }

  private parseProp(item: any, prop: string) {
    const parts = prop.split(':');

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
        item['armour'] = item['armour'] || {};
        item['armour']['ev'] = this.readPropInt(v);
        break;
      case 'Energy Shield':
        item['armour'] = item['armour'] || {};
        item['armour']['es'] = this.readPropInt(v);
        break;
      case 'Armour':
        item['armour'] = item['armour'] || {};
        item['armour']['ar'] = this.readPropInt(v);
        break;
      case 'Chance to Block':
        item['armour'] = item['armour'] || {};
        item['armour']['block'] = this.readPropInt(v);
        break;
      case 'Physical Damage':
        item['weapon'] = item['weapon'] || {};
        item['weapon']['pdps'] = this.readPropIntRange(v);
        break;
      case 'Critical Strike Chance':
        item['weapon'] = item['weapon'] || {};
        item['weapon']['crit'] = this.readPropFloat(v);
        break;
      case 'Attacks per Second':
        item['weapon'] = item['weapon'] || {};
        item['weapon']['aps'] = this.readPropFloat(v);
        break;
      case 'Elemental Damage':
        item['weapon'] = item['weapon'] || {};
        item['weapon']['edps'] = this.readPropIntRange(v);
        break;
      case 'Requirements':
        this.section = 'Requirements';
        break;
      case 'Level':
        if (this.section == 'Requirements') {
          item['requirements'] = item['requirements'] || {};
          item['requirements']['lvl'] = this.readPropInt(v);
        } else {
          item['misc'] = item['misc'] || {};
          item['misc']['gem_level'] = this.readPropInt(v);
        }
        break;
      case 'Str':
        item['requirements'] = item['requirements'] || {};
        item['requirements']['str'] = this.readPropInt(v);
        break;
      case 'Dex':
        item['requirements'] = item['requirements'] || {};
        item['requirements']['dex'] = this.readPropInt(v);
        break;
      case 'Int':
        item['requirements'] = item['requirements'] || {};
        item['requirements']['int'] = this.readPropInt(v);
        break;
      case 'Sockets':
        item['sockets'] = this.readSockets(v);
        break;
      case 'Item Level':
        item['ilvl'] = this.readPropInt(v);
        break;
      case 'Experience':
        item['misc'] = item['misc'] || {};
        item['misc']['gem_progress'] = v;
        break;
      case 'Map Tier':
        item['misc'] = item['misc'] || {};
        item['misc']['map_tier'] = this.readPropInt(v);
        break;
    }
  }

  private readPropInt(prop: string) {
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

  private readPropIntRange(prop: string) {
    const val = {
      min: 0,
      max: 0
    };

    // If it is a list, process list
    if (prop.includes(', ')) {
      // Split and recursively read
      const list = prop.split(', ');

      for (const item of list) {
        const nxt = this.readPropIntRange(item);
        val['min'] = val['min'] + nxt['min'];
        val['max'] = val['max'] + nxt['max'];
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

      val['min'] = parseInt(v1);
      val['max'] = parseInt(v2);
    }

    return val;
  }

  private readPropFloat(prop: string) {
    // Remove augmented tag
    prop = prop.replace(' (augmented)', '');

    const re = /^([+-]?[\d.]+)%?/g;
    const match = prop.match(re);

    if (match) {
      const val = match[0];
      return parseFloat(val);
    }

    return 0.0;
  }

  private readSockets(prop: string) {
    const sockets = {} as any;

    sockets['links'] = 0;
    sockets['total'] = 0;
    sockets['R'] = 0;
    sockets['G'] = 0;
    sockets['B'] = 0;
    sockets['W'] = 0;
    sockets['A'] = 0;
    sockets['D'] = 0;

    const llist = prop.split(' ');

    for (const lpart of llist) {
      const socks = lpart.split('-');

      if (socks.length > 1 && socks.length > sockets['links']) {
        // New max links
        sockets['links'] = socks.length;
      }

      for (const s of socks) {
        sockets[s] = sockets[s] + 1;
        sockets['total'] = sockets['total'] + 1;
      }
    }

    return sockets;
  }

  private parseStat(item: any, stat: string, stream: ItemText) {
    const origstat = String(stat);

    // Special rule for A Master Seeks Help
    if (
      'category' in item &&
      item['category'] &&
      item['category'] == 'prophecy' &&
      item['name'] == 'A Master Seeks Help'
    ) {
      const re = /^You will find (\w+) and complete her mission.$/g;
      const match = stat.match(re);
      if (match) {
        const master = match[0];

        item['misc']['disc'] = master;
      }

      return true;
    }

    if (stat == 'Unidentified') {
      item['unidentified'] = true;
      return true;
    }

    if (stat == 'Shaper Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('shaper');
      return true;
    }

    if (stat == 'Elder Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('elder');
      return true;
    }

    if (stat == 'Crusader Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('crusader');
      return true;
    }

    if (stat == 'Redeemer Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('redeemer');

      return true;
    }

    if (stat == 'Hunter Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('hunter');

      return true;
    }

    if (stat == 'Warlord Item') {
      item['influences'] = item['influences'] || [];
      item['influences'].push('warlord');

      return true;
    }

    if (stat == 'Corrupted') {
      item['corrupted'] = true;
      return true;
    }

    if (stat == 'Synthesised Item') {
      // Should already have been processed
      item['misc']['synthesis'] = true;
      return true;
    }

    // Vaal gems
    if (
      'category' in item &&
      item['category'] &&
      item['category'] == 'gem' &&
      stat.startsWith('Vaal ')
    ) {
      item['type'] = stat;
      return true;
    }

    // PoE 3.9 adds the "(implicit)" description so we no longer have to guess
    let stattype = '';

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

    // Match numerics
    const re = /([+-]?[\d.]+)/g;
    let captured: string[] = [];

    const val: number[] = [];
    let stoken = stat;

    // First try original line
    let found = this.statsByText.has(stoken);

    if (!found) {
      // Then, try replacing the num stats

      this.captureNumerics(stat, re, val, captured);

      // Craft search token
      stat = stat.replace(re, '#');

      stoken = stat;
      found = this.statsByText.has(stoken);
    }

    // Process local rules
    if ('weapon' in item || 'armour' in item) {
      const islocalstat =
        ('weapon' in item && this.weaponLocals.has(stoken)) ||
        ('armour' in item && this.armourLocals.has(stoken));

      if (islocalstat) {
        stat += ' (Local)';

        stoken = stat;
        found = this.statsByText.has(stoken);
      }
    }

    if (
      !found &&
      val.length &&
      (stat.search('reduced') > 0 || stat.search('less') > 0)
    ) {
      // If the stat line has a "reduced" value, try to
      // flip it and try again

      if (stat.search('reduced') > 0) {
        stat = stat.replace('reduced', 'increased');
        // orig_stat.replace("reduced", "increased");
      } else {
        stat = stat.replace('less', 'more');
        // orig_stat.replace("less", "more");
      }

      // replace last
      let v = val[val.length - 1];

      if (Number.isInteger(v)) {
        v = v * -1;
      } else {
        v = v * -1.0;
      }

      stoken = stat;
      found = this.statsByText.has(stoken);
    }

    // Handle enchant rules
    if (this.enchantRules.has(stoken)) {
      const rule = this.enchantRules.get(stoken) as any;

      if ('id' in rule) {
        found = true;

        const modobj = this.statsById.get(rule['id']) as any;

        stoken = modobj['text'] as string;
        stat = stoken;
      }

      if ('value' in rule) {
        val.push(rule['value']);
      }
    }

    if (!found) {
      // Try forward replace search
      let frep = String(origstat);
      let frepplus = String(frep);

      while (!found && frep.search(re) > 0 && captured.length) {
        // Try putting back some values in case the mod itself has hardcoded values
        frep = replaceAt(
          frep,
          frep.indexOf(captured[0]),
          captured[0].length,
          '#'
        );
        frepplus = replaceAt(
          frepplus,
          frepplus.indexOf(captured[0]),
          captured[0].length,
          '+#'
        );

        stoken = frep;
        found = this.statsByText.has(stoken);

        if (!found) {
          // Try plus version
          stoken = frepplus;
          found = this.statsByText.has(stoken);
        }

        if (found) {
          // Delete value used
          captured.pop();
          val.pop();
        }
      }
    }

    if (!found) {
      // Reverse replace search
      let rrep = String(origstat);
      let rrepplus = String(rrep);

      while (!found && rrep.search(re) > 0 && captured.length) {
        // Try putting back some values in case the mod itself has hardcoded values
        rrep = replaceAt(
          rrep,
          rrep.lastIndexOf(captured[captured.length - 1]),
          captured[captured.length - 1].length,
          '#'
        );
        rrepplus = replaceAt(
          rrepplus,
          rrepplus.lastIndexOf(captured[captured.length - 1]),
          captured[captured.length - 1].length,
          '#'
        );

        stoken = rrep;
        found = this.statsByText.has(stoken);

        if (!found) {
          // Try plus version
          stoken = rrepplus;
          found = this.statsByText.has(stoken);
        }

        if (found) {
          // Delete value used
          captured.shift();
          val.shift();
        }
      }
    }

    // Give up
    if (!found) {
      log.debug('Ignored/unprocessed line', origstat);
      return false;
    }

    const multiline: string[] = [];
    let filter = {} as any;

    const range = this.statsByText.get(stoken);
    for (const entry of range) {
      const text = entry['text'];

      const proc = new ItemText(text);
      const lines = proc.lines;

      // Bump the first line since we know it has matched
      lines.shift();

      if (lines.length > 0) {
        // If this is a multiline mod
        // Match the other lines as well
        let matches = true;

        // Read in the other lines if we haven't yet
        while (multiline.length < lines.length) {
          const nextline = stream.readLine();
          multiline.push(nextline as string);
        }

        const lvals: number[] = [];
        const lcap: string[] = [];

        for (let i = 0; i < multiline.length; i++) {
          if (multiline[i] != lines[i]) {
            // Try capturing values
            let statline = multiline[i];
            this.captureNumerics(statline, re, lvals, lcap);

            statline = statline.replace(re, '#');

            if (statline != lines[i]) {
              // Try the plus version
              statline = multiline[i];
              statline = statline.replace(re, '+#');

              if (statline != lines[i]) {
                matches = false;
                break;
              }
            }
          }
        }

        if (!matches) {
          // Doesn't match, continue
          continue;
        }

        // Need to merge captured numerics
        for (let i = 0; i < lvals.length; i++) {
          val.push(lvals[i]);
        }

        captured = captured.concat(lcap);
      }

      if (stattype) {
        if (entry['type'] != stattype) {
          // skip this entry
          continue;
        }

        // use crafted stat
        filter = { ...entry, value: [...val], enabled: false };
        break;
      } else {
        if (entry['type'] == 'pseudo') {
          // skip pseudos
          continue;
        }

        const id = entry['id'];

        if (
          this.discriminators.has(id) &&
          (this.discriminators.get(id) as Set<string>).has(item['category'])
        ) {
          // Discriminator skip
          continue;
        }

        if (entry['type'] == 'explicit') {
          filter = { ...entry, value: [...val], enabled: false };
        }
      }
    }

    if (Object.keys(filter).length === 0) {
      log.debug('Error parsing stat line', origstat);
      return false;
    }

    item['filters'] = item['filters'] || {};

    const fid = filter['id'];

    // If the item already has this filter, merge them
    if (fid in item['filters']) {
      const efil = item['filters'][fid];

      const count = efil['value'].length;

      for (let i = 0; i < count; i++) {
        efil['value'][i] = efil['value'][i] + filter['value'][i];
      }
    } else {
      item['filters'][fid] = { ...filter };
    }

    return true;
  }

  private captureNumerics(
    line: string,
    re: RegExp,
    val: number[],
    captured: string[]
  ) {
    const words = Array.from(line.matchAll(re), m => m[0]);

    for (const word of words) {
      captured.push(word);

      let numval: number;

      if (word.search('.') > 0) {
        numval = parseFloat(word);
      } else {
        numval = parseInt(word);
      }

      val.push(numval);
    }
  }
}
