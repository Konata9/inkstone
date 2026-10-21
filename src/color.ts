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

/** Composite a possibly translucent color over an opaque backdrop. */
export function flatten(foreground: string, background: string): string {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (fg.a >= 1) return normalizeHex(foreground);
  const mixChannel = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
  return toHex({
    r: mixChannel(fg.r, bg.r),
    g: mixChannel(fg.g, bg.g),
    b: mixChannel(fg.b, bg.b),
    a: 1,
  });
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

export function wcagLevel(ratio: number, large = false): 'AAA' | 'AA' | 'AA Large' | 'fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (large && ratio >= 3) return 'AA Large';
  return 'fail';
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
