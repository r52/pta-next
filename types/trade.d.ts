interface TradeMsg {
  name: string;
  type: string;
  item: string;
  price: number;
  currency: string;
  league: string;
  tab: string;
  x: number;
  y: number;
  time: number;
}

interface TradeCommand {
  label: string;
  command: string;
  close: boolean;
}