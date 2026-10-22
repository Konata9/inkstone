#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone themes into Ghostty's user theme directory.
# Usage: pnpm install:ghostty

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${XDG_CONFIG_HOME:-$HOME/.config}/ghostty/themes"

mkdir -p "$target"
cp "$root"/dist/ghostty/* "$target/"

echo "Installed to $target"
echo
echo "Add one of these lines to ~/.config/ghostty/config:"
echo
echo "  theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo"
echo "  theme = light:Inkstone Xuanzhi Dimmed,dark:Inkstone Xuanmo Dimmed"
echo "  theme = light:Inkstone Qingci,dark:Inkstone Canghai"
echo
echo "Then reload Ghostty (Cmd+Shift+, on macOS)."
