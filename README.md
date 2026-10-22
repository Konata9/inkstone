# 墨观 Inkstone

<img src="packages/vscode/icon.png" width="96" align="right" alt="墨观 Inkstone">

一套从 **526 个中国传统颜色** 里长出来的代码配色。墨纸组（玄墨 / 宣纸 + Dimmed）与海瓷组（沧海 / 青瓷）共六个变体，共用同一套色相骨架。

A traditional Chinese color theme for editors and terminals, built from the 526-color [zhongguose](https://zhongguose.com/) palette and the matching Figma color chart.

![墨观 Inkstone 预览](docs/preview.png)

## 六个变体

### 墨与纸

| 变体 | 气质 | 画布 | 关键字 | 字符串 | 类型 |
| --- | --- | --- | --- | --- | --- |
| **玄墨 Xuanmo**（暗） | 松烟墨底，朱砂批注 | `#14131a` | 海棠红 `#f03752` | 铜绿 `#2bae85` | 姜黄 `#e2c027` |
| **玄墨 Dimmed**（暗） | 淡墨灰底，低饱和矿物色 | `#1b1a20` | 山黎豆红 `#c27c88` | 松霜绿 `#83a78d` | 土黄 `#d6a01d` |
| **宣纸 Xuanzhi**（暖亮） | 生宣暖白，赭石花青 | `#f7f4ed` | 鹤顶红 `#d42517` | 荷叶绿 `#1a6840` | 桔梗紫 `#813c85` |
| **宣纸 Dimmed**（暖亮） | 陈纸暖灰，褪色颜料 | `#e9e2d4` | 石板灰 `#624941` | 绿灰 `#314a43` | 紫灰 `#5d3f51` |

### 海与瓷

| 变体 | 气质 | 画布 | 关键字 | 字符串 | 类型 |
| --- | --- | --- | --- | --- | --- |
| **沧海 Canghai**（暗） | 深海暮色，青绿矿物 | `#0d1822` | 银朱 `#f43e06` | 竹绿 `#1ba784` | 淡牵牛紫 `#d1c2d3` |
| **青瓷 Qingci**（亮） | 月白釉底，青灰题字 | `#e8f0ec` | 尖晶玉红 `#cc163a` | 荷叶绿 `#1a6840` | 桔梗紫 `#813c85` |

- 墨纸组关键字用**朱批红**，呼应古籍朱笔批注；海瓷组把银朱 / 尖晶玉红当作釉面上的印章。
- 海瓷组取青绿山水的矿物色：霁青、海青、竹绿、石绿，配少量暖色反光。
- Dimmed 只用于墨纸组：降低饱和度、柔化画布，**不放宽可读性**，正文仍 ≥ 7:1，语法色与注释 ≥ 4.5:1。
- 强调色尽量保留传统色原值；中性表面与个别弱化前景做了明度延展，全部标注在 [色板文档](docs/palette.md)。
- 480 项 WCAG 对比度检查，六个变体执行同一套阈值。

## 安装

### GitHub Releases

每个版本都会在 [Releases](https://github.com/Konata9/inkstone/releases) 附带：

| 产物 | 用途 |
| --- | --- |
| `moguan.inkstone-<version>.vsix` | VS Code / Cursor / Windsurf / VSCodium |
| `inkstone-ghostty-<version>.zip` | Ghostty 主题文件 |
| `inkstone-kaku-<version>.zip` | Kaku / WezTerm Lua 色表 |
| `inkstone-opencode-<version>.zip` | OpenCode V2 主题 |
| `inkstone-<version>.zip` | 全部产物 + `manifest.json` + 安装说明 |
| `manifest.json` / `SHA256SUMS` | 机器可读索引与校验和 |

下面的本地安装方式仍然适用于从源码构建。

### VS Code / Cursor / Windsurf / VSCodium

从 [Releases](https://github.com/Konata9/inkstone/releases) 下载最新 VSIX，或本地构建（暂未上架 Marketplace）。

```bash
pnpm install
pnpm package:vscode
```

产物在 `dist/moguan.inkstone-<version>.vsix`。安装：

```bash
code --install-extension dist/moguan.inkstone-0.3.0.vsix
# Cursor:
cursor --install-extension dist/moguan.inkstone-0.3.0.vsix
```

然后在命令面板执行 **Preferences: Color Theme**，选择：

- `墨观 · 玄墨 (Inkstone Xuanmo)`
- `墨观 · 玄墨 Dimmed (Inkstone Xuanmo Dimmed)`
- `墨观 · 宣纸 (Inkstone Xuanzhi)`
- `墨观 · 宣纸 Dimmed (Inkstone Xuanzhi Dimmed)`
- `墨观 · 沧海 (Inkstone Canghai)`
- `墨观 · 青瓷 (Inkstone Qingci)`

扩展 ID 为 `moguan.inkstone`，同一份 VSIX 适用于所有 VS Code 衍生编辑器。

### Ghostty

```bash
pnpm install:ghostty
```

或手动复制：

```bash
mkdir -p ~/.config/ghostty/themes
cp "dist/ghostty/Inkstone Xuanmo" "dist/ghostty/Inkstone Xuanmo Dimmed" \
   "dist/ghostty/Inkstone Xuanzhi" "dist/ghostty/Inkstone Xuanzhi Dimmed" \
   "dist/ghostty/Inkstone Canghai" "dist/ghostty/Inkstone Qingci" \
   ~/.config/ghostty/themes/
```

在 `~/.config/ghostty/config` 中加入：

```ini
theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo
```

想要低饱和的一对：

```ini
theme = light:Inkstone Xuanzhi Dimmed,dark:Inkstone Xuanmo Dimmed
```

想要海瓷组：

```ini
theme = light:Inkstone Qingci,dark:Inkstone Canghai
```

只想要一个变体就写 `theme = Inkstone Canghai`。`ghostty +list-themes` 可以确认主题已被识别。

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

想用暖色就换成 `inkstone-xuanzhi.lua` 与 `'Inkstone Xuanzhi'`；低饱和版本换成 `inkstone-xuanmo-dimmed.lua` / `'Inkstone Xuanmo Dimmed'`，或 `inkstone-xuanzhi-dimmed.lua` / `'Inkstone Xuanzhi Dimmed'`。

海瓷组用 `inkstone-canghai.lua` / `'Inkstone Canghai'` 与 `inkstone-qingci.lua` / `'Inkstone Qingci'`。

WezTerm 用户把六个 `.lua` 文件放到 `~/.config/wezterm/`，接入方式相同；色表同时包含 `tab_bar` 与 `split`。

### OpenCode

```bash
pnpm install:opencode
```

六个主题会复制到 `~/.config/opencode/themes/`。然后在 `~/.config/opencode/cli.json` 里指定：

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "theme": { "name": "inkstone-xuanmo-dimmed", "mode": "dark" }
}
```

也可以按 `Ctrl+P` → **Open settings** → **Theme**，或运行 `/themes` 直接切换。文件名就是主题名：

| 主题名 | 变体 | 模式 |
| --- | --- | --- |
| `inkstone-xuanmo` | 玄墨 | 暗 |
| `inkstone-xuanmo-dimmed` | 玄墨 Dimmed | 暗 |
| `inkstone-xuanzhi` | 宣纸 | 亮 |
| `inkstone-xuanzhi-dimmed` | 宣纸 Dimmed | 亮 |
| `inkstone-canghai` | 沧海 | 暗 |
| `inkstone-qingci` | 青瓷 | 亮 |

OpenCode 的语义 token 全部从同一份色板映射：正文、背景层、语法、diff、Markdown、反馈色与九级 hue scale 都由生成器输出；`accent` 沿用各变体的关键字红，`interactive` 用晴山蓝。新增主题文件后需要重启 OpenCode。

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
    xuanmo-dimmed.ts      玄墨 Dimmed 语义色板
    xuanzhi.ts            宣纸语义色板
    xuanzhi-dimmed.ts     宣纸 Dimmed 语义色板
    canghai.ts            沧海语义色板
    qingci.ts             青瓷语义色板
  targets/
    vscode.ts             workbench + TextMate + 语义 token
    ghostty.ts            Ghostty 主题
    kaku.ts               Kaku / WezTerm Lua 色表
    opencode.ts           OpenCode V2 主题（base + hue scale）
    preview.ts            预览页
    docs.ts               色板文档
packages/vscode/          VS Code 扩展（VSIX）
dist/                     生成物：Ghostty 主题、Kaku 色表、OpenCode 主题、VSIX
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

生成器保证各端一致：改一处色板，VS Code、Ghostty、Kaku、OpenCode 同时更新。构建会拒绝低于对比度阈值的配色。

发布流程（tag → GitHub Release）见 [docs/releasing.md](docs/releasing.md)。VS Code Marketplace 的上架文案与发布物见 [docs/marketplace.md](docs/marketplace.md)。

### 设计约束

1. **三组光线**：墨纸组以墨与纸为底，Dimmed 抬到淡墨灰 / 压成陈纸色；海瓷组以深海与青瓷釉为底。
2. **传统色可追溯**：`nameOf()` 能把每个色值反查回传统色名，`docs/palette.md` 自动列出。
3. **同一骨架**：六个变体的色相顺序一致（朱 → 蓝 → 绿 → 橙 → 紫 → 青 → 绛），切换只换光线与饱和度。
4. **不做花活**：无渐变、无斜体注释、无玻璃拟态；只做耐看的纸墨与海色。

## 许可与致谢

- 代码以 [MIT](LICENSE) 发布。
- 色值来自 [zhongguose.com](https://zhongguose.com/)（作者 Perchouli）整理的 526 个中国传统颜色，与 Figma 社区色谱「526 个中国传统颜色」同为一套；传统色名属于公共文化资产。
- 架构上参考了 [Catppuccin](https://catppuccin.com/) 的多端生成方式，气质上受益于 Tokyo Night 与 Gruvbox 的克制。
- 预览页使用系统字体，无外部依赖；图标由 `scripts/make-icon.py` 生成。

---

## English

**Inkstone (墨观)** is a traditional Chinese color theme for VS Code-likes and terminals. It takes its accents from the 526-color `zhongguose` palette: cinnabar for keywords, verdigris for strings, turmeric for types, and layered ink neutrals.

- **Xuanmo (玄墨)** — dark, pine-soot ink and cinnabar annotations.
- **Xuanmo Dimmed** — dark, pale ink grey and low-saturation pigments; the same contrast floors.
- **Xuanzhi (宣纸)** — warm light, raw xuan paper and mineral pigments.
- **Xuanzhi Dimmed** — warm light, aged paper and faded pigments; the same contrast floors.
- **Canghai (沧海)** — deep-sea twilight, blue-green minerals and a cinnabar seal.
- **Qingci (青瓷)** — cool light, moon-white celadon glaze and grey ink.

Install the VSIX from `dist/`, or install the Ghostty / Kaku / OpenCode themes with the scripts above. The same Lua scheme also works in WezTerm.

Built with a generator: one semantic palette produces the VS Code themes, the Ghostty themes and the terminal ANSI schemes, and the build fails if any token drops below its contrast floor.
