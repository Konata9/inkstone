#!/usr/bin/env bash
set -euo pipefail

# Install the Inkstone theme family into Zed's user theme directory.
# Usage: pnpm install:zed

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${XDG_CONFIG_HOME:-$HOME/.config}/zed/themes"

mkdir -p "$target"
cp "$root"/dist/zed/inkstone.json "$target/"

echo "Installed to $target/inkstone.json"
echo
echo "Select one with theme selector (cmd-k cmd-t), or configure in ~/.config/zed/settings.json:"
echo
cat <<'JSON'
{
  "theme": {
    "mode": "system",
    "light": "墨观 · 宣纸 (Inkstone Xuanzhi)",
    "dark": "墨观 · 玄墨 (Inkstone Xuanmo)"
  }
}
JSON
echo
echo "Available themes:"
echo "  Dark:  墨观 · 玄墨 (Inkstone Xuanmo)"
echo "         墨观 · 玄墨 Dimmed (Inkstone Xuanmo Dimmed)"
echo "         墨观 · 沧海 (Inkstone Canghai)"
echo "  Light: 墨观 · 宣纸 (Inkstone Xuanzhi)"
echo "         墨观 · 宣纸 Dimmed (Inkstone Xuanzhi Dimmed)"
echo "         墨观 · 青瓷 (Inkstone Qingci)"
