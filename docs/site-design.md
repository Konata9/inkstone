# Inkstone site design freeze

/* Hallmark · v2.0.0 · custom · redesign: full · genre editorial
   P4 H4 E4 S4 R4 V4 · brand: 墨观 Inkstone · Songti + flavor tokens */

Static product site for 墨观 Inkstone. Visual system comes from the six flavor
palettes; SEO/GEO scaffolding follows Kami landing companions. Composition is
Stage hero (brand + CTAs + flavor rail | live editor mock), then one specimen
section (shared source lede + active flavor idea + swatches) — not a
three-column fact dashboard in the first viewport.

## Tokens

Page chrome tracks the **active flavor**. Defaults:

| Condition | Flavor id |
| --- | --- |
| `prefers-color-scheme: dark` (no storage) | `xuanmo` |
| `prefers-color-scheme: light` (no storage) | `xuanzhi` |
| `localStorage['inkstone.site.flavor']` | that id |

Root attributes: `data-flavor`, `data-appearance` (`dark` \| `light`).

Injected per flavor (same names as preview):

- Surfaces: `--bg`, `--bg-alt`, `--activity`, `--bg-sunken`, `--sel`, `--active`
- Borders: `--border`, `--border-subtle`, `--border-strong`
- Text: `--fg`, `--fg-2`, `--fg-3`, `--fg-4`, `--cursor`
- Type: `--text-meta` 12px, `--text-label` 14px, `--text-body` 16px, `--text-title` 28px
- Action: `--action`, `--action-hover` (the flavor's interaction blue)
- Syntax: `--kw`, `--fn`, `--str`, `--num`, `--type`, `--cm`, `--dec`, `--var`, `--param`, `--prop`
- Lens: `--lens`

Fonts (2+1):

| Role | Stack |
| --- | --- |
| Display | `"Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, serif` |
| Body | `-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif` |
| Mono | `"JetBrains Mono", "SF Mono", "Cascadia Code", Menlo, monospace` |

No italic headings. Links, CTAs, focus and selected chrome use `--action`;
`--kw` stays a code/annotation mark, never a command.
Atmosphere wash uses `color-mix` from `--kw` / `--cursor` over the canvas.

Text floor: 12px for metadata, 14px for UI labels, 16px for body copy.
Small labels use `--fg-2`; `--fg-3` is reserved for metadata at 12px or larger,
and `--fg-4` is not used for text. The editor code is 14px (13px in the compact
mobile preview), with 12px chrome.

Waiver: paper/ink surfaces are product tokens (玄墨 / 宣纸), not generic AI cream.

## Macrostructure

1. **Hero (first viewport)** — top-aligned Stage: seal logo inline before the
   brand name, tagline, CTAs, a compatibility strip laid out as an auto-fit
   grid inside the copy column (no overhang), equal-size flavor chips (each
   locked to its own palette), and the live editor mock. Below 1100px the copy
   comes first and the mock follows as a compact preview; below 480px the
   flavor chips drop the secondary language and wrap the primary name. Header wordmark also
   shows the seal. The 526-colour phrase in the tagline is bold and links to
   zhongguose.com. Logo asset is `favicon.png` (from
   `packages/vscode/icon.png`). PC-first measure ≈1640px.
2. **Specimen** — shared chart/family lede, then the active flavor's name as
   the heading, a `配色思路` / `Color idea` label, the flavor's idea/source line
   (`meta.description`), and swatches. No generic “Active palette” title; the
   visible flavor panel carries its own h2. Platforms stay in the hero strip.
3. **Footer** — license, version, quiet build facts, GitHub / Releases / palette.
   The GitHub entry carries the monochrome mark; the other links stay text-only.
   On desktop the meta facts and links share one row; below 1100px they wrap.

Dividers: negative space + hairline (`--border-subtle`). No section numbers.
No tracked-capital labels.

## Flavor button states

| State | Treatment |
| --- | --- |
| default | each chip keeps its own `--chip-bg` / `--chip-fg` / `--chip-border`; 24px 2×2 palette icon |
| hover (unselected only) | `--chip-alt` fill, `--chip-border-strong` |
| `:focus-visible` | 2px outline `--chip-action` |
| `:active` | slightly pressed (`translateY(1px)`) |
| selected (current) | `--chip-active` fill, `--chip-fg` 500 label, 3px inset top rule `--chip-action`, 12px check pin on the icon |

The icon is a 24px 2×2 miniature: canvas (`--chip-bg`), keyword
(`--chip-accent`), string (`--chip-string`) and type (`--chip-type`). The
selected chip adds a 12px check pin on the icon's right edge; the chip itself
keeps a single border.

## Flavor switch motion

User clicks wrap `document.startViewTransition` so the new flavor
reveals with a hard diagonal wipe **bottom-left → top-right**
(`clip-path` on `::view-transition-new(root)`, ~1.05s). Initial load and
system `prefers-color-scheme` sync stay instant. Skip the wipe when
`prefers-reduced-motion: reduce` or the View Transitions API is missing
(body color transition remains as a soft fallback).

## Locales

| Path | Locale | hreflang |
| --- | --- | --- |
| `/` (site root under Pages base) | English | `en`, `x-default` |
| `/zh/` | Simplified Chinese | `zh-CN` |

Soft redirect once: if `navigator.languages` prefers `zh*` and path is EN home,
and `sessionStorage` flag unset → go to `/zh/`. Manual EN | 中文 always available.

## Origin

Configurable constant `SITE_ORIGIN = https://konata9.github.io/inkstone`
(GitHub Pages project site). Change in `src/targets/site.ts` when a custom
domain is attached.

## Templates vs build data

| Layer | Owns | Path |
| --- | --- | --- |
| Liquid page | HTML structure, loops, SEO shell | `templates/site/page.liquid` |
| Static CSS | Layout, chrome, flavor wipe animation | `templates/site/styles.css` |
| Static JS | Flavor switcher (reads `#inkstone-site-config`) | `templates/site/app.js` |
| Icon snippets | Monochrome brand SVG marks | `templates/site/snippets/icon.liquid` |
| Build data | Locale copy, version, support lists, unified flavor rows, JSON-LD, runtime config | `src/targets/site.ts` + `site-copy.ts` |

Edit structure/style/motion in `templates/site/`. Change only data wiring in
`src/targets/site.ts`. `site/` output is generated; do not hand-edit it.

## Assets

| File | Source |
| --- | --- |
| `site/*.html`, `robots.txt`, `sitemap.xml`, `llms*.txt` | `pnpm build` via LiquidJS + `src/targets/site.ts` |
| `site/favicon.png` | copied from `packages/vscode/icon.png` on build |
| `site/og.jpg` | 1200×630 JPEG cropped from `docs/preview.png` (commit; rebuild with ffmpeg when the gallery shot changes) |

```bash
ffmpeg -y -i docs/preview.png \
  -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630" \
  -q:v 4 site/og.jpg
```

## Out of scope

Full preview (ANSI strip, terminal, diff, Markdown). Invented metrics. Pricing.
React/Vite SPA.
