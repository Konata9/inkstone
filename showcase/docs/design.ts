/**
 * docs/design.md — the design constraints behind the six flavors.
 *
 * Variant names, canvases and accent colors are read from the palette registry
 * so the document cannot describe a palette the build no longer ships.
 */

import { colorLabel } from '../../src/palette/data.ts';
import { actionHover, flavorFamilies, flavorName, flavors } from '../../src/palette/index.ts';
import type { Flavor } from '../../src/palette/types.ts';
import { document, table } from './shared.ts';

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

function appearanceLabel(flavor: Flavor): string {
  if (flavor.meta.appearance === 'dark') return flavor.meta.dimmed ? '暗色 · Dimmed' : '暗色';
  const tone = flavor.meta.family === 'sea' ? '冷色亮色' : '暖色亮色';
  return flavor.meta.dimmed ? `${tone} · Dimmed` : tone;
}

function colorCell(hex: string): string {
  return `\`${hex}\` ${colorLabel(hex) ?? '派生色'}`;
}

function variantTable(): string {
  return table(
    ['变体', '族', '光线', '画布', '关键字', '字符串', '类型'],
    flavors.map((flavor) => [
      `**${flavorName(flavor)}** ${flavor.meta.en}${flavor.meta.dimmed ? ' Dimmed' : ''}`,
      flavor.meta.family === 'ink' ? '墨与纸' : '海与瓷',
      appearanceLabel(flavor),
      `\`${flavor.surface.base}\``,
      colorCell(flavor.syntax.keyword),
      colorCell(flavor.syntax.string),
      colorCell(flavor.syntax.type),
    ]),
  );
}

function skeletonTables(): string {
  return flavorFamilies
    .map((family) =>
      [
        `### ${family.zh} · ${family.en}`,
        '',
        table(
          ['角色', ...family.flavors.map((flavor) => flavorName(flavor))],
          [
            ...accentRows.map(([label, key]) => [
              label,
              ...family.flavors.map((flavor) => colorCell(flavor.syntax[key])),
            ]),
            ['动作 / 交互', ...family.flavors.map((flavor) => colorCell(flavor.action))],
            ['动作悬停', ...family.flavors.map((flavor) => colorCell(actionHover(flavor)))],
          ],
        ),
      ].join('\n'),
    )
    .join('\n\n');
}

const principles = [
  '1. **三组光线**：墨纸组以墨与纸为底，Dimmed 把灯调暗而不是蒙灰；海瓷组以深海与青瓷釉为底。',
  '2. **对比度是区间**：正文 7–12.5:1（Dimmed ≥ 10.5:1）、语法色 4.5–9:1；过低伤可读性，过高伤耐受度。',
  '3. **彩度有预算**：朱砂系 C ≤ 0.175，其余强调色 C ≤ 0.175，光标 C ≤ 0.105；超出时保留色相与明度、只压彩度。',
  '4. **传统色可追溯**：`nameOf()` 反查原值，降彩颜料通过 `soften()` 记录来源，[色板对照](palette.md) 自动列出。',
  '5. **同一骨架**：六个变体的色相顺序一致（朱 → 蓝 → 绿 → 橙 → 紫 → 青 → 绛），切换只换光线与饱和度。',
  '6. **不做花活**：无渐变、无斜体注释、无玻璃拟态；只做耐看的纸墨与海色。',
  '7. **红做记号，青做动作**：朱砂只留在语法、印章与危险态；按钮、徽标、进度、焦点与选中态用交互蓝，主操作和危险操作各占一个色相。',
].join('\n');

const thresholds = table(
  ['项目', '对比度区间', 'OKLCH 彩度'],
  [
    ['正文 / 画布', '7–12.5:1（Dimmed ≥ 10.5）', '—'],
    ['次要文字', '4.5–8:1（Dimmed ≥ 6.5）', '—'],
    ['弱化文字', '4.5–6:1', '—'],
    ['语法色', '4.5–9:1', '≤ 0.175（错误 0.19）'],
    ['运算符、标点', '4–7:1', '—'],
    ['注释', '4.5–9:1', '≤ 0.175（Dimmed ≥ 0.03）'],
    ['光标', '4.5–7:1', '≤ 0.105'],
    ['主按钮 / 动作', '文字 ≥ 4.5:1，填充 4.5–9:1', '≤ 0.175'],
    ['选区填充', '1.25–1.5:1', '—'],
    ['Dimmed 强调色', '4.5–9:1', '≥ 0.045'],
    ['终端彩色槽位', '3:1（黄/白槽位 2.5:1 / 2:1）', '≤ 0.2'],
    ['焦点环', '≥ 3:1', '—'],
    ['边框', '≥ 1.15:1', '—'],
    ['表面层级', '≥ 1.05:1', '—'],
  ],
);

export function renderDesignDoc(): string {
  return document(
    '墨观 Inkstone · 设计约束',
    '六个变体不是六套配色，而是同一幅画在不同光线、不同饱和度下的六个房间。',
    [
      `## 六个变体\n\n${variantTable()}`,
      [
        '## 三组光线',
        '',
        '- **墨纸组**：玄墨以松烟墨为底，宣纸以生宣暖白为底；Dimmed 降低环境光，墨色仍 ≥ 10.5:1。',
        '- **海瓷组**：沧海取深海暮色与青绿矿物，青瓷取月白釉底与青灰题字。',
        '- **Dimmed 不是灰**：画布更沉、强调色仍保留可辨识的色相（C ≥ 0.045），避免褪成灰雾。',
      ].join('\n'),
      `## 色相骨架\n\n${skeletonTables()}`,
      `## 设计原则\n\n${principles}`,
      `## 审计阈值\n\n构建时六个变体执行同一套阈值；任何一项越界都会让构建失败。\n\n${thresholds}`,
      [
        '## 红做记号，青做动作',
        '',
        '- 关键字、标签、错误、删除保留朱砂 / 砖红，对应古籍里的朱笔批注与印章。',
        '- 按钮、徽标、进度、焦点、选中态、范围高亮、括号匹配与命令反馈统一用各变体的交互蓝。',
        '- 主操作与危险操作不共用色相，确认与破坏在视觉上不会混淆。',
        '- 光标改用交互蓝，不再复用关键字红。',
      ].join('\n'),
      [
        '## 不做的花活',
        '',
        '无渐变、无斜体注释、无玻璃拟态、无发光边框。颜色只做三件事：区分语法、标出状态、提示交互。',
      ].join('\n'),
    ],
  );
}
