interface TradeMsg {
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

interface TradeMessages {
  [index: string]: TradeMessageProcess;
}

interface TradeMessageProcess {
  test: string;
  types: TradeMessageProcessor[];
}

interface TradeMessageProcessor {
  reg: RegExp;
  process(
    name: string,
    type: string,
    match: RegExpExecArray | null
  ): TradeMsg | null;
}

interface TradeNotification extends TradeMsg {
  commands: TradeCommand[];
  curtime: string;
  newwhisper: boolean;
  enteredarea: boolean;
}
