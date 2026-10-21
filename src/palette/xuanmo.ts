/**
 * 玄墨 Xuanmo — the dark flavor.
 *
 * The canvas is a deep ink black with a violet cast, picked by extending the
 * hue of 暗龙胆紫 (#22202e) down in lightness. Every accent below is an exact
 * value from the 526-color traditional palette; the only derived colors are
 * the neutral UI shades and a handful of dimmed foregrounds, marked as such.
 */

import { named } from './data.ts';
import type { Flavor } from './types.ts';

export const xuanmo: Flavor = {
  meta: {
    id: 'xuanmo',
    zh: '玄墨',
    en: 'Xuanmo',
    appearance: 'dark',
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
    selection: '#3b3752',
    selectionInactive: '#2a2836',
    hover: '#24222e',
    active: '#302e3c',
  },

  border: {
    subtle: '#262430',
    normal: '#343240',
    strong: '#4a4557',
    focus: named('羽扇豆蓝'),
  },

  text: {
    // 宣纸 white pulled slightly warm so long sessions stay soft.
    primary: '#e8e2d6',
    secondary: '#b8b0a3',
    muted: '#918a9e',
    faint: '#6f6979',
    inverse: '#14131a',
  },

  syntax: {
    // 螺甸紫 — the muted violet of inlaid shell, used for prose annotations.
    // Lightened from #74759b to keep comments above 4.5:1 on the ink canvas.
    comment: '#85809e',
    keyword: named('海棠红'),
    storage: named('海棠红'),
    function: named('羽扇豆蓝'),
    method: named('晴山蓝'),
    string: named('铜绿'),
    number: named('杏黄'),
    boolean: named('杏黄'),
    type: named('姜黄'),
    constant: named('杏黄'),
    variable: '#e8e2d6', // 宣纸 white
    parameter: named('凤信紫'),
    property: '#d8d1c4', // 宣纸 white, dimmed
    operator: '#a9a2b6',
    punctuation: '#8f899e',
    decorator: named('凤信紫'),
    tag: named('山茶红'),
    attribute: named('姜黄'),
    regexp: named('石绿'),
    escape: named('石绿'),
    // 银朱, the classic vermilion pigment.
    invalid: named('银朱'),
    deprecated: '#8a8175',
  },

  status: {
    error: named('银朱'),
    warning: named('杏黄'),
    info: named('羽扇豆蓝'),
    success: named('铜绿'),
    modified: named('姜黄'),
    added: named('铜绿'),
    deleted: named('海棠红'),
    renamed: named('羽扇豆蓝'),
  },

  ansi: [
    '#3a3646', // black (lifted so it is visible on the ink canvas)
    named('海棠红'), // red
    named('铜绿'), // green
    named('姜黄'), // yellow
    named('羽扇豆蓝'), // blue
    named('萝兰紫'), // magenta
    named('石绿'), // cyan
    '#cfc8bb', // white
    '#6b6478', // bright black
    named('山茶红'), // bright red
    named('蛙绿'), // bright green
    named('秋葵黄'), // bright yellow
    named('晴山蓝'), // bright blue
    named('淡牵牛紫'), // bright magenta
    named('清水蓝'), // bright cyan
    '#f4efe4', // bright white
  ],
};
