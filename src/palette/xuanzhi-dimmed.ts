/**
 * 宣纸 Dimmed — the muted warm-light flavor.
 *
 * Raw xuan paper aged into a tea-stained off-white, with ink that is deeper
 * rather than greyer. Pigments keep their hue identity instead of fading toward
 * neutral, so the page reads as old paper under warm light, not a sheet of frosted glass.
 * Body text clears 10.5:1; the audited comfort ceilings apply unchanged.
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
      zh: '陈纸暖灰，墨色更深；比生宣低一档亮度。',
      en: 'Aged xuan paper and deeper ink, one stop softer than raw paper.',
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
    // 松烟墨, deepened: aged paper gets darker ink, not a grey wash.
    primary: '#2f2b25',
    secondary: '#4f4a40',
    muted: '#665f53',
    faint: '#847c6e',
    inverse: '#f3eee3',
    cursor: named('玉鈫蓝'),
  },

  syntax: {
    // 鼠背灰 — the dimmest note that still clears 4.5:1 on aged paper.
    comment: named('鼠背灰'),
    // Faded pigments, not grey pigments: every hue keeps enough chroma to
    // stay recognisable through the dimmed light.
    keyword: named('烟红'),
    storage: named('烟红'),
    function: named('鷃蓝'),
    method: named('海涛蓝'),
    string: named('荷叶绿'),
    number: named('驼色'),
    boolean: named('驼色'),
    type: named('野菊紫'),
    constant: named('潭水绿'),
    variable: '#2f2b25', // 松烟墨, deepened
    parameter: named('紫灰'),
    property: '#4f4a41',
    operator: '#6b6458',
    punctuation: '#736c5f',
    decorator: named('芓紫'),
    tag: named('芓紫'),
    attribute: named('潭水绿'),
    regexp: named('苍蓝'),
    escape: named('苍蓝'),
    invalid: named('殷红'),
    deprecated: '#857d6f',
  },

  status: {
    error: named('殷红'),
    warning: named('淡豆沙'),
    info: named('鷃蓝'),
    success: named('荷叶绿'),
    modified: named('驼色'),
    added: named('荷叶绿'),
    deleted: named('殷红'),
    renamed: named('鷃蓝'),
  },

  ansi: [
    '#5f594f', // black
    named('烟红'), // red
    named('荷叶绿'), // green
    named('驼色'), // yellow
    named('鷃蓝'), // blue
    named('芓紫'), // magenta
    named('苍蓝'), // cyan
    '#8f8778', // white
    '#a59c8d', // bright black
    named('殷红'), // bright red
    named('薄荷绿'), // bright green
    '#b5851f', // bright yellow (darkened: paper needs dark "brights")
    named('玉鈫蓝'), // bright blue
    named('芓紫'), // bright magenta
    named('苍蓝'), // bright cyan
    '#968c7a', // bright white
  ],
};
