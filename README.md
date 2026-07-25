# micode-termux

**micode OpenCode plugin - Pre-built for Termux/Android (Offline Installable)**

Tested **only** on [opencode-termux v0.2.1](https://github.com/guysoft/opencode-termux/releases/tag/v0.2.1).

## Install (No Internet Required)

```bash
tar -xzf micode-offline-package.tar.gz
cd micode-offline-package
./install.sh
```

That's it. The installer:
- Copies the pre-built plugin to `~/.config/opencode/plugins/micode/`
- Configures `~/.config/opencode/opencode.jsonc`
- Zero `npm install`, zero compilation

## What's Inside

| Component | Purpose |
|-----------|---------|
| `opencode-plugin/dist/index.js` | Built plugin (ESM, ~400KB) |
| `opencode-plugin/node_modules/` | All deps including `node-pty-android-arm64` |
| `micode/src/` | Full TypeScript source |
| `micode/node_modules/` | All deps for development |
| `install.sh` | One-command installer |

## Termux Fixes Applied

| Problem | Fix |
|---------|-----|
| `node-pty` crashes on Android | Uses `node-pty-android-arm64` via npm alias |
| `which` command missing | Replaced with `spawnSync("command", ["-v", cmd])` |
| ES module / CommonJS interop | Fixed dynamic import in `src/tools/pty/loader.ts` |
| Verbose startup warnings | Downgraded to `log.debug` (silent by default) |

## Verify It Works

```bash
opencode run "list agents"
```

Expected:
```
[pty.loader] node-pty-android-arm64 loaded successfully
> brainstormer · nemotron-3-ultra-free
## Available Subagents
commander, brainstormer, planner, executor, implementer, reviewer...
```

## Requirements

- Termux (Android 7+)
- [opencode-termux v0.2.1](https://github.com/guysoft/opencode-termux/releases/tag/v0.2.1)
- ARM64 device

## License

MIT — same as upstream [micode](https://github.com/vtemian/micode)
