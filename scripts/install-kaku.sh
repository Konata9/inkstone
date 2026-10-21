#!/usr/bin/env bash
set -euo pipefail

# Install both Inkstone schemes into Kaku's config directory.
# Usage: pnpm install:kaku

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="$HOME/.config/kaku"

mkdir -p "$target"
cp "$root/dist/kaku/inkstone-xuanmo.lua" "$target/"
cp "$root/dist/kaku/inkstone-xuanzhi.lua" "$target/"

echo "Installed to $target"
echo
echo "Append one of the following blocks to ~/.config/kaku/kaku.lua,"
echo "or set it from Cmd+, (Settings -> Theme after adding it)."
echo
echo "-- 玄墨 (dark)"
echo "config.color_schemes = config.color_schemes or {}"
echo "config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')"
echo "config.color_scheme = 'Inkstone Xuanmo'"
echo
echo "-- 宣纸 (warm light)"
echo "config.color_schemes['Inkstone Xuanzhi'] = dofile(wezterm.config_dir .. '/inkstone-xuanzhi.lua')"
echo "config.color_scheme = 'Inkstone Xuanzhi'"
echo
echo "Kaku reloads the config automatically."
