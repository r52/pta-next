interface TradeMsg {
  [index: string]: string | number | undefined;
  name: string;
  type: string;
  item: string;
  price: number;
  currency: string;
  league: string;
  tab?: string;
  x?: number;
  y?: number;
  time: number;
}

interface TradeCommand {
  label: string;
  command: string;
  close: boolean;
}

interface TabInfo {
  name: string;
  x: number;
  y: number;
  quad: boolean;
}
