/* eslint-disable quotes */
import type { TradeMsg, TradeMessages } from '../../../types/trade';

const currencies = new Map([
  ['Orb of Alteration', 'alt'],
  ['Orb of Fusing', 'fusing'],
  ['Orb of Alchemy', 'alch'],
  ['Chaos Orb', 'chaos'],
  ["Gemcutter's Prism", 'gcp'],
  ['Exalted Orb', 'exalted'],
  ['Chromatic Orb', 'chrome'],
  ["Jeweller's Orb", 'jewellers'],
  ["Engineer's Orb", 'engineers'],
  ['Orb of Chance', 'chance'],
  ["Cartographer's Chisel", 'chisel'],
  ['Orb of Scouring', 'scour'],
  ['Blessed Orb', 'blessed'],
  ['Orb of Regret', 'regret'],
  ['Regal Orb', 'regal'],
  ['Divine Orb', 'divine'],
  ['Vaal Orb', 'vaal'],
  ['Orb of Annulment', 'annul'],
  ['Orb of Binding', 'orb-of-binding'],
  ['Ancient Orb', 'ancient-orb'],
  ['Orb of Horizons', 'orb-of-horizons'],
  ["Harbinger's Orb", 'harbingers-orb'],
  ['Scroll of Wisdom', 'wisdom'],
  ['Portal Scroll', 'portal'],
  ["Armourer's Scrap", 'scrap'],
  ["Blacksmith's Whetstone", 'whetstone'],
  ["Glassblower's Bauble", 'bauble'],
  ['Orb of Transmutation', 'transmute'],
  ['Orb of Augmentation', 'aug'],
  ['Mirror of Kalandra', 'mirror'],
  ['Perandus Coin', 'p'],
  ['Silver Coin', 'silver'],
]);

export default {
  en: [
    {
      test: 'Hi, I',
      types: [
        {
          reg: /^Hi, I would like to buy your (.+) listed for ([\d.]+) (\w+) in (\w+) \(stash tab "(.+)"; position: left (\d+), top (\d+)\)(.*)/,
          process: (
            name: string,
            type: string,
            match: RegExpExecArray | null,
          ) => {
            if (!match || match.length != 9) {
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
              msg: match[8],
              time: Date.now(),
            } as TradeMsg;

            if (currencies.has(tradeobj.currency)) {
              tradeobj.currency = currencies.get(tradeobj.currency) as string;
            }

            return tradeobj;
          },
        },
        {
          reg: /^Hi, I'd like to buy your (.+) for my ([\d.]+) ([\w\s]+) in (\w+).$/,
          process: (
            name: string,
            type: string,
            match: RegExpExecArray | null,
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
              time: Date.now(),
            } as TradeMsg;

            if (currencies.has(tradeobj.currency)) {
              tradeobj.currency = currencies.get(tradeobj.currency) as string;
            }

            return tradeobj;
          },
        },
      ],
    },
    {
      test: 'wtb ',
      types: [
        {
          reg: /^wtb (.+) listed for ([\d.]+) ([\w\s]+) in (\w+) \(stash "(.+)"; left (\d+), top (\d+)\)(.*)/,
          process: (
            name: string,
            type: string,
            match: RegExpExecArray | null,
          ) => {
            if (!match || match.length != 9) {
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
              msg: match[8],
              time: Date.now(),
            } as TradeMsg;

            if (currencies.has(tradeobj.currency)) {
              tradeobj.currency = currencies.get(tradeobj.currency) as string;
            }

            return tradeobj;
          },
        },
      ],
    },
  ],
} as TradeMessages;
