#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# micode Offline Installer for Termux/Android
# This script installs micode OpenCode plugin without internet access

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICODE_SRC_DIR="$PACKAGE_DIR/micode"
OPENCODE_PLUGIN_DIR="$PACKAGE_DIR/opencode-plugin"

echo "=========================================="
echo "  micode Offline Installer for Termux"
echo "=========================================="
echo ""

# 1. Install micode source (for development)
echo "[1/4] Installing micode source to ~/.micode..."
mkdir -p "$HOME/.micode"
cp -r "$MICODE_SRC_DIR/src" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/package.json" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/package-lock.json" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/tsconfig.json" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/tsconfig.eslint.json" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/biome.json" "$HOME/.micode/"
cp "$MICODE_SRC_DIR/eslint.config.js" "$HOME/.micode/"
cp -r "$MICODE_SRC_DIR/node_modules" "$HOME/.micode/"
echo "    ✓ micode source installed"

# 2. Install opencode plugin (pre-built)
echo "[2/4] Installing opencode plugin to ~/.config/opencode/plugins/micode..."
mkdir -p "$HOME/.config/opencode/plugins/micode"
cp -r "$OPENCODE_PLUGIN_DIR/dist" "$HOME/.config/opencode/plugins/micode/"
cp -r "$OPENCODE_PLUGIN_DIR/node_modules" "$HOME/.config/opencode/plugins/micode/"
cp "$OPENCODE_PLUGIN_DIR/package.json" "$HOME/.config/opencode/plugins/micode/"
cp "$OPENCODE_PLUGIN_DIR/package-lock.json" "$HOME/.config/opencode/plugins/micode/"
cp "$OPENCODE_PLUGIN_DIR/index.js" "$HOME/.config/opencode/plugins/micode/"
echo "    ✓ opencode plugin installed"

# 3. Configure opencode.jsonc
echo "[3/4] Configuring opencode.jsonc..."
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.jsonc"
mkdir -p "$HOME/.config/opencode"

if [ -f "$OPENCODE_CONFIG" ]; then
    # Check if plugin is already configured
    if grep -q '"plugin"' "$OPENCODE_CONFIG"; then
        if grep -q '"./plugins/micode"' "$OPENCODE_CONFIG"; then
            echo "    ✓ Plugin already configured in opencode.jsonc"
        else
            echo "    ⚠ Plugin config exists but different path. Please manually add:"
            echo '      "plugin": ["./plugins/micode"]'
        fi
    else
        echo "    ⚠ Plugin config missing. Please add to opencode.jsonc:"
        echo '      "plugin": ["./plugins/micode"]'
    fi
else
    cat > "$OPENCODE_CONFIG" << 'CONFIGEOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/nemotron-3-ultra-free",
  "plugin": ["./plugins/micode"]
}
CONFIGEOF
    echo "    ✓ Created opencode.jsonc with micode plugin"
fi

# 4. Verify installation
echo "[4/4] Verifying installation..."
if [ -f "$HOME/.config/opencode/plugins/micode/dist/index.js" ]; then
    echo "    ✓ Plugin dist/index.js exists"
else
    echo "    ✗ Plugin dist/index.js MISSING"
    exit 1
fi

if [ -d "$HOME/.config/opencode/plugins/micode/node_modules" ]; then
    echo "    ✓ Plugin node_modules exists"
else
    echo "    ✗ Plugin node_modules MISSING"
    exit 1
fi

if [ -d "$HOME/.micode/node_modules" ]; then
    echo "    ✓ micode source node_modules exists"
else
    echo "    ✗ micode source node_modules MISSING"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "To use micode:"
echo "  1. Run: opencode"
echo "  2. Try: /init  (to generate ARCHITECTURE.md, CODE_STYLE.md)"
echo "  3. Try: /ledger  (to create continuity ledger)"
echo ""
echo "The plugin includes:"
echo "  • node-pty-android-arm64 (Termux compatible)"
echo "  • ast-grep / btca tools (with Termux-compatible PATH checks)"
echo "  • All micode agents: commander, brainstormer, planner, executor, etc."
echo ""
