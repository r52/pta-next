export enum QuickPasteKey {
  CTRL = 0,
  SHIFT = 1,
}

export default {
  // hotkey
  quickpaste: 'hotkey.quickpaste',
  quickpastemod: 'hotkey.quickpastemod',

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

  // cheat sheets
  cheatsheetincursion: 'cheatsheet.incursion',
  cheatsheetbetrayal: 'cheatsheet.betrayal',

  default: {
    // hotkey
    quickpaste: false,
    quickpastemod: QuickPasteKey.CTRL,

    //client
    clientlogpath: '',

    // custom macros
    macros: [
      {
        name: 'hideout',
        key: 'F5',
        type: 'chat',
        command: '/hideout',
      },
    ],

    // trade ui
    tradeui: false,
    tradebar: true,
    tradecharname: '',
    tradestashhighlight: false,
    tradestashquad: [] as string[],
    tradeuiincoming: [
      {
        label: 'ty',
        command: 'ty',
        close: false,
      },
      {
        label: '1m',
        command: '1 minute',
        close: false,
      },
      {
        label: 'no thx',
        command: 'no thanks',
        close: true,
      },
    ],
    tradeuioutgoing: [
      {
        label: 'ty',
        command: 'ty',
        close: false,
      },
    ],

    // cheat sheet
    cheatsheetincursion: '',
    cheatsheetbetrayal: '',
  },
};
