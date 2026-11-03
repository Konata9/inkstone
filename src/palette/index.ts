import { darken, lighten } from '../color.ts';
import type { Flavor, FlavorFamily } from './types.ts';
import { canghai } from './canghai.ts';
import { qingci } from './qingci.ts';
import { xuanmo } from './xuanmo.ts';
import { xuanmoDimmed } from './xuanmo-dimmed.ts';
import { xuanzhi } from './xuanzhi.ts';
import { xuanzhiDimmed } from './xuanzhi-dimmed.ts';

export interface FlavorFamilyGroup {
  id: FlavorFamily;
  zh: string;
  en: string;
  flavors: Flavor[];
}

/**
 * Flavors grouped by family, in display order. This is the single source of
 * truth: `flavors` below is derived from it so the two lists cannot drift.
 */
export const flavorFamilies: FlavorFamilyGroup[] = [
  { id: 'ink', zh: '墨与纸', en: 'Ink & Paper', flavors: [xuanmo, xuanmoDimmed, xuanzhi, xuanzhiDimmed] },
  { id: 'sea', zh: '海与瓷', en: 'Sea & Celadon', flavors: [canghai, qingci] },
];

export const flavors: Flavor[] = flavorFamilies.flatMap((family) => family.flavors);

/** Display name, e.g. 玄墨 / 玄墨 Dimmed or Xuanmo / Xuanmo Dimmed. */
export function flavorName(flavor: Flavor, lang: 'zh' | 'en' = 'zh'): string {
  const base = lang === 'zh' ? flavor.meta.zh : flavor.meta.en;
  return flavor.meta.dimmed ? `${base} Dimmed` : base;
}

/**
 * Consistency rules for the flavor registry. Returns one message per problem;
 * an empty array means the registry is sound.
 */
export function validateFlavorRegistry(
  families: readonly FlavorFamilyGroup[] = flavorFamilies,
): string[] {
  const issues: string[] = [];
  const familyIds = new Set<string>();
  const flavorIds = new Set<string>();
  const displayNames = new Set<string>();
  let total = 0;

  for (const family of families) {
    if (familyIds.has(family.id)) {
      issues.push(`family "${family.id}" is listed more than once`);
    }
    familyIds.add(family.id);

    if (family.flavors.length === 0) {
      issues.push(`family "${family.id}" has no flavors`);
    }

    for (const flavor of family.flavors) {
      total += 1;
      const id = flavor.meta.id;
      if (flavor.meta.family !== family.id) {
        issues.push(
          `flavor "${id}" is grouped under "${family.id}" but declares family "${flavor.meta.family}"`,
        );
      }
      if (flavorIds.has(id)) {
        issues.push(`flavor id "${id}" is listed more than once`);
      }
      flavorIds.add(id);

      const name = flavorName(flavor, 'en');
      if (displayNames.has(name)) {
        issues.push(`flavor display name "${name}" is listed more than once`);
      }
      displayNames.add(name);
    }
  }

  if (total === 0) {
    issues.push('the flavor registry is empty');
  }

  return issues;
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
