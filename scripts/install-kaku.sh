#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone schemes into Kaku's config directory.
# Usage: pnpm install:kaku

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="$HOME/.config/kaku"

mkdir -p "$target"
for name in xuanmo xuanmo-dimmed xuanzhi xuanzhi-dimmed canghai qingci; do
  cp "$root/dist/kaku/inkstone-$name.lua" "$target/"
done

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
echo "-- 玄墨 Dimmed (muted dark)"
echo "config.color_schemes['Inkstone Xuanmo Dimmed'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo-dimmed.lua')"
echo "config.color_scheme = 'Inkstone Xuanmo Dimmed'"
echo
echo "-- 宣纸 (warm light)"
echo "config.color_schemes['Inkstone Xuanzhi'] = dofile(wezterm.config_dir .. '/inkstone-xuanzhi.lua')"
echo "config.color_scheme = 'Inkstone Xuanzhi'"
echo
echo "-- 宣纸 Dimmed (muted warm light)"
echo "config.color_schemes['Inkstone Xuanzhi Dimmed'] = dofile(wezterm.config_dir .. '/inkstone-xuanzhi-dimmed.lua')"
echo "config.color_scheme = 'Inkstone Xuanzhi Dimmed'"
echo
echo "-- 沧海 (deep-sea dark)"
echo "config.color_schemes['Inkstone Canghai'] = dofile(wezterm.config_dir .. '/inkstone-canghai.lua')"
echo "config.color_scheme = 'Inkstone Canghai'"
echo
echo "-- 青瓷 (celadon light)"
echo "config.color_schemes['Inkstone Qingci'] = dofile(wezterm.config_dir .. '/inkstone-qingci.lua')"
echo "config.color_scheme = 'Inkstone Qingci'"
echo
echo "Kaku reloads the config automatically."
