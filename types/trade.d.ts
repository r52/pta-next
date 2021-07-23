export interface TradeMsg {
  name: string;
  type: string;
  item: string;
  price: number;
  currency: string;
  league: string;
  tab?: string;
  x?: number;
  y?: number;
  msg?: string;
  time: number;
}

export interface TradeCommand {
  label: string;
  command: string;
  close: boolean;
}

export interface TabInfo {
  name: string;
  x: number;
  y: number;
  quad: boolean;
}

export interface TradeMessages {
  [index: string]: TradeMessageProcess[];
}

export interface TradeMessageProcess {
  test: string;
  types: TradeMessageProcessor[];
}

export interface TradeMessageProcessor {
  reg: RegExp;
  process(
    name: string,
    type: string,
    match: RegExpExecArray | null,
  ): TradeMsg | null;
}

export interface TradeNotification extends TradeMsg {
  commands: TradeCommand[];
  curtime: string;
  newwhisper: boolean;
  enteredarea: boolean;
}
