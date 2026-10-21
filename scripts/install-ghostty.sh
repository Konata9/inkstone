#!/usr/bin/env bash
set -euo pipefail

# Install the two Inkstone themes into Ghostty's user theme directory.
# Usage: pnpm install:ghostty

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${XDG_CONFIG_HOME:-$HOME/.config}/ghostty/themes"

mkdir -p "$target"
cp "$root/dist/ghostty/Inkstone Xuanmo" "$target/"
cp "$root/dist/ghostty/Inkstone Xuanzhi" "$target/"

echo "Installed to $target"
echo
echo "Add this line to ~/.config/ghostty/config:"
echo
echo "  theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo"
echo
echo "Then reload Ghostty (Cmd+Shift+, on macOS)."
