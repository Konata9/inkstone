/**
 * docs/development.md — repository layout, commands and the generation pipeline.
 */

import { document, table } from './shared.ts';

const commands = table(
  ['命令', '作用'],
  [
    ['`pnpm install`', '安装开发依赖'],
    ['`pnpm build`', '审计色板 → 清空 `dist/` → 生成全部主题产物'],
    ['`pnpm build:site`', '清空 `site/` → 生成官网静态页（EN + ZH）'],
    ['`pnpm build:docs`', '生成 `docs/` 下的全部 Markdown'],
    ['`pnpm test`', '色板审计 + 产物检查（与 `pnpm build` 的检查一致）'],
    ['`pnpm typecheck`', 'TypeScript 类型检查'],
    ['`pnpm capture:preview`', '内存渲染 3×2 编辑器总览并截图到 `docs/preview.png`（需 Playwright）'],
    ['`pnpm site`', '构建官网并在浏览器打开 `site/index.html`'],
    ['`pnpm package:vscode`', '构建并打包 VSIX 到 `dist/`'],
    ['`pnpm package:release`', '生成 GitHub Release 所需的全部产物'],
    ['`pnpm release`', '升版本、构建、提交、打 tag、推送（`--target vscode` 走扩展线）'],
    ['`pnpm release:check`', '发布前检查 tag、CHANGELOG 与生成物漂移'],
  ],
);

const tree = `\`\`\`
README.md                   中文主介绍：主题、预览、支持的软件、速装、文档入口
README_EN.md                英文镜像
src/                        主题 + 各端软件 target
  build.ts                  构建入口：检查、清空 dist、写产物
  validate.ts               pnpm test 入口
  color.ts                  色彩工具：对比度、OKLCH、混色、alpha
  audit.ts                  色板审计（构建时强制）
  check.ts                  产物检查（主题 key、Ghostty、Lua 语法）
  checks.ts                 build 与 validate 共用的检查入口
  outputs.ts                pnpm build 的产物清单
  version.ts                根 package.json 版本读取
  palette/
    data/zhongguose.json    526 个中国传统颜色（唯一色值来源）
    data/SOURCE.md          数据来源与署名
    data.ts                 传统色查询、降彩记录与色名标签
    labels.ts               语义角色的中文标签（色板文档与展示共用）
    index.ts                变体注册表与族分组（唯一来源）
    types.ts                Flavor / token 类型定义
    registry.test.ts        注册表一致性测试
    xuanmo.ts               玄墨语义色板
    xuanmo-dimmed.ts        玄墨 Dimmed 语义色板
    xuanzhi.ts              宣纸语义色板
    xuanzhi-dimmed.ts       宣纸 Dimmed 语义色板
    canghai.ts              沧海语义色板
    qingci.ts               青瓷语义色板
  targets/
    naming.ts               各端文件名与主题显示名（唯一来源）
    vscode.ts               workbench + TextMate + 语义 token
    ghostty.ts              Ghostty 主题
    kaku.ts                 Kaku / WezTerm 色表（Lua + TOML）
    opencode.ts             OpenCode V2 主题（base + hue scale）
    zed.ts                  Zed 主题（ThemeFamily + extension.toml）
    dsh.ts                  DSH 主题插件（菜单版 + 三对明暗变体）
    dsh-tokens.ts           DSH 0.2.1 颜色 token 冻结清单
showcase/                   展示层源码（与 src/ 平级）
  specimen.ts               CSS 变量、色卡、编辑器示意（官网与截图共用）
  outputs.ts                展示层产物清单（供 drift check）
  docs/                     文档生成器
    build.ts                文档构建入口
    outputs.ts              文档产物清单
    shared.ts               生成文件头、表格与链接
    index.ts                文档首页
    design.ts               设计约束
    installation.ts         安装详解
    development.ts          开发流程
    publishing.ts           发布流程
    palette.ts              色板对照
  site/                     官网源码
    build.ts                官网构建入口（清空并写入 site/）
    outputs.ts              页面渲染、SEO 文件与产物清单
    copy.ts                 官网中英文案
    templates/              Liquid 模板（结构 / CSS / JS）
    assets/                 OG 图等静态素材
  preview/
    gallery.ts              3×2 编辑器总览（内存渲染）
    capture.ts              Playwright 截图入口
scripts/                    安装脚本、VSIX 与 Release 打包、发布辅助
packages/vscode/            VS Code 扩展（VSIX 源码与生成的主题 JSON）
dist/                       生成物：Ghostty、Kaku、OpenCode、Zed、DSH、VSIX
site/                       官网产物（生成物，GitHub Pages）
docs/                       文档产物（生成物；preview.png 由截图命令生成）
.github/workflows/          构建、打包与发布 CI
\`\`\``;

export function renderDevelopmentDoc(): string {
  return document(
    '墨观 Inkstone · 开发',
    [
      '主题由一份语义色板生成到所有平台。改一处颜色，VS Code、Ghostty、Kaku、OpenCode、Zed、DSH 与官网同时更新；越界的配色会让构建直接失败。',
      '',
      '需要 Node 20+（打包 VSIX 时 `vsce` 建议 Node 22）和 pnpm 10。',
    ].join('\n'),
    [
      `## 常用命令\n\n${commands}`,
      `## 仓库结构\n\n${tree}`,
      [
        '## 生成管线',
        '',
        '1. **色板**：`src/palette/` 里的六个变体各自声明表面、文字、交互、语法、状态与 ANSI 色。变体注册表在 `src/palette/index.ts`，族分组也从这里导出。',
        '2. **审计**：`src/audit.ts` 对六个变体执行同一套对比度区间与 OKLCH 彩度预算检查，共 872 项。',
        '3. **产物**：`src/targets/` 把同一份语义色板翻译成各端格式；`src/outputs.ts` 汇总 `pnpm build` 写出的文件。',
        '4. **展示层**：`showcase/` 只读取 `src/`，不会被 `src/` 反向依赖。官网、文档、README 截图都从这里生成。',
        '5. **检查**：`pnpm test` 不写文件，只运行与构建相同的检查；`pnpm release:check` 还会比对所有已提交的生成物。',
      ].join('\n'),
      [
        '## 改一处颜色',
        '',
        '1. 修改 `src/palette/<flavor>.ts` 里对应角色的色值。',
        '2. 运行 `pnpm test`，确认对比度与彩度仍在预算内。',
        '3. 运行 `pnpm build`，更新 `packages/vscode/themes/` 与 `dist/`。',
        '4. 运行 `pnpm build:docs` 与 `pnpm build:site`，更新文档和官网。',
        '5. 运行 `pnpm capture:preview` 更新 `docs/preview.png`。',
        '6. 提交生成物；CI 与 `pnpm release:check` 会拒绝漂移。',
      ].join('\n'),
      [
        '## 新增变体',
        '',
        '1. 在 `src/palette/` 新建语义色板，声明 `meta`、表面、文字、交互、语法、状态与 16 个 ANSI 槽位。',
        '2. 在 `src/palette/index.ts` 的对应族里注册，确保 `meta.family` 与分组一致。',
        '3. 运行 `pnpm test`，色板审计会检查对比度、彩度、色相骨架与注册表一致性。',
        '4. 运行 `pnpm build`；命名、VS Code `contributes.themes`、各端文件与 DSH token 映射都会自动展开。',
        '5. 运行 `pnpm build:docs` 与 `pnpm capture:preview`，文档表格和预览图会包含新变体。',
      ].join('\n'),
      [
        '## 新增 target',
        '',
        '1. 在 `src/targets/` 新建生成器，返回 `GeneratedFile[]`，文件名走 `src/targets/naming.ts`。',
        '2. 在 `src/outputs.ts` 注册，让它进入 `pnpm build` 与检查流程。',
        '3. 在 `src/check.ts` 加产物校验：key 是否完整、语法是否可解析、必要文件是否存在。',
        '4. 需要安装脚本时在 `scripts/` 添加脚本，并在 `package.json` 暴露 `install:<target>`。',
        '5. 在 `showcase/docs/installation.ts` 与 `development.ts` 补安装和结构说明。',
        '6. 运行 `pnpm test`、`pnpm build`、`pnpm typecheck`，确认新产物与文档同步。',
      ].join('\n'),
      [
        '## 生成物与漂移检查',
        '',
        '`src/outputs.ts` 与 `showcase/outputs.ts` 各自维护一份生成物清单，`scripts/versioning.ts` 的 drift check 会把仓库里的文件与重新生成的结果逐字节比对。',
        '',
        '- `dist/` 被 `.gitignore` 忽略，构建前会整体清空。',
        '- `site/` 被 `.gitignore` 忽略，`pnpm build:site` 会整体清空。',
        '- `packages/vscode/themes/`、`docs/` 与 `site/favicon.png` 是已提交生成物，必须随源码更新。',
        '- 版本 tag 与生成物不一致时，`pnpm release:check` 会在构建前快速失败。',
      ].join('\n'),
      [
        '## 文档与官网',
        '',
        '- 文档：`showcase/docs/*.ts` 生成 `docs/*.md`，入口是 `showcase/docs/build.ts`。',
        '- 官网：`showcase/site/` 生成 `site/`，默认英文，中文在 `site/zh/`；页面 chrome 跟随系统明暗选用玄墨 / 宣纸。',
        '- 预览：`showcase/preview/` 在内存渲染 3×2 编辑器总览，直接截图到 `docs/preview.png`。',
        '- README 是手写文件；主题色值表以生成后的 [色板对照](palette.md) 为准。',
      ].join('\n'),
    ],
  );
}
