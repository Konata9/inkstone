# Changelog

## Unreleased

- **Red marks, blue acts**: buttons, badges, progress, focus rings and selected chrome now use each flavor's interaction blue (羽扇豆蓝 / 涧石蓝 / 飞燕草蓝 / 鷃蓝 / 霁青 / 玉鈫蓝); cinnabar stays reserved for keywords, errors, deletions, the seal and syntax marks. Adds a first-class `action` token plus a hover step, and points OpenCode `accent` at the blue hue.
- **Safer action hover**: the site CTA and links use the generated `--action` / `--action-hover` pair instead of `brightness(1.08)`, so hover no longer drops 宣纸 to 4.39:1.
- **Site readability pass**: the hero copy column widens, the compatibility strip becomes an auto-fit grid (no more overlap with the editor), the Chinese tagline wraps, and a 12/14/16/28 type scale replaces the 9–13px labels. Small labels move from `--fg-3` / `--fg-4` to `--fg-2`, the editor mock reads at 14px, mobile gets a compact 13px preview, and the GitHub entries carry the monochrome mark.
- **Site copy pass**: the hero lead now starts with the 526-color source; the specimen section uses the active palette name as its heading with a “配色思路” note, and all six flavor descriptions are rewritten as inspiration + use case instead of color lists.
- **Flavor chip icons**: each chip keeps its own palette surface; the icon is now a 24px 2×2 preview (canvas / keyword / string / type), and the selected chip keeps the inset action top rule.
- **Slower flavor wipe**: the site's diagonal flavor transition now runs at 1.05s instead of 850ms, giving the palette change a little more room to breathe.
- **Clean dist on build**: `pnpm build` now clears `dist/` before writing, so renamed or retired flavors never leave stale files behind for install scripts or release packaging.
- **Kaku TOML target**: every flavor also ships a WezTerm-compatible `.toml` scheme, so Kaku's Settings → Theme lists it without a `dofile` block; `pnpm install:kaku` now installs both formats.
- **Shorter README preview**: `docs/preview.png` is an editor-only 3×2 gallery captured from `preview/gallery.html`, instead of the full compare page.
- **Product site**: static EN/ZH pages under `site/` (GitHub Pages), with flavor switching, system light/dark defaults (宣纸 / 玄墨), hreflang, JSON-LD, `llms.txt`, and sitemap.
- **Site icons**: editor/terminal support rows use monochrome brand marks; each flavor button shows a canvas + keyword swatch.
- **Site flavor wipe**: clicking a variant reveals the new palette with a bottom-left → top-right View Transition; reduced-motion and unsupported browsers skip the wipe.
- **Site templates**: page structure/CSS/JS live under `templates/site/` (LiquidJS); `src/targets/site.ts` only injects locale, version, support lists and flavor data.
- **Site redesign**: Stage hero with brand + CTAs + flavor rail beside the live editor mock; support lists and swatches move below the fold; ink/paper wash atmosphere tracks the active flavor.
- **Site specimen**: Source/灵感 merges into Active palette (shared lede + per-flavor `meta.description`); Chinese tagline stays one line with a short hairline underline.

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
