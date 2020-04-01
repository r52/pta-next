export default {
  official: {
    stats: 'https://www.pathofexile.com/api/trade/data/stats',
    items: 'https://www.pathofexile.com/api/trade/data/items',
    leagues: 'https://www.pathofexile.com/api/trade/data/leagues',
    trade: {
      fetch: 'https://www.pathofexile.com/api/trade/fetch/',
      search: 'https://www.pathofexile.com/api/trade/search/',
      exchange: 'https://www.pathofexile.com/api/trade/exchange/',
      site: 'https://www.pathofexile.com/trade/search/'
    }
  },
  repoe: {
    base:
      'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.min.json',
    mods:
      'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/mods.min.json'
  },
  pta: {
    basecat:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/base_categories.json',
    armour:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/armour_locals.json',
    weapon:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/weapon_locals.json',
    enchant:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/enchant_rules.json',
    pseudo:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/pseudo_rules.json',
    disc:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/discriminators.json',
    exclude:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/excludes.json',
    currency:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/currency.json',
    priority:
      'https://raw.githubusercontent.com/r52/pta-data/master/data/priority_rules.json'
  },
  poeprices: 'https://www.poeprices.info/api?'
};
