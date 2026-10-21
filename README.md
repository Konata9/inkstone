# 墨观 Inkstone

<img src="packages/vscode/icon.png" width="96" align="right" alt="墨观 Inkstone">

一套从 **526 个中国传统颜色** 里长出来的代码配色。以墨为底，以矿物颜料为彩；暗色「玄墨」与暖色「宣纸」共用同一套色相骨架。

A traditional Chinese color theme for editors and terminals, built from the 526-color [zhongguose](https://zhongguose.com/) palette and the matching Figma color chart.

![墨观 Inkstone 预览](docs/preview.png)

## 两个变体

| 变体 | 气质 | 画布 | 关键字 | 字符串 | 类型 |
| --- | --- | --- | --- | --- | --- |
| **玄墨 Xuanmo**（暗） | 松烟墨底，朱砂批注 | `#14131a` | 海棠红 `#f03752` | 铜绿 `#2bae85` | 姜黄 `#e2c027` |
| **宣纸 Xuanzhi**（暖亮） | 生宣暖白，赭石花青 | `#f7f4ed` | 鹤顶红 `#d42517` | 荷叶绿 `#1a6840` | 桔梗紫 `#813c85` |

- 关键字用**朱批红**，呼应古籍朱笔批注；字符串取铜绿，类型取姜黄／桔梗紫，注释取螺甸紫／垩灰。
- 强调色尽量保留传统色原值；中性表面与个别弱化前景做了明度延展，全部标注在 [色板文档](docs/palette.md)。
- 160 项 WCAG 对比度检查：正文 ≥ 7:1，语法色与注释 ≥ 4.5:1，运算符/标点 ≥ 3:1。

## 安装

### VS Code / Cursor / Windsurf / VSCodium

本仓库首版以本地 VSIX 分发（暂未上架 Marketplace）。

```bash
pnpm install
pnpm package:vscode
```

产物在 `dist/moguan.inkstone-<version>.vsix`。安装：

```bash
code --install-extension dist/moguan.inkstone-0.1.0.vsix
# Cursor:
cursor --install-extension dist/moguan.inkstone-0.1.0.vsix
```

然后在命令面板执行 **Preferences: Color Theme**，选择：

- `墨观 · 玄墨 (Inkstone Xuanmo)`
- `墨观 · 宣纸 (Inkstone Xuanzhi)`

扩展 ID 为 `moguan.inkstone`，同一份 VSIX 适用于所有 VS Code 衍生编辑器。

### Ghostty

```bash
pnpm install:ghostty
```

或手动复制：

```bash
mkdir -p ~/.config/ghostty/themes
cp "dist/ghostty/Inkstone Xuanmo" "dist/ghostty/Inkstone Xuanzhi" ~/.config/ghostty/themes/
```

在 `~/.config/ghostty/config` 中加入：

```ini
theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo
```

只想要一个变体就写 `theme = Inkstone Xuanmo`。`ghostty +list-themes` 可以确认主题已被识别。

### Kaku / WezTerm

```bash
pnpm install:kaku
```

然后把下面三行追加到 `~/.config/kaku/kaku.lua`（Kaku 会自动重载）：

```lua
config.color_schemes = config.color_schemes or {}
config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')
config.color_scheme = 'Inkstone Xuanmo'
```

想用暖色就换成 `inkstone-xuanzhi.lua` 与 `'Inkstone Xuanzhi'`。

WezTerm 用户把两个 `.lua` 文件放到 `~/.config/wezterm/`，接入方式相同；色表同时包含 `tab_bar` 与 `split`。

## 仓库结构

```
src/
  color.ts                色彩工具：对比度、混色、alpha
  audit.ts                色板审计（构建时强制）
  check.ts                产物检查（主题 key、Ghostty、Lua 语法）
  palette/
    data/zhongguose.json  526 个中国传统颜色（唯一色值来源）
    data/SOURCE.md        数据来源与署名
    xuanmo.ts             玄墨语义色板
    xuanzhi.ts            宣纸语义色板
  targets/
    vscode.ts             workbench + TextMate + 语义 token
    ghostty.ts            Ghostty 主题
    kaku.ts               Kaku / WezTerm Lua 色表
    preview.ts            预览页
    docs.ts               色板文档
packages/vscode/          VS Code 扩展（VSIX）
dist/                     生成物：Ghostty 主题、Kaku 色表、VSIX
preview/index.html        本地预览页（生成物）
docs/palette.md           色板对照表（生成物）
docs/preview.png          预览页截图（生成物）
.github/workflows/        构建 + 打包 CI
```

## 开发

需要 Node 20+（打包 VSIX 时 `vsce` 建议 Node 22）。

```bash
pnpm install
pnpm build        # 审计色板 → 生成全部产物
pnpm test         # 只跑色板审计
pnpm typecheck
pnpm preview      # 构建并在浏览器打开预览页
```

生成器保证三端一致：改一处色板，VS Code、Ghostty、Kaku 同时更新。构建会拒绝低于对比度阈值的配色。

### 设计约束

1. **以墨为底**：暗色画布由「暗龙胆紫」的色相压暗而来；亮色画布直接使用「鱼肚白」。
2. **传统色可追溯**：`nameOf()` 能把每个色值反查回传统色名，`docs/palette.md` 自动列出。
3. **同一骨架**：两个变体的色相顺序一致（朱 → 蓝 → 绿 → 橙 → 紫 → 青 → 绛），切换只换光线。
4. **不做花活**：无渐变、无斜体注释、无玻璃拟态；只做耐看的纸墨。

## 许可与致谢

- 代码以 [MIT](LICENSE) 发布。
- 色值来自 [zhongguose.com](https://zhongguose.com/)（作者 Perchouli）整理的 526 个中国传统颜色，与 Figma 社区色谱「526 个中国传统颜色」同为一套；传统色名属于公共文化资产。
- 架构上参考了 [Catppuccin](https://catppuccin.com/) 的多端生成方式，气质上受益于 Tokyo Night 与 Gruvbox 的克制。
- 预览页使用系统字体，无外部依赖；图标由 `scripts/make-icon.py` 生成。

---

## English

**Inkstone (墨观)** is a traditional Chinese color theme for VS Code-likes and terminals. It takes its accents from the 526-color `zhongguose` palette: cinnabar for keywords, verdigris for strings, turmeric for types, and layered ink neutrals.

- **Xuanmo (玄墨)** — dark, pine-soot ink and cinnabar annotations.
- **Xuanzhi (宣纸)** — warm light, raw xuan paper and mineral pigments.

Install the VSIX from `dist/`, or install the Ghostty / Kaku themes with the scripts above. The same Lua scheme also works in WezTerm.

Built with a generator: one semantic palette produces the VS Code themes, the Ghostty themes and the terminal ANSI schemes, and the build fails if any token drops below its contrast floor.
