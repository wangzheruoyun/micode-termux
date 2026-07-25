# better-sqlite3 Termux

> Termux-focused fork of upstream `better-sqlite3` with the minimum Android/Termux compatibility patch needed to build and run on ARM64 Termux.

[![npm latest](https://img.shields.io/npm/v/@mmmbuto/better-sqlite3-termux/latest?style=flat-square&logo=npm)](https://www.npmjs.com/package/@mmmbuto/better-sqlite3-termux)

---

## About

This fork exists for one reason:

- keep `better-sqlite3` usable on Android Termux without carrying a broad feature fork

The current fork tracks upstream `WiseLibs/better-sqlite3` and applies a minimal Termux/Android compatibility patch so Node.js native builds do not fail on Android gyp headers that reference `android_ndk_path`.

### Current Release

- **Package**: `@mmmbuto/better-sqlite3-termux`
- **Latest**: `12.8.0-termux.0`
- **Source fork**: `DioNanos/better-sqlite3-termux`
- **Upstream**: `WiseLibs/better-sqlite3`

### Supported Focus

- Android Termux ARM64

This repo may still be useful as a build base for other Android environments, but the maintained target is native Termux first.

---

## Project Scope

### What We Do

- track upstream `better-sqlite3`
- keep the patch delta minimal
- validate native build on real Termux
- publish a scoped npm package for Termux usage

### What We Do Not Do

- maintain a divergent SQLite feature fork
- replace upstream for Linux/macOS users
- carry unrelated API or behavioral changes

---

## Patch Status

Current Termux compatibility change:

- provide a harmless default for `android_ndk_path` in `deps/common.gypi`

Why:

- Node 25 Android headers on this Termux host inject a `common.gypi` include using `android_ndk_path`
- upstream `better-sqlite3` does not define that variable because it is not normally needed for the package itself
- on Termux this causes gyp parse failure before compilation even starts

Result on this host:

- package builds successfully with `npm install --omit=dev`
- runtime smoke test passes on native Termux ARM64

Note:

- upstream dev dependencies such as `sqlite3` may still fail on this host in full dev installs because older nested `node-gyp` code expects Python `distutils`
- that does not block the production package build of this fork

---

## Installation

### Termux

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts clang make python -y

npm install @mmmbuto/better-sqlite3-termux@latest
```

### In your project

If code expects the upstream import name:

```js
const Database = require('@mmmbuto/better-sqlite3-termux');
```

If you want to keep the upstream import name `better-sqlite3`, use an alias in your project:

```json
{
  "dependencies": {
    "better-sqlite3": "npm:@mmmbuto/better-sqlite3-termux@12.8.0-termux.0"
  }
}
```

---

## Usage

```js
const Database = require('@mmmbuto/better-sqlite3-termux');

const db = new Database('app.db');
db.exec('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)');
db.prepare('INSERT INTO items (name) VALUES (?)').run('termux');

const row = db.prepare('SELECT * FROM items LIMIT 1').get();
console.log(row);

db.close();
```

---

## Build From Source

```bash
git clone https://github.com/DioNanos/better-sqlite3-termux.git
cd better-sqlite3-termux
npm install --omit=dev
```

On this Termux target, `npm install --omit=dev` is the relevant production path.

If you run a full dev install, nested dev dependencies may fail because some older Python/gyp stacks still expect `distutils`.

---

## Documentation

- [API documentation](./docs/api.md)
- [Performance](./docs/performance.md)
- [SQLite compilation notes](./docs/compilation.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Upstream project](https://github.com/WiseLibs/better-sqlite3)

---

## Maintenance

This is a community-maintained compatibility fork for the `mmmbuto` stack and related Termux projects such as `nexuscrew`, `pixel-controller`, and local MCP services that need reliable embedded SQLite on Android.

---

## License

MIT, inherited from upstream `better-sqlite3`.

See [LICENSE](./LICENSE).
