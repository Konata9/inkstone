import { darken, lighten } from '../color.ts';
import type { Flavor, FlavorFamily } from './types.ts';
import { canghai } from './canghai.ts';
import { qingci } from './qingci.ts';
import { xuanmo } from './xuanmo.ts';
import { xuanmoDimmed } from './xuanmo-dimmed.ts';
import { xuanzhi } from './xuanzhi.ts';
import { xuanzhiDimmed } from './xuanzhi-dimmed.ts';

export const flavors: Flavor[] = [xuanmo, xuanmoDimmed, xuanzhi, xuanzhiDimmed, canghai, qingci];

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

/**
 * Hover/pressed step for the action colour.
 *
 * Dark flavors lift toward white, light flavors sink toward black: both
 * directions increase contrast with the button label, so hover never dips
 * below the resting ratio.
 */
export function actionHover(flavor: Flavor): string {
  return flavor.meta.appearance === 'dark'
    ? lighten(flavor.action, 0.12)
    : darken(flavor.action, 0.12);
}
