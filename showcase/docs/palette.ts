/**
 * docs/palette.md — a generated reference for every semantic role, its hex,
 * the traditional color it comes from, and its contrast on the canvas.
 */

import { contrast, formatRatio } from '../../src/color.ts';
import { colorLabel, traditionalColors } from '../../src/palette/data.ts';
import { borderLabels, statusLabels, surfaceLabels, syntaxLabels, textLabels } from '../../src/palette/labels.ts';
import { actionHover, flavorFamilies, flavorName, flavors } from '../../src/palette/index.ts';
import type { Flavor } from '../../src/palette/types.ts';
import { ANSI_NAMES } from '../../src/palette/types.ts';

const accentRows: Array<[string, keyof Flavor['syntax']]> = [
  ['关键字', 'keyword'],
  ['函数', 'function'],
  ['字符串', 'string'],
  ['数字', 'number'],
  ['类型', 'type'],
  ['常量 / 正则', 'regexp'],
  ['装饰器', 'decorator'],
  ['标签', 'tag'],
];

function colorCell(hex: string): string {
  return `<code>${hex}</code>`;
}

function nameCell(hex: string): string {
  return colorLabel(hex) ?? '派生色';
}

function table(rows: Array<[string, string, number]>): string {
  return [
    '| 角色 | 色值 | 传统色名 | 对比度（画布） |',
    '| --- | --- | --- | --- |',
    ...rows.map(
      ([label, hex, ratio]) =>
        `| ${label} | ${colorCell(hex)} | ${nameCell(hex)} | ${formatRatio(ratio)} |`,
    ),
  ].join('\n');
}

function flavorSection(flavor: Flavor): string {
  const base = flavor.surface.base;
  const appearance =
    flavor.meta.appearance === 'dark' ? '暗色' : flavor.meta.family === 'sea' ? '冷色亮色' : '暖色亮色';
  const variant = flavor.meta.dimmed ? '（Dimmed）' : '';
  const rows = (entries: Array<[string, string]>) =>
    entries.map(([label, hex]) => [label, hex, contrast(hex, base)] as [string, string, number]);

  return [
    `## ${flavor.meta.zh} ${flavor.meta.en} · ${appearance}${variant}`,
    '',
    `> ${flavor.meta.description.zh}`,
    '',
    `画布 \`${base}\`，正文对比度 ${formatRatio(contrast(flavor.text.primary, base))}。`,
    '',
    '### 表面',
    '',
    table(rows(Object.entries(flavor.surface).map(([key, hex]) => [surfaceLabels[key as keyof Flavor['surface']]!, hex]))),
    '',
    '### 文字与边框',
    '',
    table(rows([
      ...Object.entries(flavor.text).map(([key, hex]) => [textLabels[key as keyof Flavor['text']]!, hex] as [string, string]),
      ...Object.entries(flavor.border).map(([key, hex]) => [borderLabels[key as keyof Flavor['border']]!, hex] as [string, string]),
    ])),
    '',
    '### 交互',
    '',
    table(rows([
      ['主按钮 / 动作', flavor.action],
      ['主按钮悬停', actionHover(flavor)],
    ])),
    '',
    '### 语法',
    '',
    table(rows(Object.entries(flavor.syntax).map(([key, hex]) => [syntaxLabels[key as keyof Flavor['syntax']]!, hex]))),
    '',
    '### 状态',
    '',
    table(rows(Object.entries(flavor.status).map(([key, hex]) => [statusLabels[key as keyof Flavor['status']]!, hex]))),
    '',
    '### 终端 ANSI 0–15',
    '',
    '| 槽位 | 色值 | 传统色名 | 对比度（画布） |',
    '| --- | --- | --- | --- |',
    ...flavor.ansi.map(
      (hex, index) =>
        `| ${index} · ${ANSI_NAMES[index]} | ${colorCell(hex)} | ${nameCell(hex)} | ${formatRatio(
          contrast(hex, base),
        )} |`,
    ),
    '',
  ].join('\n');
}

export function renderPaletteDoc(): string {
  return [
    '# 墨观 Inkstone · 色板',
    '',
    '> 本文件由 `pnpm build:docs` 自动生成，请勿手动修改。',
    '',
    '## 数据来源',
    '',
    `- 色值来自 [zhongguose.com](https://zhongguose.com/) 的 526 个中国传统颜色（作者 Perchouli），与 Figma 社区色谱「526 个中国传统颜色」同为一套。`,
    `- 构建时校验数据集完整：${traditionalColors.length} 个颜色、名称与色值均唯一。`,
    '- 强调色尽量使用传统色原值；超出彩度预算的颜料保留色相与明度、只压缩彩度（标注为「降彩」），中性表面与弱化前景做了明度延展（标注为「派生色」）。',
    '',
    '## 设计约束',
    '',
    '三组光线、设计原则、对比度与彩度预算见 [设计约束](design.md)。',
    '',
    '## 色相骨架',
    '',
    ...flavorFamilies.flatMap((family) => [
      `### ${family.zh} · ${family.en}`,
      '',
      `| 角色 | ${family.flavors.map((flavor) => flavorName(flavor, 'zh')).join(' | ')} |`,
      `| --- | ${family.flavors.map(() => '---').join(' | ')} |`,
      ...accentRows.map(([label, key]) => {
        const cells = family.flavors.map((flavor) => {
          const hex = flavor.syntax[key];
          return `\`${hex}\` ${colorLabel(hex) ?? '派生'}`;
        });
        return `| ${label} | ${cells.join(' | ')} |`;
      }),
      `| 动作 / 交互 | ${family.flavors
        .map((flavor) => `\`${flavor.action}\` ${colorLabel(flavor.action) ?? '派生'}`)
        .join(' | ')} |`,
      '',
    ]),
    ...flavors.map(flavorSection),
    '## 许可',
    '',
    '主题代码以 MIT 许可发布。传统色名属于公共文化资产，色值整理致谢 zhongguose.com 与 Figma 色谱作者。',
    '',
  ].join('\n');
}
