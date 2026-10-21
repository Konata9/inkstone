#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone themes into OpenCode's global theme directory.
# Usage: pnpm install:opencode

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/themes"

mkdir -p "$target"
cp "$root"/dist/opencode/inkstone-*.json "$target/"

echo "Installed to $target"
echo
echo "Select one with /themes, or pin it in ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/cli.json:"
echo
cat <<'JSON'
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "theme": { "name": "inkstone-xuanmo-dimmed", "mode": "dark" }
}
JSON
echo
echo "Dark:  inkstone-xuanmo, inkstone-xuanmo-dimmed, inkstone-canghai"
echo "Light: inkstone-xuanzhi, inkstone-xuanzhi-dimmed, inkstone-qingci"
echo
echo "Restart OpenCode after adding a new theme file."
