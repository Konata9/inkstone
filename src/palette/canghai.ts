/**
 * 沧海 Canghai — the deep-sea night flavor.
 *
 * A blue-green canvas inspired by 青绿山水: 霁青 and 海青 hold the ambient
 * light, 竹绿 and 石绿 supply the mineral washes, and 银朱 / 姜黄 / 淡牵牛紫
 * act as small warm reflections. Cooler and more saturated than 玄墨, but more
 * restrained than a neon night theme.
 */

import { named } from './data.ts';
import type { Flavor } from './types.ts';

export const canghai: Flavor = {
  meta: {
    id: 'canghai',
    zh: '沧海',
    en: 'Canghai',
    appearance: 'dark',
    family: 'sea',
    description: {
      zh: '深海暮色，青绿矿物，银朱点染。',
      en: 'Deep-sea twilight, blue-green minerals, a touch of cinnabar.',
    },
  },

  surface: {
    // 深海暮色 — a cool extension of 苍蓝.
    base: '#0d1822',
    alt: '#12202b',
    raised: '#182833',
    overlay: '#1f3340',
    sunken: '#0a131b',
    input: '#152430',
    // 海青 thinned into the night water.
    selection: '#23404f',
    selectionInactive: '#1a2c38',
    hover: '#172733',
    active: '#20323f',
  },

  border: {
    subtle: '#1b2b36',
    normal: '#29404f',
    strong: '#3d5a6d',
    focus: named('霁青'),
  },

  text: {
    // 月白 cooled toward the sea.
    primary: '#d7e3ec',
    secondary: '#a5b8c7',
    muted: '#7d93a5',
    faint: '#5e7385',
    inverse: '#0d1822',
  },

  syntax: {
    // 晚波蓝 — the quiet note of the tide.
    comment: named('晚波蓝'),
    keyword: named('银朱'),
    storage: named('银朱'),
    function: named('霁青'),
    method: named('海青'),
    string: named('竹绿'),
    number: named('姜黄'),
    boolean: named('姜黄'),
    type: named('淡牵牛紫'),
    constant: named('土黄'),
    variable: '#d7e3ec', // 月白, cooled
    parameter: named('凤信紫'),
    property: '#b9c8d4',
    operator: '#9db0c0',
    punctuation: '#7f95a6',
    decorator: named('萝兰紫'),
    tag: named('山茶红'),
    attribute: named('姜黄'),
    regexp: named('石绿'),
    escape: named('石绿'),
    invalid: named('银朱'),
    deprecated: '#6f8494',
  },

  status: {
    error: named('银朱'),
    warning: named('土黄'),
    info: named('霁青'),
    success: named('竹绿'),
    modified: named('姜黄'),
    added: named('竹绿'),
    deleted: named('银朱'),
    renamed: named('霁青'),
  },

  ansi: [
    '#1b2b36', // black
    named('银朱'), // red
    named('竹绿'), // green
    named('姜黄'), // yellow
    named('海青'), // blue
    named('萝兰紫'), // magenta
    named('石绿'), // cyan
    '#c7d6df', // white
    '#5e7385', // bright black
    named('山茶红'), // bright red
    named('蛙绿'), // bright green
    named('秋葵黄'), // bright yellow
    named('霁青'), // bright blue
    named('淡牵牛紫'), // bright magenta
    named('清水蓝'), // bright cyan
    named('月白'), // bright white
  ],
};
