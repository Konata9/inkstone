/**
 * Loader for the 526 traditional Chinese colors.
 *
 * Data source: https://zhongguose.com/colors.json (author: Perchouli).
 * The same 526-entry palette is published as a Figma community file,
 * "526 个中国传统颜色 色谱". The JSON here is the machine-readable source
 * of truth; every accent hex in a flavor is validated against it.
 */

import { readFileSync } from 'node:fs';
import { normalizeHex } from '../color.ts';

export interface TraditionalColor {
  CMYK: [number, number, number, number];
  RGB: [number, number, number];
  hex: string;
  name: string;
  pinyin: string;
}

const dataUrl = new URL('./data/zhongguose.json', import.meta.url);
export const traditionalColors: TraditionalColor[] = JSON.parse(
  readFileSync(dataUrl, 'utf8'),
) as TraditionalColor[];

const byName = new Map<string, TraditionalColor>();
const byHex = new Map<string, TraditionalColor[]>();

for (const color of traditionalColors) {
  color.hex = normalizeHex(color.hex);
  byName.set(color.name, color);
  const bucket = byHex.get(color.hex) ?? [];
  bucket.push(color);
  byHex.set(color.hex, bucket);
}

export function named(name: string): string {
  const color = byName.get(name);
  if (!color) {
    throw new Error(`Unknown traditional color "${name}". Check src/palette/data/zhongguose.json.`);
  }
  return color.hex;
}

export function findByName(name: string): TraditionalColor | undefined {
  return byName.get(name);
}

export function findByHex(hex: string): TraditionalColor[] {
  return byHex.get(normalizeHex(hex)) ?? [];
}

/** Returns the first traditional name for a hex, if it is an exact palette value. */
export function nameOf(hex: string): string | undefined {
  return byHex.get(normalizeHex(hex))?.[0]?.name;
}
