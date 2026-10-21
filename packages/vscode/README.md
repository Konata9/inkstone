# 墨观 Inkstone · 中国传统色彩

A traditional Chinese color theme built from the 526-color [zhongguose](https://zhongguose.com/) palette.

- **玄墨 Xuanmo** — dark. Pine-soot ink, cinnabar keywords, verdigris strings.
- **宣纸 Xuanzhi** — warm light. Raw xuan paper, mineral pigments.

Both flavors share one hue skeleton, so switching feels like the same painting under a different light. Includes full workbench colors, TextMate scopes, semantic tokens and terminal ANSI palettes. Comments stay upright; there are no gradients and no glass effects.

Browse the palette and a full preview in the [repository](https://github.com/Konata9/inkstone).

## Install

1. Open the **Extensions** view and search for `Inkstone`, or install the VSIX with `code --install-extension moguan.inkstone-<version>.vsix`.
2. Run **Preferences: Color Theme** and pick `墨观 · 玄墨 (Inkstone Xuanmo)` or `墨观 · 宣纸 (Inkstone Xuanzhi)`.

Works in VS Code, Cursor, Windsurf, VSCodium and other VS Code-compatible editors.

## Notes

- Contrast is audited at build time: body text ≥ 7:1, syntax ≥ 4.5:1, comments ≥ 3:1.
- Accent colors keep their original traditional hex where possible; derived neutrals are documented in `docs/palette.md` in the repository.
- MIT licensed. Color data credited to zhongguose.com (Perchouli) and the matching Figma color chart.
