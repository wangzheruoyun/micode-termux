# micode-termux

**micode OpenCode plugin - Pre-built for Termux/Android (Offline Installable)**

This repository contains a fully self-contained, offline-installable package of the [micode](https://github.com/vtemian/micode) OpenCode plugin, specifically built and tested for **Termux on Android (ARM64)**.

## 🎯 What's Included

| Component | Description |
|-----------|-------------|
| **micode source** | Complete TypeScript source code |
| **node_modules** | All 130+ dependencies pre-installed |
| **node-pty-android-arm64** | Native PTY module for Android ARM64 (replaces standard node-pty) |
| **Pre-built plugin** | Ready-to-use OpenCode plugin in `opencode-plugin/` |
| **Offline installer** | `install.sh` - one command setup |

## 🚀 Quick Install (No Internet Required)

```bash
# 1. Transfer the tarball to your Termux device
# 2. Extract and install
tar -xzf micode-offline-package.tar.gz
cd micode-offline-package
./install.sh
```

The installer will:
- Create `~/.config/opencode/plugins/micode/` 
- Copy pre-built plugin with all dependencies
- Configure OpenCode to use the plugin
- No `npm install`, no compilation, no internet needed

## 🔧 What's Fixed for Termux

| Issue | Fix Applied |
|-------|-------------|
| `node-pty` fails on Android | Uses `node-pty-android-arm64` via npm alias |
| `which` command not found | Replaced with `spawnSync("command", ["-v", cmd])` |
| ES module / CommonJS interop | Fixed dynamic import in `src/tools/pty/loader.ts` |
| Duplicate startup warnings | Changed to `log.debug` (silent by default) |

## 📦 Plugin Features

After installation, you get the full micode workflow in OpenCode:

### Agents (12 specialized agents)
- **commander** - Orchestrator
- **brainstormer** - Design exploration
- **planner** - Implementation plans
- **executor** - Orchestrates implementer→reviewer cycles
- **implementer** - Writes code + tests
- **reviewer** - Verifies correctness
- **codebase-locator** - Finds files/patterns
- **codebase-analyzer** - Deep module analysis
- **pattern-finder** - Finds existing patterns
- **ledger-creator** - Session continuity
- **artifact-searcher** - Searches past work
- **mm-orchestrator** - Mindmodel generation

### Tools (10 tools)
- `ast_grep_search` / `ast_grep_replace` - AST-aware code search/replace
- `btca_ask` - Library source code queries
- `look_at` - Extract file structure
- `artifact_search` / `milestone_artifact_search` - Search past work
- `pty_spawn` / `pty_write` / `pty_read` / `pty_list` / `pty_kill` - Background terminals

### Commands
- `/init` - Initialize project docs
- `/ledger` - Create/update continuity ledger
- `/search` - Search past plans/ledgers
- `/mindmodel` - Generate project patterns

## 📋 Requirements

- **Termux** (Android 7+)
- **OpenCode** installed (`bun add -g @opencode-ai/opencode` or similar)
- **ARM64 device** (most modern Android phones)

## 🔐 Configuration

The installer creates `~/.config/opencode/opencode.jsonc`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/nemotron-3-ultra-free",
  "plugin": ["./plugins/micode"]
}
```

You can change the model to any OpenCode-supported model.

## 📁 Package Structure

```
micode-offline-package/
├── install.sh              # One-command installer
├── micode/                 # Full source + deps
│   ├── src/                # TypeScript source
│   ├── node_modules/       # All dependencies
│   ├── package.json
│   └── tsconfig.json
└── opencode-plugin/        # Pre-built plugin
    ├── dist/index.js       # Built plugin (fixed for Termux)
    ├── node_modules/       # Plugin deps
    ├── index.js            # Entry point
    └── package.json
```

## 🛠 Manual Install (If Needed)

```bash
# Copy plugin to OpenCode config directory
mkdir -p ~/.config/opencode/plugins/micode
cp -r opencode-plugin/* ~/.config/opencode/plugins/micode/

# Add to ~/.config/opencode/opencode.jsonc
{
  "plugin": ["./plugins/micode"]
}
```

## 🧪 Verification

After install, run:
```bash
opencode run "list agents"
```

Expected output:
```
[pty.loader] node-pty-android-arm64 loaded successfully
> brainstormer · nemotron-3-ultra-free
## Available Subagents
commander, brainstormer, planner, executor, implementer, reviewer...
```

## 📝 License

MIT - Same as upstream [micode](https://github.com/vtemian/micode)

## 🙏 Credits

- [micode](https://github.com/vtemian/micode) - Original plugin
- [node-pty-android-arm64](https://github.com/jerry-git/node-pty-android-arm64) - Android PTY build
- [OpenCode](https://opencode.ai) - The AI coding agent platform
