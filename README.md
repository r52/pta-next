# PTA-Next

[![License](https://img.shields.io/github/license/r52/pta-next)](https://github.com/r52/pta-next/blob/master/LICENSE)
![Windows Build](https://github.com/r52/pta-next/workflows/Windows%20Build/badge.svg)
[![Build status](https://ci.appveyor.com/api/projects/status/9wd2911nsfftijk9?svg=true)](https://ci.appveyor.com/project/r52/pta-next)

PTA-Next is a [MercuryTrade](https://github.com/Exslims/MercuryTrade) style [trade notification UI/manager](https://github.com/r52/pta-next/wiki#trade-ui).

PTA is licensed under GPL-3.0

### **Update July 2021**

As of the current version, PTA-Next no longer provides trade macro/price checking, custom macros and hotkeys, or mousewheel stash scrolling functionality. Go use the amazing [Awakened PoE Trade](https://github.com/SnosMe/awakened-poe-trade) for these features. Going forward, PTA-Next will focus on being a functional trade manager/notifier UI with extra vanity features.

## Installation

[Download the latest release from Releases](https://github.com/r52/pta-next/releases/latest/) **OR** a development build from [here](https://ci.appveyor.com/project/r52/pta-next/build/artifacts)

Installer version: Install PTA-Next using the installer and run it from start menu

**If your PC is not running Windows 10 with the latest feature updates or you are getting a VC runtime error, you MUST download and install the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/16/release/VC_redist.x64.exe)!**

## Features

- [MercuryTrade](https://github.com/Exslims/MercuryTrade) style trade notification UI with stash highlighting
  - `Disabled` by default
  - See [wiki](https://github.com/r52/pta-next/wiki#trade-ui) for examples.
  - **Please ensure that your Client.txt path in set in the settings for this to work!**
- Cheat Sheets
  - Currently includes Incursion and Betrayal
  - Access from Trade Bar
  - Custom images supported (change in settings)
- Quick paste trade whispers (while holding modifier key) (currently broken due to lack of library support)
  - `Disabled` by default

QoL Shortcuts:

- Cheat Sheets
  - Right Click - Dismisses window

## Building

### Requirements

Only 64-bit Windows is supported at this time.

- [Node.js 14+](https://nodejs.org/en/)
- [node-gyp dependencies](https://github.com/nodejs/node-gyp#installation) (your own copy of Visual Studio and Python OR windows-build-tools)

### Compile Instructions

```bash
npm ci
npm run compile
```

### Dev/Test build

```bash
npm ci # if you haven't installed this project yet
npm run eb
npm run watch
```

## Tech Stack

Built on:

- [Vue 3](https://vuejs.org/)
- [Typescript](https://www.typescriptlang.org/)
- [Electron](https://www.electronjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Contributing

Have an idea, feature, or improvement that you'd like to contribute to PTA-Next and know your way around the tech stack? Feel free to make your contribution with a pull request. Please note that this project uses [Prettier](https://prettier.io/) code style.

Recommended VS Code Extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur)

## Credits

- [Grinding Gear Games](http://www.grindinggear.com/) for [Path of Exile](https://www.pathofexile.com/)
- [MercuryTrade](https://github.com/Exslims/MercuryTrade)
