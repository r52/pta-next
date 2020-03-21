export default {
  // hotkey
  simplehotkey: 'hotkey.simple',
  simplehotkeyenabled: 'hotkey.simple_enabled',
  advancedhotkey: 'hotkey.advanced',
  advancedhotkeyenabled: 'hotkey.advanced_enabled',
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
  prefillmin: 'pricecheck.prefillmin',
  prefillmax: 'pricecheck.prefillmax',
  prefillrange: 'pricecheck.prefillrange',
  prefillnormals: 'pricecheck.prefillnormals',
  prefillpseudos: 'pricecheck.prefillpseudos',
  prefillilvl: 'pricecheck.prefillilvl',
  prefillbase: 'pricecheck.prefillbase',

  //client
  clientlogpath: 'client.logpath',

  // custom macros
  macros: 'macros.list',

  default: {
    // hotkey
    simplehotkey: 'CmdOrCtrl+D',
    simplehotkeyenabled: true,
    advancedhotkey: 'CmdOrCtrl+Alt+D',
    advancedhotkeyenabled: true,
    cscroll: true,

    // price check
    league: 0,
    displaylimit: 50,
    corruptoverride: false,
    corruptsearch: 'Any',
    primarycurrency: 'chaos',
    secondarycurrency: 'exa',
    onlineonly: true,
    buyoutonly: true,
    removedupes: true,
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
    ]
  }
};
