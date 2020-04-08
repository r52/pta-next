export default {
  en: {
    test: 'Hi, I',
    types: [
      {
        reg: /^Hi, I would like to buy your (.+) listed for ([\d.]+) (\w+) in (\w+) \(stash tab "(.+)"; position: left (\d+), top (\d+)\)$/,
        process: (
          name: string,
          type: string,
          match: RegExpExecArray | null
        ) => {
          if (!match || match.length != 8) {
            return null;
          }

          const tradeobj = {
            name: name,
            type: type,
            item: match[1],
            price: parseFloat(match[2]),
            currency: match[3],
            league: match[4],
            tab: match[5],
            x: parseInt(match[6]),
            y: parseInt(match[7]),
            time: Date.now()
          } as TradeMsg;

          return tradeobj;
        }
      },
      {
        reg: /^Hi, I'd like to buy your (.+) for my ([\d.]+) ([\w\s]+) in (\w+).$/,
        process: (
          name: string,
          type: string,
          match: RegExpExecArray | null
        ) => {
          if (!match || match.length != 5) {
            return null;
          }

          const tradeobj = {
            name: name,
            type: type,
            item: match[1],
            price: parseFloat(match[2]),
            currency: match[3],
            league: match[4],
            time: Date.now()
          } as TradeMsg;

          return tradeobj;
        }
      }
    ]
  }
} as TradeMessages;
