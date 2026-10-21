/**
 * 宣纸 Xuanzhi — the warm light flavor.
 *
 * The canvas is 鱼肚白, the warm off-white of raw xuan paper. Accents are
 * darker cuts of the same mineral pigments used in 玄墨, so switching flavors
 * feels like the same painting under a different light. Bright terminal colors
 * are deliberately darkened here: on paper, "bright" must mean readable.
 */

import { named } from './data.ts';
import type { Flavor } from './types.ts';

export const xuanzhi: Flavor = {
  meta: {
    id: 'xuanzhi',
    zh: '宣纸',
    en: 'Xuanzhi',
    appearance: 'light',
    description: {
      zh: '生宣的暖白底色，松烟写字，青绿设色。',
      en: 'Raw xuan paper, pine-soot ink, blue-green mineral washes.',
    },
  },

  surface: {
    // 鱼肚白 — the exact paper white from the traditional palette.
    base: named('鱼肚白'),
    alt: '#f1ece2',
    raised: '#eae3d5',
    overlay: '#e3dacb',
    sunken: '#fffdf8',
    input: '#fbf8f1',
    // 藤黄 thinned into paper.
    selection: '#dfd3ba',
    selectionInactive: '#ece5d8',
    hover: '#ede7db',
    active: '#e4dbcc',
  },

  border: {
    subtle: '#e7dfd1',
    normal: '#d6ccb9',
    strong: '#b9ad97',
    focus: named('飞燕草蓝'),
  },

  text: {
    // 松烟墨.
    primary: '#2a2723',
    secondary: '#5b564c',
    muted: '#746b5e',
    faint: '#8f8577',
    inverse: '#f7f4ed',
  },

  syntax: {
    // 垩灰, cooled and darkened one step so comments read as pencil notes
    // and stay clear of 苍黄 (decorators) on paper.
    comment: '#65706f',
    keyword: named('鹤顶红'),
    storage: named('鹤顶红'),
    function: named('飞燕草蓝'),
    method: named('品蓝'),
    string: named('荷叶绿'),
    number: named('蟹蝥红'),
    boolean: named('蟹蝥红'),
    type: named('桔梗紫'),
    constant: named('蟹蝥红'),
    variable: '#2a2723', // 松烟墨
    parameter: named('桔梗紫'),
    property: '#4b463d',
    operator: '#6b6459',
    punctuation: '#857c6d',
    decorator: named('苍黄'),
    tag: named('玫瑰紫'),
    attribute: named('苍黄'),
    regexp: named('玉鈫蓝'),
    escape: named('玉鈫蓝'),
    invalid: named('尖晶玉红'),
    deprecated: '#8f8577',
  },

  status: {
    error: named('尖晶玉红'),
    warning: named('蟹蝥红'),
    info: named('飞燕草蓝'),
    success: named('荷叶绿'),
    modified: named('苍黄'),
    added: named('荷叶绿'),
    deleted: named('尖晶玉红'),
    renamed: named('飞燕草蓝'),
  },

  ansi: [
    '#5b564c', // black
    named('鹤顶红'), // red
    named('荷叶绿'), // green
    named('苍黄'), // yellow
    named('飞燕草蓝'), // blue
    named('桔梗紫'), // magenta
    named('玉鈫蓝'), // cyan
    '#8b8172', // white
    '#a1988a', // bright black
    named('尖晶玉红'), // bright red
    named('薄荷绿'), // bright green
    named('山鸡黄'), // bright yellow (darkened: paper needs dark "brights")
    named('品蓝'), // bright blue
    named('玫瑰紫'), // bright magenta
    named('胆矾蓝'), // bright cyan
    '#b3a998', // bright white
  ],
};
