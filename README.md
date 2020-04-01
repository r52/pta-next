# PTA-Next

[![License](https://img.shields.io/github/license/r52/pta-next)](https://github.com/r52/pta-next/blob/master/LICENSE)
[![Windows Build](https://github.com/r52/pta-next/workflows/Windows%20Build/badge.svg)](https://github.com/r52/pta-next/actions?query=workflow%3A%22Windows+Build%22+branch%3Amaster)
[![Build status](https://ci.appveyor.com/api/projects/status/9wd2911nsfftijk9?svg=true)](https://ci.appveyor.com/project/r52/pta-next)

PTA-Next is yet another simple, no frills price checking tool based on [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro) that operates on the [Official Path of Exile Trade](https://www.pathofexile.com/trade) site. PTA-Next is the revamped version of [PTA](https://github.com/r52/PTA).

It also comes with a [MercuryTrade](https://github.com/Exslims/MercuryTrade) style trade notification UI.

**PTA-Next is currently still in beta and testing stages. Expect crashes, bugs, and whole lot of things that doesn't work quite right.**

**NOTE: As with any pricing tools, never trust or rely on its results entirely. If something seems off, confirm with a manual search. It could very well be an issue with the app itself.**

PTA is licensed under GPL-3.0

## Installation

[Download the latest release from Releases](https://github.com/r52/pta-next/releases/latest/) **OR** a development build from [here](https://ci.appveyor.com/project/r52/pta-next/build/artifacts) or [here](https://github.com/r52/pta-next/actions?query=workflow%3A%22Windows+Build%22+branch%3Amaster)

Installer version: Install PTA-Next using the installer and run it from start menu

Portable version: Extract the archive and run **PTA-Next.exe**

**If your PC is not running Windows 10 with the latest feature updates or you are getting a VC runtime error, you MUST download and install the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/16/release/VC_redist.x64.exe)!**

## Features and Usage

- [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro) style simple and advanced item searches using **Ctrl+D** and **Ctrl+Alt+D**. These shortcuts can be changed or disabled entirely.
- poeprices.info prediction (`default: enabled`. Can be disabled in settings)
- Ctrl + Mousewheel stash scrolling.
- Custom macros. Suppports in-game chat commands as well as opening URLs in your browser. See [wiki](https://github.com/r52/pta-next/wiki) for more information.
- [MercuryTrade](https://github.com/Exslims/MercuryTrade) style trade notification UI (`default: disabled`). Please ensure that your Client.txt path in set in the settings for this to work.

All shortcuts and macros can be re-configured in the settings.

Other Shortcuts:

- Search Window
  - Right Click/`Alt+C` - Dismiss window
  - `Alt+S` - Search button
  - `Alt+E` - Open on pathofexile.com

## Building

### Requirements

Only Windows x64 is supported at this time

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
