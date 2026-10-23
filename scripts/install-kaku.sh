#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone schemes into Kaku's config directory.
#
# The TOML files are what current Kaku lists under Settings → Theme; the Lua
# files stay for WezTerm and for Kaku versions that predate the colors
# directory.
#
# Usage: pnpm install:kaku

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="$HOME/.config/kaku"

mkdir -p "$target/colors"
cp "$root"/dist/kaku/inkstone-*.lua "$target/"
cp "$root"/dist/kaku/inkstone-*.toml "$target/colors/"

echo "Installed:"
echo "  $target/inkstone-*.lua          Lua schemes (WezTerm, older Kaku)"
echo "  $target/colors/inkstone-*.toml  listed in Kaku Settings → Theme"
echo
echo "Open Settings (Cmd+,) and pick one:"
echo "  玄墨 Xuanmo (dark)               Inkstone Xuanmo"
echo "  玄墨 Dimmed (muted dark)         Inkstone Xuanmo Dimmed"
echo "  宣纸 Xuanzhi (warm light)        Inkstone Xuanzhi"
echo "  宣纸 Dimmed (muted warm light)   Inkstone Xuanzhi Dimmed"
echo "  沧海 Canghai (deep-sea dark)     Inkstone Canghai"
echo "  青瓷 Qingci (celadon light)      Inkstone Qingci"
echo
echo "Kaku writes config.color_scheme for you. For WezTerm, or a Kaku that does"
echo "not list these files yet, reference the Lua table instead:"
echo
echo "  config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')"
echo "  config.color_scheme = 'Inkstone Xuanmo'"
echo
echo "Kaku reloads the config automatically."
