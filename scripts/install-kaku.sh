#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone schemes into Kaku's config directory.
#
# Kaku 0.27.1 and newer list the TOML files in ~/.config/kaku/colors/ under
# Settings → Theme, so that is all they need. Older Kaku builds only understand
# Lua tables added to kaku.lua, so the script stops and points at the README
# instead of installing something the app cannot read.
#
# Usage: pnpm install:kaku

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${XDG_CONFIG_HOME:-$HOME/.config}/kaku"
colors_dir="$target/colors"
app_plist="/Applications/Kaku.app/Contents/Info.plist"
min_version="0.27.1"

# First Kaku version on this machine, or an empty string when there is none.
detect_kaku_version() {
  local version=""
  if command -v kaku >/dev/null 2>&1; then
    version="$(kaku --version 2>/dev/null | awk 'NR == 1 { print $NF }')"
  fi
  if [[ -z "$version" && -f "$app_plist" ]] && command -v plutil >/dev/null 2>&1; then
    version="$(plutil -extract CFBundleShortVersionString raw "$app_plist" 2>/dev/null || true)"
  fi
  printf '%s' "$version"
}

# version_ge <candidate> <minimum> — true when candidate >= minimum.
version_ge() {
  local -a candidate minimum
  IFS=. read -r -a candidate <<< "${1%%-*}"
  IFS=. read -r -a minimum <<< "$2"
  local i a b
  for i in 0 1 2; do
    a="${candidate[i]:-0}"
    b="${minimum[i]:-0}"
    a="${a//[^0-9]/}"
    b="${b//[^0-9]/}"
    if (( ${a:-0} > ${b:-0} )); then return 0; fi
    if (( ${a:-0} < ${b:-0} )); then return 1; fi
  done
  return 0
}

version="$(detect_kaku_version)"

if [[ -z "$version" ]] || ! version_ge "$version" "$min_version"; then
  if [[ -z "$version" ]]; then
    echo "Kaku was not found on this machine." >&2
  else
    echo "Kaku ${version} is older than ${min_version}, the first version that lists" >&2
    echo "custom themes from ~/.config/kaku/colors/." >&2
  fi
  echo "Inkstone needs Kaku ${min_version} or newer; nothing was installed." >&2
  echo >&2
  echo "Update Kaku first (kaku update, or https://github.com/tw93/Kaku/releases)," >&2
  echo "then run pnpm install:kaku again." >&2
  echo >&2
  echo "To stay on this version, install the Lua tables by hand:" >&2
  echo >&2
  echo "  mkdir -p $target" >&2
  echo "  cp $root/dist/kaku/inkstone-*.lua $target/" >&2
  echo >&2
  echo "Then add these three lines to $target/kaku.lua:" >&2
  echo >&2
  echo "  config.color_schemes = config.color_schemes or {}" >&2
  echo "  config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')" >&2
  echo "  config.color_scheme = 'Inkstone Xuanmo'" >&2
  exit 1
fi

toml_count=0
for file in "$root"/dist/kaku/inkstone-*.toml; do
  [[ -e "$file" ]] || continue
  toml_count=$((toml_count + 1))
done
if (( toml_count == 0 )); then
  echo "No built TOML schemes in $root/dist/kaku — run pnpm build first." >&2
  exit 1
fi

mkdir -p "$colors_dir"

# Drop the Lua copies older installs left behind, so a stale table cannot
# shadow the TOML scheme of the same name.
removed=0
for file in "$target"/inkstone-*.lua; do
  [[ -e "$file" ]] || continue
  rm -f "$file"
  removed=$((removed + 1))
done

cp "$root"/dist/kaku/inkstone-*.toml "$colors_dir/"

echo "Installed:"
echo "  $toml_count schemes in $colors_dir/  (listed in Kaku Settings → Theme)"
if (( removed > 0 )); then
  echo "Removed $removed old Lua file(s) from $target."
fi
echo
echo "Open Settings (Cmd+,) and pick one:"
echo "  玄墨 Xuanmo (dark)               Inkstone Xuanmo"
echo "  玄墨 Dimmed (muted dark)         Inkstone Xuanmo Dimmed"
echo "  宣纸 Xuanzhi (warm light)        Inkstone Xuanzhi"
echo "  宣纸 Dimmed (muted warm light)   Inkstone Xuanzhi Dimmed"
echo "  沧海 Canghai (deep-sea dark)     Inkstone Canghai"
echo "  青瓷 Qingci (celadon light)      Inkstone Qingci"
echo
echo "Kaku writes config.color_scheme for you."

# Removing the Lua files breaks any kaku.lua that still loads them.
if [[ -f "$target/kaku.lua" ]]; then
  stale="$(grep -n 'inkstone-.*\.lua' "$target/kaku.lua" || true)"
  if [[ -n "$stale" ]]; then
    echo
    echo "Warning: $target/kaku.lua still loads Inkstone Lua files:"
    printf '%s\n' "$stale" | sed 's/^/  /'
    echo "Those dofile() lines will fail now that the Lua files are gone."
    echo "Delete or comment them; a plain config.color_scheme = 'Inkstone Xuanmo'"
    echo "still matches the TOML scheme."
  fi
fi

echo
echo "Kaku reloads the config automatically."
