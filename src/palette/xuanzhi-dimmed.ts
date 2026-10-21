/**
 * 宣纸 Dimmed — the muted warm-light flavor.
 *
 * Raw xuan paper aged into a tea-stained off-white, with pigments that have
 * faded one step. The canvas is darker than 宣纸 and the accents are quieter,
 * but the palette still clears the same WCAG floors as the standard flavors.
 */

import { named } from './data.ts';
import type { Flavor } from './types.ts';

export const xuanzhiDimmed: Flavor = {
  meta: {
    id: 'xuanzhi-dimmed',
    zh: '宣纸',
    en: 'Xuanzhi',
    appearance: 'light',
    dimmed: true,
    family: 'ink',
    description: {
      zh: '陈纸暖灰，旧色未褪；比生宣低一档亮度。',
      en: 'Aged xuan paper and faded mineral pigments, one stop softer than raw paper.',
    },
  },

  surface: {
    // 鱼肚白, aged into a warmer and darker paper.
    base: '#e9e2d4',
    alt: '#e3dbcb',
    raised: '#dcd3c1',
    overlay: '#d5cbb7',
    sunken: '#f1ebdf',
    input: '#eee7d9',
    // 藤黄 thinned into old paper.
    selection: '#d3c7ae',
    selectionInactive: '#e0d8c8',
    hover: '#e0d8c7',
    active: '#d8cebb',
  },

  border: {
    subtle: '#ded4c2',
    normal: '#cbc0ab',
    strong: '#ada18a',
    focus: named('鲸鱼灰'),
  },

  text: {
    // 松烟墨, softened for long sessions on darker paper.
    primary: '#3a352e',
    secondary: '#5f594f',
    muted: '#686154',
    faint: '#867e70',
    inverse: '#f3eee3',
  },

  syntax: {
    // 鼠背灰 — the dimmest note that still clears 4.5:1 on aged paper.
    comment: named('鼠背灰'),
    keyword: named('石板灰'),
    storage: named('石板灰'),
    function: named('鲸鱼灰'),
    method: named('战舰灰'),
    string: named('绿灰'),
    number: named('驼色'),
    boolean: named('驼色'),
    type: named('紫灰'),
    constant: named('潭水绿'),
    variable: '#3a352e', // 松烟墨, softened
    parameter: named('紫灰'),
    property: '#4f4a41',
    operator: '#6b6458',
    punctuation: '#7d7567',
    decorator: named('龙睛鱼紫'),
    tag: named('芓紫'),
    attribute: named('潭水绿'),
    regexp: named('苍蓝'),
    escape: named('苍蓝'),
    invalid: named('殷红'),
    deprecated: '#857d6f',
  },

  status: {
    error: named('殷红'),
    warning: named('蟹蝥红'),
    info: named('鲸鱼灰'),
    success: named('绿灰'),
    modified: named('驼色'),
    added: named('绿灰'),
    deleted: named('殷红'),
    renamed: named('鲸鱼灰'),
  },

  ansi: [
    '#5f594f', // black
    named('玫瑰灰'), // red
    named('绿灰'), // green
    named('驼色'), // yellow
    named('鲸鱼灰'), // blue
    named('紫灰'), // magenta
    named('战舰灰'), // cyan
    '#8f8778', // white
    '#a59c8d', // bright black
    named('殷红'), // bright red
    named('荷叶绿'), // bright green
    '#b5851f', // bright yellow (darkened: paper needs dark "brights")
    named('玉鈫蓝'), // bright blue
    named('芓紫'), // bright magenta
    named('苍蓝'), // bright cyan
    '#968c7a', // bright white
  ],
};
