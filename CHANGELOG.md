# Changelog

## Unreleased

- **Shorter README preview**: `docs/preview.png` is an editor-only 3×2 gallery captured from `preview/gallery.html`, instead of the full compare page.

## 0.3.3
- **Cursor chrome outlines**: `contrastActiveBorder` is transparent. Cursor paints that token as a 1px outline around editor tabs, activity-bar items and auxiliary actions such as New Agent; VS Code and VSCodium only use it in high contrast, where the dark default is already null.

## 0.3.2
- **Palette comfort pass**: the audit now checks contrast bands and OKLCH chroma budgets, not just minimum ratios. Body text moves from 13.5–14.3:1 to ≈11.5:1, and syntax colors above 9:1 are brought back into range.
- **Cinnabar, softened**: the red family keeps its traditional hue and lightness but drops to C≈0.165 (errors 0.18), so 海棠红 / 银朱 / 鹤顶红 / 尖晶玉红 read as pigment instead of neon. `soften()` records the source color for the docs.
- **Cursor decoupled from keywords**: a new `text.cursor` token uses each flavor's cool interaction color (羽扇豆蓝 / 涧石蓝 / 玉鈫蓝) instead of the annotation red.
- **Dimmed, reframed**: the dark canvas deepens instead of lifting into grey, the light canvas keeps its ink dark, and pigments retain ~75% chroma. Dimmed body text now clears 10.5:1 and punctuation is readable.
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
