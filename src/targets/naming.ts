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

/** DSH plugin package name for a light/dark pair: `inkstone-dsh-ink`. */
export function dshPackageName(pairId: string): string {
  return `inkstone-dsh-${pairId}`;
}

/** DSH Loader row id: `inkstone-theme-ink`. */
export function dshRowId(pairId: string): string {
  return `inkstone-theme-${pairId}`;
}

/** DSH package display name: `墨观 · 宣纸 + 玄墨`. */
export function dshDisplayName(light: Flavor, dark: Flavor): string {
  return `墨观 · ${flavorName(light, 'zh')} + ${flavorName(dark, 'zh')}`;
}

/** DSH release tarball name: `inkstone-dsh-ink-0.3.5.tgz`. */
export function dshTarballFileName(packageName: string, version: string): string {
  return `${packageName}-${version}.tgz`;
}

/** DSH menu-edition package name: `inkstone-dsh`. */
export function dshMenuPackageName(): string {
  return 'inkstone-dsh';
}

/** DSH menu-edition Loader row id: `inkstone-theme`. */
export function dshMenuRowId(): string {
  return 'inkstone-theme';
}

/** DSH registered theme id for a flavour: `inkstone-xuanzhi`. */
export function dshThemeId(flavorId: string): string {
  return `inkstone-${flavorId}`;
}
