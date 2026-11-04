#!/usr/bin/env bash
set -euo pipefail

# Install all six Inkstone themes into Warp's custom theme directory.
# Usage: pnpm install:warp

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$(uname -s)" in
  Darwin) target="$HOME/.warp/themes" ;;
  MINGW* | MSYS* | CYGWIN*) target="$(cygpath -u "$APPDATA")/warp/Warp/data/themes" ;;
  *) target="${XDG_DATA_HOME:-$HOME/.local/share}/warp-terminal/themes" ;;
esac

mkdir -p "$target"
cp "$root"/dist/warp/inkstone-*.yaml "$target/"

echo "Installed to $target"
echo
echo "Open Warp → Settings → Appearance → Themes and pick one of:"
echo
echo "  Dark:  Inkstone Xuanmo, Inkstone Xuanmo Dimmed, Inkstone Canghai"
echo "  Light: Inkstone Xuanzhi, Inkstone Xuanzhi Dimmed, Inkstone Qingci"
echo
echo "Turn on \"Sync with OS\" to pair a light and a dark variant."
