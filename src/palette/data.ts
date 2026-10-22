/**
 * Loader for the 526 traditional Chinese colors.
 *
 * Data source: https://zhongguose.com/colors.json (author: Perchouli).
 * The same 526-entry palette is published as a Figma community file,
 * "526 个中国传统颜色 色谱". The JSON here is the machine-readable source
 * of truth; every accent hex in a flavor is validated against it.
 */

import { readFileSync } from 'node:fs';
import { chromaOf, hueDistance, normalizeHex, softenToChroma, toOklch } from '../color.ts';

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

/**
 * Source names for chroma-compressed pigments.
 *
 * A softened color is still the same pigment, so the palette records where it
 * came from instead of guessing by hue after the fact.
 */
const softenedSources = new Map<string, string>();

export function soften(name: string, limit: number): string {
  const hex = softenToChroma(named(name), limit);
  softenedSources.set(normalizeHex(hex), name);
  return hex;
}

/** The pigment a softened color came from, if it was registered by `soften`. */
export function softenedSource(hex: string): string | undefined {
  return softenedSources.get(normalizeHex(hex));
}

export interface TraditionalMatch {
  color: TraditionalColor;
  /** Lightness difference in OKLCH. */
  deltaL: number;
  /** Hue difference in degrees. */
  deltaHue: number;
}

const oklchCache = new Map<string, ReturnType<typeof toOklch>>();

function oklchOf(hex: string) {
  const cached = oklchCache.get(hex);
  if (cached) return cached;
  const color = toOklch(hex);
  oklchCache.set(hex, color);
  return color;
}

/**
 * Find the traditional color a derived value came from, if any.
 *
 * A chroma-compressed pigment keeps its hue and lightness, so the source is
 * still traceable: only the saturation moved. This is what lets the palette
 * document say "海棠红 · 降彩" instead of losing provenance to "派生色".
 */
export function nearestTraditional(
  hex: string,
  options: { hueTolerance?: number; lightnessTolerance?: number } = {},
): TraditionalMatch | undefined {
  const { hueTolerance = 3, lightnessTolerance = 0.025 } = options;
  const target = oklchOf(normalizeHex(hex));
  let best: TraditionalMatch | undefined;

  for (const color of traditionalColors) {
    const candidate = oklchOf(color.hex);
    const deltaHue = target.c <= 0.02 ? 0 : hueDistance(target.h, candidate.h);
    const deltaL = Math.abs(target.l - candidate.l);
    if (deltaHue > hueTolerance || deltaL > lightnessTolerance) continue;
    // A softened pigment keeps hue and lightness and gives up chroma, so the
    // most chromatic neighbor is the source; hue/lightness only break ties.
    if (!best) {
      best = { color, deltaHue, deltaL };
      continue;
    }
    const candidateChroma = oklchOf(best.color.hex).c;
    const sourceChroma = candidate.c;
    if (sourceChroma > candidateChroma + 0.005) {
      best = { color, deltaHue, deltaL };
    } else if (Math.abs(sourceChroma - candidateChroma) <= 0.005) {
      if (deltaHue < best.deltaHue || (deltaHue === best.deltaHue && deltaL < best.deltaL)) {
        best = { color, deltaHue, deltaL };
      }
    }
  }

  return best;
}

/**
 * Human label for a palette value: exact name, softened source, or 派生色.
 * Softened colors are only labelled when the source is clearly more chromatic.
 */
export function colorLabel(hex: string): string | undefined {
  const exact = nameOf(hex);
  if (exact) return exact;
  const source = softenedSources.get(normalizeHex(hex));
  if (source) return `${source} · 降彩`;
  // Near-neutral shades have unstable hue angles; naming them after a random
  // traditional color is worse than admitting they are derived.
  if (chromaOf(hex) < 0.05) return undefined;
  const match = nearestTraditional(hex, { hueTolerance: 4, lightnessTolerance: 0.02 });
  if (!match) return undefined;
  return chromaOf(match.color.hex) > chromaOf(hex) + 0.01
    ? `${match.color.name} · 降彩`
    : match.color.name;
}
