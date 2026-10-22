# 数据来源 / Data source

- **色值**：https://zhongguose.com/colors.json — 526 个中国传统颜色，字段为 `name`、`pinyin`、`hex`、`RGB`、`CMYK`。站点作者：Perchouli。
- **同源色谱**：[Figma Community · 526 个中国传统颜色 色谱](https://www.figma.com/design/5gJsBEyypBoGo48GFRcd4F/)（526 条目与本站数据数量一致，作为设计参照）。
- **取用方式**：本仓库把 JSON 原样收进 `src/palette/data/zhongguose.json`，构建时校验条目数、名称唯一性、色值唯一性与格式。强调色通过 `named("海棠红")` 这样的名字引用，避免硬编码散落。
- **传统色名**：属于公共文化资产；色值整理与网站数据版权归原作者所有，本仓库仅作主题创作的取色参考，并在 README、`docs/palette.md` 中署名。
- **抓取时间**：2026-10-21。

如果后续 Figma 文件导出了变量表，可以用 `src/palette/data.ts` 的 `findByName` / `nameOf` 做一次 diff。
