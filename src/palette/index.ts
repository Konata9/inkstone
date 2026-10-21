import type { Flavor, FlavorFamily } from './types.ts';
import { canghai } from './canghai.ts';
import { qingci } from './qingci.ts';
import { xuanmo } from './xuanmo.ts';
import { xuanmoDimmed } from './xuanmo-dimmed.ts';
import { xuanzhi } from './xuanzhi.ts';
import { xuanzhiDimmed } from './xuanzhi-dimmed.ts';

export const flavors: Flavor[] = [xuanmo, xuanmoDimmed, xuanzhi, xuanzhiDimmed, canghai, qingci];

export const flavorById = {
  xuanmo,
  xuanmoDimmed,
  xuanzhi,
  xuanzhiDimmed,
  canghai,
  qingci,
} as const;

/** Flavors grouped by family, in display order. */
export const flavorFamilies: Array<{ id: FlavorFamily; zh: string; en: string; flavors: Flavor[] }> = [
  { id: 'ink', zh: '墨与纸', en: 'Ink & Paper', flavors: [xuanmo, xuanmoDimmed, xuanzhi, xuanzhiDimmed] },
  { id: 'sea', zh: '海与瓷', en: 'Sea & Celadon', flavors: [canghai, qingci] },
];

/** Display name, e.g. 玄墨 / 玄墨 Dimmed or Xuanmo / Xuanmo Dimmed. */
export function flavorName(flavor: Flavor, lang: 'zh' | 'en' = 'zh'): string {
  const base = lang === 'zh' ? flavor.meta.zh : flavor.meta.en;
  return flavor.meta.dimmed ? `${base} Dimmed` : base;
}

export { canghai, qingci, xuanmo, xuanmoDimmed, xuanzhi, xuanzhiDimmed };
export type { Flavor } from './types.ts';
