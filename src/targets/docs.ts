/**
 * docs/palette.md — a generated reference for every semantic role, its hex,
 * the traditional color it comes from, and its contrast on the canvas.
 */

import { contrast, formatRatio } from '../color.ts';
import { colorLabel, traditionalColors } from '../palette/data.ts';
import { flavorFamilies, flavorName, flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { ANSI_NAMES } from '../palette/types.ts';

const surfaceLabels: Record<keyof Flavor['surface'], string> = {
  base: '画布',
  alt: '面板 / 侧栏',
  raised: '浮起表面',
  overlay: '浮层',
  sunken: '深井（终端）',
  input: '输入框',
  selection: '选区',
  selectionInactive: '失焦选区',
  hover: '悬停',
  active: '激活',
};

const borderLabels: Record<keyof Flavor['border'], string> = {
  subtle: '发丝边框',
  normal: '常规边框',
  strong: '强调边框',
  focus: '焦点环',
};

const textLabels: Record<keyof Flavor['text'], string> = {
  primary: '正文',
  secondary: '次要文字',
  muted: '弱化文字',
  faint: '占位文字',
  inverse: '反白文字',
  cursor: '光标',
};

const syntaxLabels: Record<keyof Flavor['syntax'], string> = {
  comment: '注释',
  keyword: '关键字',
  storage: '存储修饰',
  function: '函数',
  method: '方法',
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  type: '类型',
  constant: '常量',
  variable: '变量',
  parameter: '参数',
  property: '属性',
  operator: '运算符',
  punctuation: '标点',
  decorator: '装饰器',
  tag: '标签',
  attribute: '属性名',
  regexp: '正则',
  escape: '转义',
  invalid: '错误',
  deprecated: '废弃',
};

const statusLabels: Record<keyof Flavor['status'], string> = {
  error: '错误',
  warning: '警告',
  info: '信息',
  success: '成功',
  modified: '已修改',
  added: '新增',
  deleted: '删除',
  renamed: '重命名',
};

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
    '> 本文件由 `pnpm build` 自动生成，请勿手动修改。',
    '',
    '## 数据来源',
    '',
    `- 色值来自 [zhongguose.com](https://zhongguose.com/) 的 526 个中国传统颜色（作者 Perchouli），与 Figma 社区色谱「526 个中国传统颜色」同为一套。`,
    `- 构建时校验数据集完整：${traditionalColors.length} 个颜色、名称与色值均唯一。`,
    '- 强调色尽量使用传统色原值；超出彩度预算的颜料保留色相与明度、只压缩彩度（标注为「降彩」），中性表面与弱化前景做了明度延展（标注为「派生色」）。',
    '',
    '## 设计原则',
    '',
    '1. **三组光线**：墨纸组以墨与纸为底，海瓷组以深海与青瓷釉为底；Dimmed 是「把灯调暗」，不是给画面蒙一层灰。',
    '2. **以矿物颜料为彩**：关键字取朱砂系、字符串取铜绿或竹绿、类型取土黄或桔梗紫，颜色名称本身可追溯。',
    '3. **同一骨架**：六个变体的色相顺序一致（红 → 蓝 → 绿 → 橙 → 黄 → 青 → 紫 → 绛），切换时只换光线与饱和度。',
    '4. **对比度是区间，不是下限**：正文 10.5–12.5:1、语法色 4.5–9:1；太高和太低一样会累。光标 4.5–7:1。',
    '5. **彩度有预算**：朱砂系 C ≤ 0.175（错误态 0.19），其余强调色 C ≤ 0.175；光标 C ≤ 0.105。传统色若超出预算，保留色相与明度、只压缩彩度，标注为「降彩」。',
    '6. **Dimmed 降光不降墨**：画布更沉、墨色仍 ≥ 10.5:1，强调色保留可辨识的色相（C ≥ 0.045），避免褪成灰雾。',
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
      '',
    ]),
    '## 审计阈值',
    '',
    '| 项目 | 对比度区间 | OKLCH 彩度 |',
    '| --- | --- | --- |',
    '| 正文 / 画布 | 7–12.5:1（Dimmed ≥ 10.5） | — |',
    '| 次要文字 | 4.5–8:1（Dimmed ≥ 6.5） | — |',
    '| 弱化文字 | 4.5–6:1 | — |',
    '| 语法色 | 4.5–9:1 | ≤ 0.175（错误 0.19） |',
    '| 运算符、标点 | 4–7:1 | — |',
    '| 注释 | 4.5–9:1 | ≤ 0.175（Dimmed ≥ 0.03） |',
    '| 光标 | 4.5–7:1 | ≤ 0.105 |',
    '| 选区填充 | 1.25–1.5:1 | — |',
    '| Dimmed 强调色 | 4.5–9:1 | ≥ 0.045 |',
    '| 终端彩色槽位 | 3:1（黄/白槽位 2.5:1 / 2:1） | ≤ 0.2 |',
    '| 焦点环 | ≥ 3:1 | — |',
    '| 边框 | ≥ 1.15:1 | — |',
    '| 表面层级 | ≥ 1.05:1 | — |',
    '',
    ...flavors.map(flavorSection),
    '## 许可',
    '',
    '主题代码以 MIT 许可发布。传统色名属于公共文化资产，色值整理致谢 zhongguose.com 与 Figma 色谱作者。',
    '',
  ].join('\n');
}
