export enum QuickPasteKey {
  CTRL = 0,
  SHIFT = 1
}

export default {
  // pta
  checkForUpdates: 'pta.checkforupdates',
  autoUpdate: 'pta.autoUpdate',
  vulkanCompat: 'pta.vulkanCompat',

  // hotkey
  simplehotkey: 'hotkey.simple',
  simplehotkeyenabled: 'hotkey.simple_enabled',
  advancedhotkey: 'hotkey.advanced',
  advancedhotkeyenabled: 'hotkey.advanced_enabled',
  wikihotkey: 'hotkey.wiki',
  wikihotkeyenabled: 'hotkey.wiki_enabled',
  quickpaste: 'hotkey.quickpaste',
  quickpastemod: 'hotkey.quickpastemod',
  cscroll: 'hotkey.cscroll',

  // price check
  league: 'pricecheck.league',
  displaylimit: 'pricecheck.displaylimit',
  corruptoverride: 'pricecheck.corruptoverride',
  corruptsearch: 'pricecheck.corruptsearch',
  primarycurrency: 'pricecheck.primarycurrency',
  secondarycurrency: 'pricecheck.secondarycurrency',
  onlineonly: 'pricecheck.onlineonly',
  buyoutonly: 'pricecheck.buyoutonly',
  removedupes: 'pricecheck.removedupes',
  poeprices: 'pricecheck.poeprices',

  prefillmin: 'pricecheck.prefillmin',
  prefillmax: 'pricecheck.prefillmax',
  prefillrange: 'pricecheck.prefillrange',
  prefillnormals: 'pricecheck.prefillnormals',
  prefillpseudos: 'pricecheck.prefillpseudos',
  prefillilvl: 'pricecheck.prefillilvl',
  prefillbase: 'pricecheck.prefillbase',

  // client
  clientlogpath: 'client.logpath',

  // custom macros
  macros: 'macros.list',

  // trade ui
  tradeui: 'tradeui.enabled',
  tradebar: 'tradeui.tradebar',
  tradecharname: 'tradeui.charname',
  tradestashhighlight: 'tradeui.highlight',
  tradestashquad: 'tradeui.quad',
  tradeuiincoming: 'tradeui.incoming',
  tradeuioutgoing: 'tradeui.outgoing',

  default: {
    // pta
    checkForUpdates: true,
    autoUpdate: true,
    vulkanCompat: false,

    // hotkey
    simplehotkey: 'CmdOrCtrl+D',
    simplehotkeyenabled: true,
    advancedhotkey: 'CmdOrCtrl+Alt+D',
    advancedhotkeyenabled: true,
    wikihotkey: 'CmdOrCtrl+Alt+G',
    wikihotkeyenabled: true,
    quickpaste: false,
    quickpastemod: QuickPasteKey.CTRL,
    cscroll: true,

    // price check
    league: 0,
    displaylimit: 20,
    corruptoverride: false,
    corruptsearch: 'Any',
    primarycurrency: 'chaos',
    secondarycurrency: 'exalted',
    onlineonly: true,
    buyoutonly: true,
    removedupes: true,
    poeprices: true,

    prefillmin: false,
    prefillmax: false,
    prefillrange: 0,
    prefillnormals: false,
    prefillpseudos: true,
    prefillilvl: false,
    prefillbase: false,

    //client
    clientlogpath: '',

    // custom macros
    macros: [
      {
        name: 'hideout',
        key: 'F5',
        type: 'chat',
        command: '/hideout'
      }
    ],

    // trade ui
    tradeui: false,
    tradebar: true,
    tradecharname: '',
    tradestashhighlight: false,
    tradestashquad: [],
    tradeuiincoming: [
      {
        label: 'ty',
        command: 'ty',
        close: false
      },
      {
        label: '1m',
        command: '1 minute',
        close: false
      },
      {
        label: 'no thx',
        command: 'no thanks',
        close: true
      }
    ],
    tradeuioutgoing: [
      {
        label: 'ty',
        command: 'ty',
        close: false
      }
    ]
  }
};
