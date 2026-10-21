import type { Flavor } from './types.ts';
import { xuanmo } from './xuanmo.ts';
import { xuanzhi } from './xuanzhi.ts';

export const flavors: Flavor[] = [xuanmo, xuanzhi];

export const flavorById = {
  xuanmo,
  xuanzhi,
} as const;

export { xuanmo, xuanzhi };
export type { Flavor } from './types.ts';
