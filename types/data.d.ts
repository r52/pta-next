// Incomplete schemas for essential data downloaded and used by PTA-Next

declare namespace Data {
  // https://www.pathofexile.com/api/trade/data/leagues
  interface Leagues {
    result: {
      id: string;
      text: string;
    }[];
  }

  // https://www.pathofexile.com/api/trade/data/items
  interface UniqueItemEntry {
    name?: string;
    type: string;
    text: string;
    disc?: string;
    flags?: {
      unique: boolean;
    };
  }

  interface Items {
    result: {
      label: string;
      entries: UniqueItemEntry[];
    }[];
  }

  // https://www.pathofexile.com/api/trade/data/stats
  interface Stats {
    result: {
      label: string;
      entries: StatFilter[];
    }[];
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/excludes.json
  interface Excludes {
    excludes: string[];
  }

  // https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.min.json
  interface BaseItems {
    [index: string]: {
      name: string;
      item_class: string;
      implicits: string[];
    };
  }

  interface BaseMap {
    category: string;
    implicits: number;
  }

  // https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.min.json
  interface BaseMods {
    [index: string]: {
      name: string;
      generation_type: string;
    };
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/enchant_rules.json
  interface EnchantRule {
    id?: string;
    value?: number;
  }

  interface Enchants {
    [index: string]: EnchantRule;
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/pseudo_rules.json
  interface PseudoRule {
    id: string;
    op: string;
    factor: number;
    remove: boolean;
  }

  interface Pseudos {
    [index: string]: PseudoRule[];
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/discriminators.json
  interface Discriminators {
    [index: string]: {
      unused: string[];
    };
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/priority_rules.json
  interface PriorityRule {
    priority: string[];
  }

  interface Priority {
    [index: string]: PriorityRule;
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/armour_locals.json
  // https://raw.githubusercontent.com/r52/pta-data/master/data/weapon_locals.json
  interface ArrayData {
    data: string[];
  }

  // https://raw.githubusercontent.com/r52/pta-data/master/data/base_categories.json
  // https://raw.githubusercontent.com/r52/pta-data/master/data/currency.json
  interface DictData {
    [index: string]: string;
  }
}
