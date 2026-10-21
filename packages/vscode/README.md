# 墨观 Inkstone · 中国传统色彩

A traditional Chinese color theme built from the 526-color [zhongguose](https://zhongguose.com/) palette.

- **玄墨 Xuanmo** — dark. Pine-soot ink, cinnabar keywords, verdigris strings.
- **玄墨 Dimmed** — dark. Pale ink grey, low-saturation pigments, same contrast floors.
- **宣纸 Xuanzhi** — warm light. Raw xuan paper, mineral pigments.
- **宣纸 Dimmed** — warm light. Aged paper, faded pigments, same contrast floors.
- **沧海 Canghai** — dark. Deep-sea twilight, blue-green minerals, a cinnabar seal.
- **青瓷 Qingci** — cool light. Moon-white celadon glaze, grey ink, sky after rain.

All six variants share one hue skeleton, so switching feels like the same painting under a different light. Includes full workbench colors, TextMate scopes, semantic tokens and terminal ANSI palettes. Comments stay upright; there are no gradients and no glass effects.

Browse the palette and a full preview in the [repository](https://github.com/Konata9/inkstone).

## Install

1. Open the **Extensions** view and search for `Inkstone`, or install the VSIX with `code --install-extension moguan.inkstone-<version>.vsix`.
2. Run **Preferences: Color Theme** and pick `墨观 · 玄墨 (Inkstone Xuanmo)`, `墨观 · 玄墨 Dimmed (Inkstone Xuanmo Dimmed)`, `墨观 · 宣纸 (Inkstone Xuanzhi)`, `墨观 · 宣纸 Dimmed (Inkstone Xuanzhi Dimmed)`, `墨观 · 沧海 (Inkstone Canghai)` or `墨观 · 青瓷 (Inkstone Qingci)`.

Works in VS Code, Cursor, Windsurf, VSCodium and other VS Code-compatible editors.

## Notes

- Contrast is audited at build time: body text ≥ 7:1, syntax ≥ 4.5:1, comments ≥ 4.5:1. The Dimmed variants use the same floors.
- Accent colors keep their original traditional hex where possible; derived neutrals are documented in `docs/palette.md` in the repository.
- MIT licensed. Color data credited to zhongguose.com (Perchouli) and the matching Figma color chart.
