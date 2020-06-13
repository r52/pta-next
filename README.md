# PTA-Next

[![License](https://img.shields.io/github/license/r52/pta-next)](https://github.com/r52/pta-next/blob/master/LICENSE)
![Windows Build](https://github.com/r52/pta-next/workflows/Windows%20Build/badge.svg)
[![Build status](https://ci.appveyor.com/api/projects/status/9wd2911nsfftijk9?svg=true)](https://ci.appveyor.com/project/r52/pta-next)

PTA-Next is yet another simple, no frills price checking tool based on [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro) that operates on the [Official Path of Exile Trade](https://www.pathofexile.com/trade) site. PTA-Next is the revamped version of [PTA](https://github.com/r52/PTA).

It also includes a [MercuryTrade](https://github.com/Exslims/MercuryTrade) style [trade notification UI](https://github.com/r52/pta-next/wiki#trade-ui).

**PTA-Next is currently still in early development stages. Expect crashes, bugs, and whole lot of things that may not work quite right.**

**NOTE: As with any pricing tools, never trust or rely on its results entirely. If something seems off, confirm with a manual search. It could very well be an issue with the app itself.**

PTA is licensed under GPL-3.0

## Installation

[Download the latest release from Releases](https://github.com/r52/pta-next/releases/latest/) **OR** a development build from [here](https://ci.appveyor.com/project/r52/pta-next/build/artifacts)

Installer version: Install PTA-Next using the installer and run it from start menu

Portable version: Extract the archive and run **PTA-Next.exe**

**If your PC is not running Windows 10 with the latest feature updates or you are getting a VC runtime error, you MUST download and install the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/16/release/VC_redist.x64.exe)!**

## Features

**All features can be enabled or disabled, and all shortcuts and macros can be reconfigured in the settings!**

- [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro) style simple and advanced item searches
  - Default key: **Ctrl+D** and **Ctrl+Alt+D**
  - `Enabled` by default
  - Disable these if you'd like to use another price checking tool along with PTA-Next.
- Wiki hotkey
  - Default key: **Ctrl+Alt+G**
  - `Enabled` by default
- poeprices.info prediction
  - `Enabled` by default
- Quick paste trade whispers (while holding modifier key)
  - `Disabled` by default
- Ctrl + Mousewheel stash scrolling
  - `Enabled` by default
- Custom macros
  - Supports in-game chat commands as well as opening URLs in your browser
  - See [wiki](https://github.com/r52/pta-next/wiki) for examples.
- [MercuryTrade](https://github.com/Exslims/MercuryTrade) style trade notification UI
  - `Disabled` by default
  - See [wiki](https://github.com/r52/pta-next/wiki#trade-ui) for examples.
  - **Please ensure that your Client.txt path in set in the settings for this to work!**

QoL Shortcuts:

- Search Window
  - Right Click/`Alt+C` - Dismiss window
  - `Alt+S` - Search button
  - `Alt+E` - Open on pathofexile.com

## Building

### Requirements

Only 64-bit Windows is supported at this time.

- [Node.js 12](https://nodejs.org/en/)
- [node-gyp dependencies](https://github.com/nodejs/node-gyp#installation) (your own copy of Visual Studio and Python OR windows-build-tools)

### Instructions

```bash
yarn
yarn build
```

### Dev/Test build

```bash
yarn # if you haven't installed this project yet
yarn rebuild
yarn dev
```

## Tech Stack

Built on:

- [Vue](https://vuejs.org/) + [Quasar](https://quasar.dev/)
- [Typescript](https://www.typescriptlang.org/)
- [Electron](https://www.electronjs.org/)

## Contributing

Have an idea, feature, or improvement that you'd like to contribute to PTA-Next and know your way around the tech stack? Feel free to make your contribution with a pull request. Please note that this project uses [Prettier](https://prettier.io/) code style.

Recommended VS Code Extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur)

## Credits

- [Grinding Gear Games](http://www.grindinggear.com/) for [Path of Exile](https://www.pathofexile.com/)
- [brather1ng](https://github.com/brather1ng) for [RePoE](https://github.com/brather1ng/RePoE).
- [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro)
- [poeprices.info](https://poeprices.info/)
