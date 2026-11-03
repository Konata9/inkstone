#!/usr/bin/env bash
set -euo pipefail

# Install one Inkstone package into the DSH web profile.
# Usage: pnpm install:dsh [menu|ink|ink-dimmed|sea]

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
variant="${1:-menu}"
case "$variant" in
  menu) package="inkstone-dsh" ;;
  ink|ink-dimmed|sea) package="inkstone-dsh-$variant" ;;
  *) echo "usage: pnpm install:dsh [menu|ink|ink-dimmed|sea]" >&2; exit 1 ;;
esac

dsh plugin --profile web add "$root/dist/dsh/$package"
echo
echo "Installed $package. Restart \`dsh web\` to apply."
echo "Remove it with: dsh plugin --profile web remove $package"
