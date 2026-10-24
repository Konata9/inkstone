# 墨观 Inkstone · 中国传统色彩

一套从 526 个中国传统颜色里长出来的代码配色。六种变体：玄墨、玄墨 Dimmed、宣纸、宣纸 Dimmed、沧海、青瓷。

A traditional Chinese color theme for VS Code, Cursor, Windsurf and VSCodium — built from the 526-color [zhongguose](https://zhongguose.com/) palette.

Six variants share one hue skeleton, so switching feels like the same painting under a different light.

![Inkstone preview](https://raw.githubusercontent.com/Konata9/inkstone/main/docs/preview.png)

## Six variants

| Variant | Mode | Canvas | Keywords | Strings | Types |
| --- | --- | --- | --- | --- | --- |
| **玄墨 Xuanmo** | Dark | `#14131a` | 海棠红 · softened `#da5761` | 铜绿 `#2bae85` | 土黄 `#d6a01d` |
| **玄墨 Dimmed** | Dark | `#19181e` | 山黎豆红 `#c27c88` | 梧枝绿 `#69a794` | 土黄 `#d6a01d` |
| **宣纸 Xuanzhi** | Light | `#f7f4ed` | 鹤顶红 · softened `#c34435` | 荷叶绿 `#1a6840` | 桔梗紫 `#813c85` |
| **宣纸 Dimmed** | Light | `#e9e2d4` | 烟红 `#894e54` | 荷叶绿 `#1a6840` | 野菊紫 `#525288` |
| **沧海 Canghai** | Dark | `#0d1822` | 银朱 · softened `#dc5e41` | 竹绿 `#1ba784` | 萝兰紫 `#c08eaf` |
| **青瓷 Qingci** | Light | `#e8f0ec` | 尖晶玉红 · softened `#bc3a46` | 荷叶绿 `#1a6840` | 桔梗紫 `#813c85` |

- **墨与纸** — 玄墨 uses pine-soot ink and cinnabar annotations; 宣纸 uses raw xuan paper and mineral pigments. The Dimmed variants lower the ambient light while keeping ink at ≥10.5:1 and pigments recognisable.
- **海与瓷** — 沧海 takes deep-sea twilight and blue-green minerals; 青瓷 takes moon-white celadon glaze and grey ink.
- Every variant includes full workbench colors, TextMate scopes, semantic tokens and a matching terminal ANSI palette.

## Install

1. Open the **Extensions** view and search for `Inkstone`.
2. Run **Preferences: Color Theme** and pick one of the six variants.
3. Optional: enable semantic highlighting for the intended result.

Works in VS Code 1.85+, Cursor, Windsurf, VSCodium and other VS Code-compatible editors.

### Recommended settings

```json
{
  "editor.semanticHighlighting.enabled": true,
  "terminal.integrated.minimumContrastRatio": 1,
  "window.titleBarStyle": "custom"
}
```

`terminal.integrated.minimumContrastRatio: 1` keeps the theme's terminal ANSI palette intact. `window.titleBarStyle: "custom"` lets the workbench colors reach the title bar.

## Design notes

- **Contrast is a band, not a floor** — body text 10.5–12.5:1, syntax 4.5–9:1. All six variants pass the same 872 checks, including OKLCH chroma budgets.
- **Cinnabar without the glare** — print-ink reds keep their hue and lightness but drop to C≈0.165, so they read as pigment rather than neon. The caret uses the cool interaction color instead.
- **Red marks, blue acts** — keywords, errors and deletions keep cinnabar; buttons, badges, progress, focus and selected chrome use the variant's interaction blue, so confirmation and destruction never share a hue.
- **No visual noise** — comments stay upright, there are no gradients, no glass effects and no italic comments.
- **Traditional colors are traceable** — accents keep their original zhongguose hex where possible; softened pigments and derived neutrals are documented in the [palette reference](https://github.com/Konata9/inkstone/blob/main/docs/palette.md).
- **One skeleton, six lights** — hue order stays the same across variants (cinnabar → blue → green → orange → purple → cyan → crimson).

## Links

- [Repository](https://github.com/Konata9/inkstone)
- [Palette reference](https://github.com/Konata9/inkstone/blob/main/docs/palette.md)
- [Changelog](https://github.com/Konata9/inkstone/blob/main/CHANGELOG.md)
- [Issues](https://github.com/Konata9/inkstone/issues)
- [MIT License](https://github.com/Konata9/inkstone/blob/main/LICENSE)

---

Color data credited to [zhongguose.com](https://zhongguose.com/) (Perchouli) and the matching Figma color chart.
