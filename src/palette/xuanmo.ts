/**
 * 玄墨 Xuanmo — the dark flavor.
 *
 * The canvas is a deep ink black with a violet cast, picked by extending the
 * hue of 暗龙胆紫 (#22202e) down in lightness. Accents are exact values from
 * the 526-color traditional palette, except where a pigment is chroma-
 * compressed for screen comfort (`soften`): those keep the source's hue and
 * lightness and are documented as 「降彩」.
 */

import { named, soften } from './data.ts';
import type { Flavor } from './types.ts';

// 羽扇豆蓝 is both the function hue and the UI interaction colour: links,
// focus, buttons, badges and progress all share this blue.
const interaction = named('羽扇豆蓝');

export const xuanmo: Flavor = {
  meta: {
    id: 'xuanmo',
    zh: '玄墨',
    en: 'Xuanmo',
    appearance: 'dark',
    family: 'ink',
    description: {
      zh: '以松烟墨为底，朱砂为批，矿物颜料层层罩染。',
      en: 'Pine-soot ink ground, cinnabar annotations, mineral pigments layered on top.',
    },
  },

  surface: {
    // Ink, extended from 暗龙胆紫 in lightness.
    base: '#14131a',
    alt: '#1a1922',
    raised: '#22212c',
    overlay: '#2b2a36',
    sunken: '#0f0e14',
    input: '#1e1d27',
    // A wash of 青莲 thinned into the ink.
    selection: '#332f46',
    selectionInactive: '#2a2836',
    hover: '#24222e',
    active: '#302e3c',
  },

  border: {
    subtle: '#262430',
    normal: '#343240',
    strong: '#4a4557',
    focus: interaction,
  },

  text: {
    // 宣纸 white pulled slightly warm, then held inside the 10.5–12.5:1 band:
    // bright enough to read, soft enough to stare at for a whole day.
    primary: '#d4cec4',
    secondary: '#ada599',
    muted: '#8b8597',
    faint: '#6f6979',
    inverse: '#14131a',
    // 羽扇豆蓝 — a cool caret keeps the blinking element away from the
    // annotation red without becoming a second syntax colour.
    cursor: interaction,
  },

  // The same cool blue carries UI actions: red is a brush mark, not a command.
  action: interaction,

  syntax: {
    // 螺甸紫 — the muted violet of inlaid shell, used for prose annotations.
    // Lightened from #74759b to keep comments above 4.5:1 on the ink canvas.
    comment: '#85809e',
    // 海棠红 is a print-ink red; keep its hue and lightness, compress the
    // chroma so it reads as pigment instead of neon on a dark canvas.
    keyword: soften('海棠红', 0.165),
    storage: soften('海棠红', 0.165),
    function: interaction,
    method: named('晴山蓝'),
    string: named('铜绿'),
    number: named('杏黄'),
    boolean: named('杏黄'),
    type: named('土黄'),
    constant: named('杏黄'),
    variable: '#d4cec4', // 宣纸 white, softened
    parameter: named('萝兰紫'),
    property: '#c9c3b9', // 宣纸 white, dimmed
    operator: '#9a94a4',
    punctuation: '#8f899e',
    decorator: named('萝兰紫'),
    tag: soften('山茶红', 0.165),
    attribute: named('土黄'),
    regexp: named('石绿'),
    escape: named('石绿'),
    // 银朱, the classic vermilion pigment — the one role allowed to shout.
    invalid: soften('银朱', 0.18),
    deprecated: '#8a8175',
  },

  status: {
    error: soften('银朱', 0.18),
    warning: named('杏黄'),
    info: named('羽扇豆蓝'),
    success: named('铜绿'),
    modified: named('土黄'),
    added: named('铜绿'),
    deleted: soften('海棠红', 0.165),
    renamed: named('羽扇豆蓝'),
  },

  ansi: [
    '#3a3646', // black (lifted so it is visible on the ink canvas)
    soften('海棠红', 0.18), // red
    named('铜绿'), // green
    named('姜黄'), // yellow
    named('羽扇豆蓝'), // blue
    named('萝兰紫'), // magenta
    named('石绿'), // cyan
    '#cfc8bb', // white
    '#6b6478', // bright black
    soften('山茶红', 0.18), // bright red
    named('蛙绿'), // bright green
    named('秋葵黄'), // bright yellow
    named('晴山蓝'), // bright blue
    named('淡牵牛紫'), // bright magenta
    named('清水蓝'), // bright cyan
    '#f4efe4', // bright white
  ],
};
