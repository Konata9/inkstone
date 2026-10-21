/**
 * 玄墨 Dimmed — the muted dark flavor.
 *
 * Same ink-grey skeleton as 玄墨, lifted one step and stripped of saturation.
 * The canvas turns from deep pine-soot black into a pale ink grey; every accent
 * is a quieter traditional color, so the painting reads as if the lights were
 * turned down. Unlike Monokai Dimmed, readability is not traded away: the
 * palette still clears the same WCAG floors as the standard flavors.
 */

import { named } from './data.ts';
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
      zh: '淡墨灰底，矿物颜料各降一分饱和度。',
      en: 'Pale ink grey with softened mineral pigments — the same painting, lights turned down.',
    },
  },

  surface: {
    // 暗龙胆紫 lifted toward a hazy ink grey.
    base: '#1b1a20',
    alt: '#201f26',
    raised: '#26242d',
    overlay: '#2e2c37',
    sunken: '#17161b',
    input: '#24222b',
    // 青莲 thinned, then dulled another step.
    selection: '#39364a',
    selectionInactive: '#2a2832',
    hover: '#25232c',
    active: '#302e39',
  },

  border: {
    subtle: '#2a2832',
    normal: '#393643',
    strong: '#4f4a5b',
    focus: named('晴山蓝'),
  },

  text: {
    // 宣纸 white dimmed toward the canvas.
    primary: '#cfc9bf',
    secondary: '#a9a29b',
    muted: '#89838f',
    faint: '#6a6472',
    inverse: '#1b1a20',
  },

  syntax: {
    // 螺甸紫, dimmed by the lighter canvas rather than a new hue.
    comment: '#85809e',
    keyword: named('山黎豆红'),
    storage: named('山黎豆红'),
    function: named('晴山蓝'),
    method: named('晚波蓝'),
    string: named('松霜绿'),
    number: named('山鸡黄'),
    boolean: named('山鸡黄'),
    type: named('土黄'),
    constant: named('土黄'),
    variable: '#cfc9bf', // 宣纸 white, dimmed
    parameter: named('淡牵牛紫'),
    property: '#c0b9ae', // 宣纸 white, dimmed a second step
    operator: '#9d97a8',
    punctuation: '#837d90',
    decorator: named('凤信紫'),
    tag: named('白芨红'),
    attribute: named('土黄'),
    regexp: named('虾壳青'),
    escape: named('虾壳青'),
    invalid: named('银朱'),
    deprecated: '#7a7480',
  },

  status: {
    error: named('银朱'),
    warning: named('山鸡黄'),
    info: named('晴山蓝'),
    success: named('松霜绿'),
    modified: named('土黄'),
    added: named('松霜绿'),
    deleted: named('山黎豆红'),
    renamed: named('晴山蓝'),
  },

  ansi: [
    '#3c3945', // black (lifted off the dithered canvas)
    named('山黎豆红'), // red
    named('松霜绿'), // green
    named('山鸡黄'), // yellow
    named('晴山蓝'), // blue
    named('凤信紫'), // magenta
    named('虾壳青'), // cyan
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
