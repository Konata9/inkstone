/**
 * Shared file and display names for generated targets.
 *
 * The build, the post-build checks and the release packager all have to agree
 * on these strings; deriving them from one place keeps a rename from silently
 * producing archives that reference files no longer on disk.
 */

import { flavorName } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';

/** Ghostty theme name, which is also its file name: `Inkstone Xuanmo Dimmed`. */
export function ghosttyThemeName(flavor: Flavor): string {
  return `Inkstone ${flavorName(flavor, 'en')}`;
}

/** Kaku / WezTerm Lua file name: `inkstone-xuanmo.lua`. */
export function kakuFileName(flavor: Flavor): string {
  return `inkstone-${flavor.meta.id}.lua`;
}

/** Kaku `colors` directory file name: `inkstone-xuanmo.toml`. */
export function kakuTomlFileName(flavor: Flavor): string {
  return `inkstone-${flavor.meta.id}.toml`;
}

/** Scheme name inside the Lua and TOML files: `Inkstone Xuanmo`. */
export function kakuSchemeName(flavor: Flavor): string {
  return `Inkstone ${flavorName(flavor, 'en')}`;
}

/** Warp theme YAML file name: `inkstone-xuanmo.yaml`. */
export function warpFileName(flavor: Flavor): string {
  return `inkstone-${flavor.meta.id}.yaml`;
}

/** Name shown in Warp's theme picker: `Inkstone Xuanmo`. */
export function warpThemeName(flavor: Flavor): string {
  return `Inkstone ${flavorName(flavor, 'en')}`;
}

/** VS Code theme JSON file name: `xuanmo-color-theme.json`. */
export function vscodeFileName(flavor: Flavor): string {
  return `${flavor.meta.id}-color-theme.json`;
}

/** OpenCode theme name, which is also its file stem: `inkstone-xuanmo`. */
function opencodeThemeName(flavor: Flavor): string {
  return `inkstone-${flavor.meta.id}`;
}

/** OpenCode theme file name: `inkstone-xuanmo.json`. */
export function opencodeFileName(flavor: Flavor): string {
  return `${opencodeThemeName(flavor)}.json`;
}

/** Name shown in theme pickers: `墨观 · 玄墨 (Inkstone Xuanmo)`. */
export function themeDisplayName(flavor: Flavor): string {
  return `墨观 · ${flavorName(flavor, 'zh')} (Inkstone ${flavorName(flavor, 'en')})`;
}

/** Zed theme family name. */
export const ZED_FAMILY_NAME = 'Inkstone';

/** Zed theme family file name. */
export const ZED_FILE_NAME = 'inkstone.json';
