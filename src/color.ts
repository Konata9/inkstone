/**
 * Small, dependency-free color toolbox.
 *
 * Everything the generators need: normalized hex parsing, WCAG contrast,
 * alpha compositing and mixing for the handful of derived UI shades.
 */

export interface Rgba {
  /** 0–255 */
  r: number;
  /** 0–255 */
  g: number;
  /** 0–255 */
  b: number;
  /** 0–1 */
  a: number;
}

const HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;

export function isValidHex(value: string): boolean {
  if (!HEX_RE.test(value.trim())) return false;
  const hex = value.trim().replace(/^#/, '');
  return hex.length === 3 || hex.length === 4 || hex.length === 6 || hex.length === 8;
}

export function normalizeHex(value: string): string {
  let hex = value.trim().replace(/^#/, '').toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex)) throw new Error(`Invalid hex color: ${value}`);
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (hex.length !== 6 && hex.length !== 8) {
    throw new Error(`Invalid hex color: ${value}`);
  }
  return `#${hex}`;
}

export function parseHex(value: string): Rgba {
  const hex = normalizeHex(value).slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

export function toHex({ r, g, b, a }: Rgba): string {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  const base = `#${channel(r)}${channel(g)}${channel(b)}`;
  return a >= 1 ? base : `${base}${channel(a * 255)}`;
}

/** WCAG relative luminance of an opaque color. */
export function luminance(value: string): number {
  const { r, g, b } = parseHex(value);
  const channel = (n: number) => {
    const c = n / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mix two colors in sRGB space. `ratio` is the weight of `a` (0–1). */
export function mix(a: string, b: string, ratio: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  const t = Math.max(0, Math.min(1, ratio));
  return toHex({
    r: x.r * t + y.r * (1 - t),
    g: x.g * t + y.g * (1 - t),
    b: x.b * t + y.b * (1 - t),
    a: 1,
  });
}

export function alpha(value: string, a: number): string {
  const { r, g, b } = parseHex(value);
  return toHex({ r, g, b, a: Math.max(0, Math.min(1, a)) });
}

/** Add white, used for soft foregrounds and highlights. */
export function lighten(value: string, amount: number): string {
  return mix('#ffffff', value, amount);
}

/** Subtract toward black. */
export function darken(value: string, amount: number): string {
  return mix('#000000', value, amount);
}

/**
 * OKLCH, the perceptual space the palette uses for comfort limits.
 *
 * WCAG contrast only sees luminance, so two colors can pass every audit and
 * still glare because one of them is 10× more chromatic than its neighbours.
 * OKLCH lets the palette clamp chroma without shifting hue or lightness.
 */
export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number;
  /** Chroma, 0–0.4. */
  c: number;
  /** Hue angle in degrees, 0–360. */
  h: number;
}

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
  const c = Math.max(0, Math.min(1, channel));
  return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
}

export function toOklch(value: string): Oklch {
  const { r, g, b } = parseHex(value);
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)] as [number, number, number];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return {
    l: L,
    c: Math.hypot(A, B2),
    h: ((Math.atan2(B2, A) * 180) / Math.PI + 360) % 360,
  };
}

export function fromOklch({ l: L, c, h }: Oklch): string {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return toHex({
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    a: 1,
  });
}

/** Perceptual chroma of a color. */
export function chromaOf(value: string): number {
  return toOklch(value).c;
}

/** Shortest distance between two hue angles, in degrees. */
export function hueDistance(a: number, b: number): number {
  const delta = Math.abs(a - b) % 360;
  return delta > 180 ? 360 - delta : delta;
}

/**
 * Keep hue and lightness, reduce chroma to `limit`.
 * Used for pigment reds that are print-ink saturated but glare on screens.
 */
export function softenToChroma(value: string, limit: number): string {
  const color = toOklch(value);
  if (color.c <= limit) return normalizeHex(value);
  return fromOklch({ ...color, c: limit });
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
