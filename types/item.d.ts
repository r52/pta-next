interface Item {
  origtext: string;
  rarity: string;
  type: string;
  name?: string;
  category?: string;
  quality?: number;
  ilvl?: number;
  unidentified?: boolean;
  corrupted?: boolean;
  fractured?: boolean;
  synthesised?: boolean;
  influences?: string[];

  filters?: {
    [index: string]: Filter;
  };

  pseudos?: {
    [index: string]: Filter;
  };

  sockets?: Sockets;
  misc?: Misc;
  requirements?: Requirements;
  weapon?: Weapon;
  armour?: Armour;
}

interface Filter {
  [index: string]:
    | string
    | number
    | number[]
    | boolean
    | { options: FilterOption[] }
    | null
    | undefined; // allow indexing for looping
  id: string;
  type: string;
  text: string;
  value: number[];
  option?: {
    options: FilterOption[];
  };

  selected: number | null;
  min: number | null;
  max: number | null;

  // these 2 should not exist at the same time
  // and is only there to support reactive states in vue
  // as well as how the trade site handles this flag
  enabled?: boolean;
  disabled?: boolean;
}

interface Misc {
  disc?: string;
  gemlevel?: number;
  gemprogress?: string;
  maptier?: number;
}

interface Sockets {
  [index: string]: number;
  links: number;
  total: number;
  R: number;
  G: number;
  B: number;
  W: number;
  A: number;
  D: number;
}

interface Requirements {
  lvl?: number;
  str?: number;
  dex?: number;
  int?: number;
}

interface Weapon {
  aps: number;
  crit: number;
  pdps?: NumericRange;
  edps?: NumericRange;

  mqpdps?: NumericRange;
}

interface Armour {
  ar?: number;
  ev?: number;
  es?: number;
  block?: number;

  mqar?: number;
  mqev?: number;
  mqes?: number;
}

interface NumericRange {
  min: number;
  max: number;
}

interface StatType {
  entries: StatFilter[];
  fuse: Fuse.default<StatFilter, Fuse.default.IFuseOptions<StatFilter>>;
}

interface StatFilter {
  id: string;
  text: string;
  type: string;
  option?: StatFilterOptions;
}

interface StatFilterOptions {
  options: FilterOption[];
  fuse: Fuse.default<FilterOption, Fuse.default.IFuseOptions<FilterOption>>;
}

interface FilterOption {
  id: number;
  text: string;
}

interface PriceAPI {
  searchItemWithDefaults(event: Electron.IpcMainEvent, item: Item): void;
  searchItemWithOptions?(
    event: Electron.IpcMainEvent,
    item: Item,
    options: ItemOptions,
    openbrowser: boolean
  ): void;
}

interface PTASettings {
  league: string;
  displaylimit: number;
  corruptoverride: boolean;
  corruptsearch: string;
  primarycurrency: string;
  secondarycurrency: string;
  onlineonly: boolean;
  buyoutonly: boolean;
  removedupes: boolean;
  prefillmin: boolean;
  prefillmax: boolean;
  prefillrange: number;
  prefillnormals: boolean;
  prefillpseudos: boolean;
  prefillilvl: boolean;
  prefillbase: boolean;
}

interface MinMaxToggle {
  [index: string]: boolean | number | null; // allow indexing
  enabled: boolean;
  min: number | null;
  max: number | null;
}

interface ItemOptions {
  [index: string]: MinMaxToggle | boolean | string | string[]; // allow indexing
  usepdps: MinMaxToggle;
  useedps: MinMaxToggle;
  usear: MinMaxToggle;
  useev: MinMaxToggle;
  usees: MinMaxToggle;
  usesockets: boolean;
  uselinks: boolean;
  useilvl: boolean;
  useitembase: boolean;
  usecorrupted: string;
  influences: string[];
  usefractured: boolean;
  usesynthesised: boolean;
}
