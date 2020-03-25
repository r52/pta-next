# PTA-Next

[![License](https://img.shields.io/github/license/r52/pta-next)](https://github.com/r52/pta-next/blob/master/LICENSE)
[![Windows Build](https://github.com/r52/pta-next/workflows/Windows%20Build/badge.svg)](https://github.com/r52/pta-next/actions?query=workflow%3A%22Windows+Build%22)

PTA-Next is yet another simple, no frills price checking tool based on [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro) that operates on the [Official Path of Exile Trade](https://www.pathofexile.com/trade) site.

## Installation

[Download the latest release from Releases](https://github.com/r52/pta-next/releases/latest/) **OR** a development build from [here](https://github.com/r52/pta-next/actions?query=workflow%3A%22Windows+Build%22)

Installer version: Install PTA-Next using the installer and run it from start menu

Portable version: Extract the archive and run **PTA-Next.exe**

**If your PC is not running Windows 10 with the latest feature updates or you are getting a VC runtime error, you MUST download and install the [Microsoft Visual C++ Redistributable](https://aka.ms/vs/16/release/VC_redist.x64.exe)!**

## Features and Usage

- Simple and advanced item searches (**Ctrl+D** and **Ctrl+Alt+D** ala [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro))
- poeprices.info prediction (can be disabled in settings)
- Ctrl + Mousewheel stash scrolling.
- Custom macros. Suppports in-game chat commands as well as opening URL in browsers. See [wiki](https://github.com/r52/pta-next/wiki) for more information.

All shortcuts and macros can be re-configured in the settings.

Other Shortcuts:

- Search Window
  - Right click to dismiss
  - `Alt+C` - Dismiss window
  - `Alt+S` - Search button
  - `Alt+E` - Open on pathofexile.com

## Building

### Requirements

Only Windows is supported

- [Node.js 12](https://nodejs.org/en/)
- [node-gyp dependencies](https://github.com/nodejs/node-gyp#installation) (your own copy of Visual Studio and Python OR windows-build-tools)

### Instructions

```bash
yarn
yarn build
```

### Dev build

```bash
yarn rebuild
yarn dev
```

## Tech Stack

Built on:

- Vue + Quasar
- Typescript
- Electron

## Credits

- [Grinding Gear Games](http://www.grindinggear.com/) for [Path of Exile](https://www.pathofexile.com/)
- [brather1ng](https://github.com/brather1ng) for [RePoE](https://github.com/brather1ng/RePoE).
- [PoE-TradeMacro](https://github.com/PoE-TradeMacro/POE-TradeMacro)
- [poeprices.info](https://poeprices.info/)
