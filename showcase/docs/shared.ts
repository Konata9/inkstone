/**
 * Shared rendering helpers for the generated documentation under `docs/`.
 *
 * Every document is Markdown rendered from TypeScript so the repository
 * structure, palette facts and release commands have one maintainable source.
 */

import { SITE_ORIGIN } from '../site/outputs.ts';

/** Shown at the top of every generated document. */
export const DOC_BANNER = '> 本文件由 `pnpm build:docs` 自动生成，请勿手动修改。';

export const REPO_URL = 'https://github.com/Konata9/inkstone';
export const RELEASES_URL = `${REPO_URL}/releases`;
export const MARKETPLACE_URL =
  'https://marketplace.visualstudio.com/items?itemName=Konata9.inkstone';
export const OPEN_VSX_URL = 'https://open-vsx.org/extension/Konata9/inkstone';
export const SITE_URL = `${SITE_ORIGIN}/`;

/** A Markdown table; the first row is the header. */
export function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

/** Compose a generated document with a title, intro and sections. */
export function document(title: string, intro: string, sections: string[]): string {
  return [
    `# ${title}`,
    '',
    DOC_BANNER,
    '',
    intro.trim(),
    '',
    ...sections.flatMap((section) => [section.trim(), '']),
    '---',
    '',
    `[返回仓库 README](../README.md) · [文档首页](README.md) · [官网](${SITE_URL})`,
    '',
  ].join('\n');
}

/** The docs index links every generated reference. */
export function docsIndex(): string {
  return document(
    '墨观 Inkstone · 文档',
    [
      '主题本身在 [README](../README.md) 里介绍。这里放实现细节：设计约束、完整安装、开发流程与发布流程。',
      '',
      '所有文档都由 `pnpm build:docs` 生成。改文档时请修改 `showcase/docs/` 下的生成器，而不是直接编辑 `docs/*.md`。',
    ].join('\n'),
    [
      table(
        ['文档', '内容', '适合谁'],
        [
          ['[设计约束](design.md)', '三组光线、六个变体、色相骨架、对比度与彩度预算', '想理解配色为什么这样定的人'],
          ['[色板对照](palette.md)', '每个语义角色的色值、传统色名与画布对比度', '想查具体色值或做二次创作的人'],
          ['[安装详解](installation.md)', '各编辑器、终端与 DSH 的完整安装和手动配置', '需要手动安装或排障的人'],
          ['[开发](development.md)', '环境、命令、仓库结构、生成管线与扩展方式', '要改主题或新增 target 的人'],
          ['[发布](publishing.md)', '两条版本线、Marketplace / Open VSX、预发布与重试', '维护版本与 CI 的人'],
        ],
      ),
      [
        '## 快速入口',
        '',
        `- [从 Marketplace 安装](${MARKETPLACE_URL})`,
        `- [从 Open VSX 安装](${OPEN_VSX_URL})`,
        `- [下载 Releases](${RELEASES_URL})`,
        `- [访问官网](${SITE_URL})`,
      ].join('\n'),
    ],
  );
}
