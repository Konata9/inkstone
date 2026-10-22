# Changelog

## Unreleased

- New **OpenCode** target: all six flavors are generated as OpenCode V2 themes (`base` + mode hue scales) and installed with `pnpm install:opencode`.
- The OpenCode build maps the same semantic palette to text, surfaces, syntax, diff, Markdown, feedback fills and nine-step hue scales; `accent` is cinnabar and `interactive` is 晴山蓝.
- Post-build checks now verify OpenCode JSON, token references and text/fill contrast, alongside the VS Code, Ghostty and Kaku checks.
- GitHub Releases now ship per-target archives, a machine-readable `manifest.json` and `SHA256SUMS`; pushing a `v*` tag builds and publishes them automatically.

## 0.3.0

- New blue-green family: **沧海 Canghai** (dark) and **青瓷 Qingci** (cool light), inspired by 青绿山水, 海青 / 霁青 and celadon glaze.
- Six variants total: 玄墨, 玄墨 Dimmed, 宣纸, 宣纸 Dimmed, 沧海, 青瓷.
- The preview page groups the ink-and-paper and sea-and-celadon families; the palette reference uses one hue-skeleton table per family.
- 480 contrast checks (up from 320).

## 0.2.0

- New **Dimmed** variants: **玄墨 Dimmed** (dark) and **宣纸 Dimmed** (warm light) — lower saturation and softer canvases while keeping the same contrast floors.
- Four VS Code themes, four Ghostty themes, and four Kaku / WezTerm Lua schemes.
- The preview page compares all four variants side by side; the palette reference lists Dimmed tokens.
- 320 contrast checks (up from 160).

## 0.1.0

- First release.
- Two flavors: **玄墨 Xuanmo** (dark) and **宣纸 Xuanzhi** (warm light), built from the 526-color zhongguose palette.
- VS Code / Cursor / Windsurf: 443 workbench colors, 35 TextMate rules, 28 semantic token categories.
- Ghostty: two themes with matching ANSI palettes; supports `theme = light:...,dark:...`.
- Kaku / WezTerm: two Lua color schemes including tab bar and split colors.
- Build-time contrast audit (160 checks) and generated palette reference.
