/**
 * 玄墨 Dimmed — the muted dark flavor.
 *
 * Same ink-grey skeleton as 玄墨, but the room is darker rather than lifted
 * into grey. Pigments keep most of their chroma instead of collapsing toward
 * neutral, so every hue stays recognisable. This is "the lights turned down", not "a sheet
 * of tracing paper over the screen". Readability is not traded away: body text
 * still clears 10.5:1 and the audited comfort ceilings apply unchanged.
 */

import { named, soften } from './data.ts';
import type { Flavor } from './types.ts';

export const xuanmoDimmed: Flavor = {
  meta: {
    id: 'xuanmo-dimmed',
    zh: '玄墨',
    en: 'Xuanmo',
    appearance: 'dark',
    dimmed: true,
    family: 'ink',
    description: {
      zh: '深墨夜色，矿物颜料各降一分饱和度。',
      en: 'A deeper ink room with pigments softened one step — the same painting, lights turned down.',
    },
  },

  surface: {
    // 暗龙胆紫, deepened instead of lifted: Dimmed lowers the light in the
    // room, it does not put a grey veil over the ink.
    base: '#19181e',
    alt: '#1e1d24',
    raised: '#24222b',
    overlay: '#2b2933',
    sunken: '#151419',
    input: '#22212a',
    // 青莲 thinned, then dulled another step.
    selection: '#363347',
    selectionInactive: '#292732',
    hover: '#232129',
    active: '#2e2c36',
  },

  border: {
    subtle: '#2a2832',
    normal: '#393643',
    strong: '#4f4a5b',
    focus: named('晴山蓝'),
  },

  text: {
    // 宣纸 white, dimmed by the room rather than by a layer of fog: the ink
    // still clears the same 10.5:1 floor as the standard flavors.
    primary: '#d8d2c6',
    secondary: '#b0a99f',
    muted: '#8f8996',
    faint: '#726c7a',
    inverse: '#19181e',
    cursor: named('羽扇豆蓝'),
  },

  syntax: {
    // 螺甸紫, dimmed by the deeper canvas rather than a new hue.
    comment: '#85809e',
    keyword: named('山黎豆红'),
    storage: named('山黎豆红'),
    // Pigments keep their hue identity: only ~25% of the chroma is given up.
    function: named('涧石蓝'),
    method: named('羽扇豆蓝'),
    string: named('梧枝绿'),
    number: named('山鸡黄'),
    boolean: named('山鸡黄'),
    type: named('土黄'),
    constant: named('土黄'),
    variable: '#d8d2c6', // 宣纸 white, dimmed
    parameter: named('青蛤壳紫'),
    property: '#c5bfb4', // 宣纸 white, dimmed a second step
    operator: '#9d97a8',
    punctuation: '#837d90',
    decorator: named('萝兰紫'),
    tag: named('白芨红'),
    attribute: named('土黄'),
    regexp: named('孔雀蓝'),
    escape: named('孔雀蓝'),
    invalid: soften('银朱', 0.18),
    deprecated: '#7a7480',
  },

  status: {
    error: soften('银朱', 0.18),
    warning: named('山鸡黄'),
    info: named('涧石蓝'),
    success: named('梧枝绿'),
    modified: named('土黄'),
    added: named('梧枝绿'),
    deleted: named('山黎豆红'),
    renamed: named('涧石蓝'),
  },

  ansi: [
    '#3c3945', // black (lifted off the dithered canvas)
    named('山黎豆红'), // red
    named('淡绿'), // green
    named('山鸡黄'), // yellow
    named('涧石蓝'), // blue
    named('青蛤壳紫'), // magenta
    named('美蝶绿'), // cyan
    '#c4bdb2', // white
    '#6e6875', // bright black
    named('白芨红'), // bright red
    named('浪花绿'), // bright green
    named('土黄'), // bright yellow
    named('星蓝'), // bright blue
    named('淡牵牛紫'), // bright magenta
    named('鸥蓝'), // bright cyan
    '#ddd6ca', // bright white
  ],
};
