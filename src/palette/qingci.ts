/**
 * 青瓷 Qingci — the celadon daylight flavor.
 *
 * A cool counterpart to 宣纸: moon-white celadon glaze, 青灰 ink and a single
 * vermilion seal. The canvas is slightly deeper than 月白 so the cool greys
 * have room to breathe, and every accent keeps the same WCAG floors as the
 * rest of the set.
 */

import { named } from './data.ts';
import type { Flavor } from './types.ts';

export const qingci: Flavor = {
  meta: {
    id: 'qingci',
    zh: '青瓷',
    en: 'Qingci',
    appearance: 'light',
    family: 'sea',
    description: {
      zh: '月白釉底，青灰题字，雨过天青。',
      en: 'Moon-white celadon glaze, cool grey ink, sky after rain.',
    },
  },

  surface: {
    // 月白, aged into a celadon glaze.
    base: '#e8f0ec',
    alt: '#e1eae4',
    raised: '#d9e3dc',
    overlay: '#d1dcd4',
    sunken: '#f2f8f4',
    input: '#edf4ef',
    // 海青 thinned into the glaze.
    selection: '#cbdcd2',
    selectionInactive: '#dfe9e2',
    hover: '#e2ebe5',
    active: '#d7e2da',
  },

  border: {
    subtle: '#dbe6df',
    normal: '#c7d5cc',
    strong: '#a8bab0',
    focus: named('玉鈫蓝'),
  },

  text: {
    // 青灰 — cool ink instead of 松烟墨.
    primary: named('青灰'),
    secondary: '#4f5b5a',
    muted: '#5f6b67',
    faint: '#7d8983',
    inverse: '#f2f8f4',
  },

  syntax: {
    // 战舰灰 — the dimmest note that still clears 4.5:1 on glaze.
    comment: named('战舰灰'),
    keyword: named('尖晶玉红'),
    storage: named('尖晶玉红'),
    function: named('玉鈫蓝'),
    method: named('苍蓝'),
    string: named('荷叶绿'),
    number: named('驼色'),
    boolean: named('驼色'),
    type: named('桔梗紫'),
    constant: named('潭水绿'),
    variable: named('青灰'),
    parameter: named('紫灰'),
    property: '#3f4a46',
    operator: '#5f6b67',
    punctuation: '#74817b',
    decorator: named('龙睛鱼紫'),
    tag: named('芓紫'),
    attribute: named('潭水绿'),
    regexp: named('苍蓝'),
    escape: named('苍蓝'),
    invalid: named('殷红'),
    deprecated: '#7d8983',
  },

  status: {
    error: named('殷红'),
    warning: named('蟹蝥红'),
    info: named('玉鈫蓝'),
    success: named('荷叶绿'),
    modified: named('驼色'),
    added: named('荷叶绿'),
    deleted: named('殷红'),
    renamed: named('玉鈫蓝'),
  },

  ansi: [
    '#4f5b5a', // black
    named('尖晶玉红'), // red
    named('荷叶绿'), // green
    named('驼色'), // yellow
    named('玉鈫蓝'), // blue
    named('桔梗紫'), // magenta
    named('战舰灰'), // cyan
    '#7d8983', // white
    '#a5b3ac', // bright black
    named('殷红'), // bright red
    named('薄荷绿'), // bright green
    named('山鸡黄'), // bright yellow
    named('搪磁蓝'), // bright blue
    named('芓紫'), // bright magenta
    named('苍蓝'), // bright cyan
    '#8f9c96', // bright white
  ],
};
