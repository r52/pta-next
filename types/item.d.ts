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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any; // allow indexing for looping
  id: string;
  type: string;
  text: string;
  value: number[];
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
  synthesis?: boolean;
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
}

interface Armour {
  ar?: number;
  ev?: number;
  es?: number;
  block?: number;
}

interface NumericRange {
  min: number;
  max: number;
}
