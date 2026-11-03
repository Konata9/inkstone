/**
 * DeepSeek Harness (DSH) theme plugin generator.
 *
 * What it produces: three installable DSH plugin packages, one per Inkstone
 * light/dark pair. Each package carries a browser bundle whose plugin body
 * calls `ctx.theme.overrideTokens()` with the frozen DSH 0.2.1 token ladder, so
 * the DSH Web GUI — and Desktop, which renders through the same client tree —
 * paints Inkstone under DSH's own Appearance Light / Dark / System switch.
 *
 * Why a pair per package: DSH persists only the built-in `light | dark | system`
 * preference, so a third-party theme id is not selectable in the Appearance
 * row. Overriding the built-in palettes is the stable user path, and
 * `overrideTokens` requires a `{ light, dark }` value for every token — exactly
 * what a light/dark pair supplies.
 *
 * Maintenance: DSH is pre-stable. `src/targets/dsh-tokens.ts` freezes the
 * 0.2.1 ladder, `engines.dsh` caps the supported range, and the build fails
 * loudly when the mapping stops covering the frozen list. A DSH token change is
 * therefore one edit to that list plus this mapping, not a silent partial theme.
 */

import { alpha, contrast, darken, lighten, mix } from '../color.ts';
import { flavorName, flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { DSH_TOKENS } from './dsh-tokens.ts';
import type { DshToken } from './dsh-tokens.ts';
import { dshDisplayName, dshMenuPackageName, dshMenuRowId, dshPackageName, dshRowId, dshThemeId } from './naming.ts';
import type { GeneratedFile } from './vscode.ts';

/** One DSH package: a light flavour paired with a dark flavour. */
export interface DshPair {
  /** Package suffix: `ink` → `inkstone-dsh-ink`. */
  id: 'ink' | 'ink-dimmed' | 'sea';
  /** Flavour id for the light scheme. */
  light: string;
  /** Flavour id for the dark scheme. */
  dark: string;
}

/** The three shipped packages, in release order. */
export const DSH_PAIRS: readonly DshPair[] = [
  { id: 'ink', light: 'xuanzhi', dark: 'xuanmo' },
  { id: 'ink-dimmed', light: 'xuanzhi-dimmed', dark: 'xuanmo-dimmed' },
  { id: 'sea', light: 'qingci', dark: 'canghai' },
];

/** One token's value in each colour scheme. */
export type DshTokenModes = Record<DshToken, { light: string; dark: string }>;

/** Every non-static token; the static ladder is generated from ramps below. */
type StaticToken = Extract<DshToken, `--dsw-static-${string}`>;
type AliasToken = Exclude<DshToken, StaticToken>;

const STATIC_PREFIX = '--dsw-static-';

/** Official step names, in light-to-dark order, as a 0 (brightest) – 1 (darkest) position. */
const RAMP_POSITION: Record<string, number> = {
  '00': 0,
  '50': 0.02,
  '50p': 0.03,
  '60': 0.04,
  '75': 0.06,
  '100': 0.12,
  '150': 0.18,
  '200': 0.24,
  '250': 0.3,
  '300': 0.36,
  '400': 0.5,
  '450': 0.56,
  '500': 0.62,
  '550': 0.68,
  '600': 0.74,
  '700': 0.84,
  '750': 0.88,
  '800': 0.92,
  '850': 0.95,
  '875': 0.96,
  '900': 0.98,
  '950': 0.99,
  '1000': 1,
};

/** Longest prefix first: `neutral-bluish-*` must not match as `neutral`. */
const STATIC_FAMILIES = ['neutral-bluish', 'neutral', 'blue', 'deepseek', 'green', 'red', 'amber'] as const;
const HUE_FAMILIES = ['blue', 'deepseek', 'green', 'red', 'amber'] as const;

/**
 * Mix `color` into `base`; t=0 is all base, t=1 is all color. `mix` takes the
 * weight of its first argument, so the argument order is reversed here.
 */
function tint(base: string, color: string, t: number): string {
  return mix(color, base, t);
}

/** Pick the candidate with the highest contrast against `bg`. */
function pickOn(bg: string, candidates: string[]): string {
  return candidates.reduce((best, color) => (contrast(color, bg) > contrast(best, bg) ? color : best));
}

/** Position of a DSH step name; unknown names fail instead of guessing. */
function rampPosition(step: string): number {
  const position = RAMP_POSITION[step];
  if (position === undefined) throw new Error(`unknown DSH ramp step "${step}"`);
  return position;
}

/**
 * Shared neutral ramp of one flavour: position 0 is that flavour's brightest
 * surface, position 1 its darkest ink. Mixing the two ends (instead of always
 * going white → black) keeps the ramp tinted by the palette.
 *
 * Orientation is mode-independent on purpose: DSH's static ladder is one ramp
 * per scheme, and aliases in the dark scheme point at its bright half for text
 * and its dark half for surfaces (`--dsw-static-neutral-bluish-00` is the
 * tooltip label in both schemes). Inverting it for dark flavours would put dark
 * text on the dark tooltip.
 */
function neutralRamp(f: Flavor, position: number): string {
  return f.meta.appearance === 'dark'
    ? tint(f.text.primary, f.surface.sunken, position)
    : tint(f.surface.sunken, f.text.primary, position);
}

/** Cool variant of the neutral ramp: nudged toward the interaction blue. */
function bluishRamp(f: Flavor, position: number): string {
  return tint(neutralRamp(f, position), f.action, f.meta.appearance === 'dark' ? 0.03 : 0.04);
}

/**
 * Position on a saturated hue ramp. 500 (0.62) is the flavour's semantic
 * colour, brighter steps lift toward white, darker steps sink toward black.
 */
function hueRamp(color: string, position: number): string {
  return position <= 0.62
    ? lighten(color, ((0.62 - position) / 0.62) * 0.93)
    : darken(color, ((position - 0.62) / 0.38) * 0.8);
}

/** The 500 step of a semantic hue family. */
function hueBase(f: Flavor, family: string): string {
  switch (family) {
    case 'blue':
    case 'deepseek':
      return f.action;
    case 'green':
      return f.status.success;
    case 'red':
      return f.status.error;
    case 'amber':
      return f.status.warning;
    default:
      throw new Error(`unknown DSH static hue family "${family}"`);
  }
}

/** Generate the 77 `--dsw-static-*` values for one flavour. */
function staticTokens(f: Flavor): Record<StaticToken, string> {
  const values: Record<string, string> = {};
  const staticNames = DSH_TOKENS.filter((token): token is StaticToken => token.startsWith(STATIC_PREFIX));

  for (const token of staticNames) {
    const suffix = token.slice(STATIC_PREFIX.length);
    const family = STATIC_FAMILIES.find((candidate) => suffix.startsWith(`${candidate}-`));
    if (family === undefined) throw new Error(`unparsable DSH static token "${token}"`);
    const step = suffix.slice(family.length + 1);

    if (family === 'neutral' || family === 'neutral-bluish') {
      const ramp = family === 'neutral' ? neutralRamp : bluishRamp;
      values[token] = ramp(f, rampPosition(step));
      continue;
    }

    const base = hueBase(f, family);
    const transparent = /^(\d+[a-z]?)-a(\d+)$/.exec(step);
    if (transparent) {
      const [, baseStep, percent] = transparent;
      values[token] = alpha(hueRamp(base, rampPosition(baseStep!)), Number(percent) / 100);
      continue;
    }
    const deleteStep = /^(\d+)-delete$/.exec(step);
    if (deleteStep) {
      values[token] = darken(f.status.error, 0.3);
      continue;
    }
    values[token] = hueRamp(base, rampPosition(step));
  }

  return values as Record<StaticToken, string>;
}

/** All token values for one flavour. */
function tokenValues(f: Flavor): Record<DshToken, string> {
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  const y = f.syntax;
  const st = f.status;
  const a = f.action;
  const dark = f.meta.appearance === 'dark';

  /** Same rule as `actionHover` in the palette: dark lifts, light sinks. */
  const hover = dark ? lighten(a, 0.12) : darken(a, 0.12);
  /** Tooltips are dark in both schemes; their label is the static bright end. */
  const tooltipBg = dark ? s.overlay : tint(t.primary, '#000000', 0.35);
  const menuSurface = `color-mix(in srgb, ${s.overlay} ${dark ? 45 : 58}%, transparent)`;
  const deepDiving = tint(a, t.primary, 0.35);
  const violetStops = tint(a, y.type, 0.55);
  const cyanStops = tint(a, y.string, 0.5);

  const aliases: Record<AliasToken, string> = {
    // ---------------------------------------------------------------- surfaces
    '--dsw-alias-bg-base': s.base,
    '--dsw-alias-bg-document-preview': s.sunken,
    '--dsw-alias-bg-document-selection': alpha(a, 0.4),
    '--dsw-alias-bg-layer-1': s.alt,
    '--dsw-alias-bg-layer-2': s.raised,
    '--dsw-alias-bg-layer-3': s.overlay,
    '--dsw-alias-bg-mask-1': `rgba(0, 0, 0, ${dark ? 0.5 : 0.24})`,
    '--dsw-alias-bg-mask-2': `rgba(0, 0, 0, ${dark ? 0.2 : 0.12})`,
    '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.48)',
    '--dsw-alias-bg-mask-drop': alpha(s.base, 0.7),
    '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
    '--dsw-alias-bg-module-platform': s.alt,
    '--dsw-alias-bg-multi-select': s.alt,
    '--dsw-alias-bg-overlay': s.overlay,
    '--dsw-alias-bg-skeleton': alpha(t.primary, dark ? 0.09 : 0.05),
    '--dsw-alias-settings-card-fill': s.raised,
    '--dsw-alias-settings-card-stroke': b.strong,

    // ----------------------------------------------------------------- borders
    '--dsw-alias-border-inverted': dark ? alpha(t.primary, 0.06) : 'transparent',
    '--dsw-alias-border-inverted2': dark ? alpha(t.primary, 0.08) : 'transparent',
    '--dsw-alias-border-l1': b.subtle,
    '--dsw-alias-border-l2': b.normal,
    '--dsw-alias-border-l2-darkmode-thin': b.normal,
    '--dsw-alias-border-l3': tint(b.normal, b.strong, 0.5),
    '--dsw-alias-border-l4': b.strong,

    // ------------------------------------------------------------------ labels
    '--dsw-alias-label-caption': t.faint,
    '--dsw-alias-label-deep-diving': deepDiving,
    '--dsw-alias-label-deep-diving-shimmer': tint(a, t.primary, 0.7),
    '--dsw-alias-label-dimmed': t.faint,
    '--dsw-alias-label-document-preview': t.secondary,
    '--dsw-alias-label-primary': t.primary,
    '--dsw-alias-label-primary-bluish': t.primary,
    '--dsw-alias-label-primary-dimmed': tint(t.primary, s.base, 0.15),
    '--dsw-alias-label-primary-foreground': pickOn(a, [t.inverse, s.base]),
    '--dsw-alias-label-primary-inverted': t.inverse,
    '--dsw-alias-label-secondary': t.secondary,
    '--dsw-alias-label-shimmer': alpha(t.primary, dark ? 0.45 : 0.3),
    '--dsw-alias-label-tertiary': t.muted,
    '--dsw-alias-link': a,
    '--dsw-alias-menu-icon': t.secondary,

    // ------------------------------------------------------------ brand/buttons
    '--dsw-alias-brand-primary': a,
    '--dsw-alias-brand-primary-invert': t.inverse,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': a,
    '--dsw-alias-brand-text': t.primary,
    '--dsw-alias-button-contrast-fill': t.primary,
    '--dsw-alias-button-elevated-fill': s.raised,
    '--dsw-alias-button-floating-fill': s.overlay,
    '--dsw-alias-button-floating-hover': tint(s.overlay, t.primary, 0.06),
    '--dsw-alias-button-ghost-active-border': b.strong,
    '--dsw-alias-button-ghost-active-fill': s.active,
    '--dsw-alias-button-ghost-active-hover': s.hover,
    '--dsw-alias-button-info-fill': a,
    '--dsw-alias-button-info-hover': hover,
    '--dsw-alias-button-primary-dimmed': tint(s.raised, a, 0.5),
    '--dsw-alias-button-primary-fill': a,
    '--dsw-alias-button-primary-hover': hover,
    '--dsw-alias-button-tool-bar-fill': alpha(s.overlay, 0.5),
    '--dsw-alias-button-tool-bar-fill-invisible': alpha(s.overlay, 0.36),
    '--dsw-alias-button-tool-bar-hover': alpha(s.overlay, 0.6),

    // ------------------------------------------------------ interactive/states
    '--dsw-alias-interactive-bg-active': s.active,
    '--dsw-alias-interactive-bg-hover': s.hover,
    '--dsw-alias-interactive-bg-hover-accent': alpha(a, 0.14),
    '--dsw-alias-interactive-bg-hover-danger': alpha(st.error, dark ? 0.15 : 0.08),
    '--dsw-alias-interactive-bg-hover-solid': s.hover,
    '--dsw-alias-state-business-primary': a,
    '--dsw-alias-state-business-tertiary': tint(s.base, a, 0.15),
    '--dsw-alias-state-error-primary': st.error,
    '--dsw-alias-state-error-secondary': tint(s.base, st.error, 0.3),
    '--dsw-alias-state-idle-primary': b.strong,
    '--dsw-alias-state-success-primary': st.success,
    '--dsw-alias-state-success-secondary': tint(s.base, st.success, 0.3),
    '--dsw-alias-state-success-tertiary': tint(s.base, st.success, 0.15),
    '--dsw-alias-state-warn-label': tint(st.warning, t.primary, 0.35),
    '--dsw-alias-state-warn-primary': st.warning,
    '--dsw-alias-state-warn-secondary': tint(s.base, st.warning, 0.3),
    '--dsw-alias-state-warn-tertiary': tint(s.base, st.warning, 0.15),
    '--dsw-alias-switch-thumb': dark ? t.secondary : s.base,
    '--dsw-alias-turn-trigger-bg': s.sunken,
    '--dsw-alias-turn-trigger-bg-hover': s.hover,

    // -------------------------------------------------------------------- diff
    '--dsw-alias-code-diff-added': alpha(st.added, 0.12),
    '--dsw-alias-code-diff-deleted': alpha(st.deleted, 0.12),
    '--dsw-alias-file-diff-added-bg': tint(s.base, st.added, dark ? 0.18 : 0.1),
    '--dsw-alias-file-diff-added-gutter': tint(s.base, st.added, dark ? 0.12 : 0.06),
    '--dsw-alias-file-diff-added-marker': st.added,
    '--dsw-alias-file-diff-deleted-bg': tint(s.base, st.deleted, dark ? 0.18 : 0.1),
    '--dsw-alias-file-diff-deleted-gutter': tint(s.base, st.deleted, dark ? 0.12 : 0.06),
    '--dsw-alias-file-diff-deleted-marker': st.deleted,

    // -------------------------------------------------------- code and Markdown
    '--dsw-alias-markdown-citation': s.alt,
    '--dsw-alias-markdown-code-block': s.sunken,
    '--dsw-alias-markdown-code-block-banner': s.alt,
    '--dsw-alias-markdown-code-segment-selected': s.alt,
    '--dsw-alias-markdown-code-segment-unselected': tint(s.alt, s.base, 0.5),
    '--dsw-alias-markdown-inline-code': s.alt,
    '--dsw-alias-markdown-placeholder': s.alt,
    '--dsw-alias-markdown-tag': s.alt,

    // --------------------------------------------------------------- overlays
    '--dsw-alias-menu-group-header-fill': `color-mix(in srgb, ${s.overlay} 94%, transparent)`,
    '--dsw-alias-toast-bg': s.overlay,
    '--dsw-alias-toast-label': t.primary,
    '--dsw-alias-tooltip-bg': tooltipBg,
    '--dsw-alias-tooltip-key-bg': tint(tooltipBg, '#ffffff', 0.18),
    '--dsw-menu-surface-fill': menuSurface,

    // -------------------------------------------------------- sidebar/input/scroll
    '--dsw-alias-scrollbar-bg-l1': b.subtle,
    '--dsw-alias-scrollbar-bg-l2': b.normal,
    '--dsw-alias-scrollbar-hover-l1': b.normal,
    '--dsw-alias-scrollbar-hover-l2': b.strong,
    '--dsw-specific-bubble': s.raised,
    '--dsw-specific-bubble-highlight': tint(s.raised, a, 0.12),
    '--dsw-specific-input-major': s.input,
    '--dsw-specific-login-input': s.sunken,
    '--dsw-specific-menu': menuSurface,
    '--dsw-specific-selector': s.alt,
    '--dsw-specific-sidebar-fill': s.alt,
    '--dsw-specific-sidebar-nav-item-active': s.active,
    '--dsw-specific-sidebar-nav-item-active-accent': tint(s.alt, a, 0.18),
    '--dsw-specific-sidebar-nav-item-hover': s.hover,
    '--dsw-specific-tip': s.alt,

    // ------------------------------------------------- onboarding / gradients
    '--dsw-alias-onboarding-accent': a,
    '--dsw-alias-onboarding-card-fill': `color-mix(in srgb, ${s.overlay} 80%, transparent)`,
    '--dsw-alias-onboarding-checkbox-border': b.normal,
    '--dsw-alias-onboarding-secondary-fill': s.raised,
    '--dsw-elevation-stroke-color': b.strong,
    '--dsw-gradient-onboarding-blue-stops':
      `${darken(a, 0.35)} 18.75%, ${a} 51.78%, ${lighten(a, 0.35)} 86.252%, ${darken(a, 0.35)}`,
    '--dsw-gradient-onboarding-cyan-stops':
      `${darken(cyanStops, 0.35)} 21.154%, ${cyanStops} 50.954%, ` +
      `${lighten(cyanStops, 0.4)} 85.326%, ${darken(cyanStops, 0.35)}`,
    '--dsw-gradient-onboarding-violet-stops':
      `${darken(a, 0.45)} 33.102%, ${violetStops} 50.954%, ` +
      `${lighten(violetStops, 0.35)} 85.326%, ${darken(a, 0.45)}`,
    '--dsw-linear-gradient-think': `linear-gradient(180deg, ${s.base} 20.19%, transparent 100%)`,
    '--dsw-linear-think-select': `linear-gradient(180deg, ${s.alt} 20.19%, transparent 100%)`,

    // ----------------------------------------------------------- shiki syntax
    '--shiki-background': s.sunken,
    '--shiki-foreground': t.primary,
    '--shiki-token-comment': y.comment,
    '--shiki-token-constant': y.constant,
    '--shiki-token-function': y.function,
    '--shiki-token-keyword': y.keyword,
    '--shiki-token-link': a,
    '--shiki-token-parameter': y.parameter,
    '--shiki-token-punctuation': y.punctuation,
    '--shiki-token-string': y.string,
    '--shiki-token-string-expression': y.string,
  };

  const values: Record<string, string> = { ...staticTokens(f), ...aliases };
  return assertComplete(values, `DSH ${f.meta.id}`);
}

/** Fail loudly when a mapping edit drops or invents a token. */
function assertComplete(values: Record<string, string>, label: string): Record<DshToken, string> {
  const known = new Set<string>(DSH_TOKENS);
  const missing = DSH_TOKENS.filter((token) => typeof values[token] !== 'string');
  const extra = Object.keys(values).filter((token) => !known.has(token));
  if (missing.length > 0) throw new Error(`${label}: missing DSH tokens: ${missing.join(', ')}`);
  if (extra.length > 0) throw new Error(`${label}: unknown DSH tokens: ${extra.join(', ')}`);
  return values as Record<DshToken, string>;
}

/** Look up a flavour by id; a rename fails the build instead of skipping a package. */
function findFlavor(id: string): Flavor {
  const flavor = flavors.find((item) => item.meta.id === id);
  if (!flavor) throw new Error(`DSH pair references unknown flavour "${id}"`);
  return flavor;
}

/** One directly selectable theme in the menu edition. */
export interface DshMenuFlavor {
  /** Palette flavour id. */
  id: string;
  /** Registered DSH theme id. */
  themeId: string;
  /** Chinese flavour name. */
  zh: string;
  /** English flavour name. */
  en: string;
  /** Colour scheme the registered theme declares. */
  appearance: 'light' | 'dark';
  /** Canvas colour, drawn as the menu swatch. */
  swatch: string;
}

/**
 * The flavours the menu package registers and lets the user switch, each
 * Dimmed variant directly after the flavour it dims.
 *
 * The pair editions stay Appearance-driven (one light/dark pair per package);
 * this edition opts into named themes plus its own row, the way Catppuccin
 * does, because DSH persists only the built-in light/dark/system preference.
 */
export const DSH_MENU_FLAVORS: readonly DshMenuFlavor[] = [
  'xuanzhi',
  'xuanzhi-dimmed',
  'xuanmo',
  'xuanmo-dimmed',
  'canghai',
  'qingci',
].map((id) => {
  const flavor = findFlavor(id);
  return {
    id,
    themeId: dshThemeId(id),
    // `flavorName` appends " Dimmed"; `meta.zh` alone would make the two
    // 宣纸 buttons indistinguishable.
    zh: flavorName(flavor, 'zh'),
    en: flavorName(flavor, 'en'),
    appearance: flavor.meta.appearance,
    swatch: flavor.surface.base,
  };
});

/** Resolve the flavour pair; throws when the palette renames or reorders it. */
export function resolvePair(pair: DshPair): { light: Flavor; dark: Flavor } {
  const light = findFlavor(pair.light);
  const dark = findFlavor(pair.dark);
  if (light.meta.appearance !== 'light') {
    throw new Error(`DSH pair ${pair.id}: light flavour "${pair.light}" is not a light flavour`);
  }
  if (dark.meta.appearance !== 'dark') {
    throw new Error(`DSH pair ${pair.id}: dark flavour "${pair.dark}" is not a dark flavour`);
  }
  if (light.meta.family !== dark.meta.family) {
    throw new Error(`DSH pair ${pair.id}: light and dark flavours come from different families`);
  }
  return { light, dark };
}

/** Build the complete token map for one package. */
export function buildDshTokens(pair: DshPair): DshTokenModes {
  const { light, dark } = resolvePair(pair);
  const lightTokens = tokenValues(light);
  const darkTokens = tokenValues(dark);
  const tokens = {} as DshTokenModes;
  for (const token of DSH_TOKENS) {
    tokens[token] = { light: lightTokens[token], dark: darkTokens[token] };
  }
  return tokens;
}

/** Build the single-mode token map a registered menu theme carries. */
export function buildFlavorTokens(flavorId: string): Record<DshToken, string> {
  return tokenValues(findFlavor(flavorId));
}

/** Generated package.json for one pair. */
function packageManifest(pair: DshPair, version: string): string {
  const { light, dark } = resolvePair(pair);
  const name = dshPackageName(pair.id);
  const description =
    `墨观 Inkstone for DeepSeek Harness — ${light.meta.zh} (light) + ${dark.meta.zh} (dark). ` +
    'A traditional Chinese colour theme that overrides the built-in DSH palette.';
  return `${JSON.stringify(
    {
      name,
      version,
      description,
      license: 'MIT',
      type: 'module',
      main: 'lib/index.js',
      exports: {
        '.': './lib/index.js',
        './client': './lib/client.js',
        './package.json': './package.json',
      },
      files: ['lib', 'cordis.patch.yml', 'README.md', 'LICENSE'],
      engines: { dsh: '>=0.2.1-rc.3 <0.3.0' },
      dsh: {
        bundle: { patch: './cordis.patch.yml' },
        client: { platform: 'web', inject: ['@deepseek-ai/dsh-client-ui-theme'] },
      },
      repository: { type: 'git', url: 'git+https://github.com/Konata9/inkstone.git' },
      keywords: ['dsh', 'deepseek-harness', 'theme', 'inkstone'],
    },
    null,
    2,
  )}\n`;
}

/** Host face: the Loader imports a package's main module for every plugin row. */
function hostEntry(name: string): string {
  return `/**
 * Host face of ${name}.
 *
 * The browser bundle owns every visual decision; this entry exists because the
 * DSH Loader imports a package's main module for every plugin row.
 *
 * Generated by \`pnpm build\` — do not edit by hand.
 */
export function apply() {}
`;
}

/** Browser face: register the token override layer with the DSH client runtime. */
function clientBundle(pair: DshPair, tokens: DshTokenModes): string {
  const { light, dark } = resolvePair(pair);
  const name = dshPackageName(pair.id);
  const display = dshDisplayName(light, dark);
  const tokenJson = JSON.stringify(tokens, null, 2).replace(/\n/g, '\n    ');
  return `/**
 * ${display} for DeepSeek Harness.
 * Generated by \`pnpm build\` — do not edit by hand.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(name)},
  factory: () => {
    /** Every --dsw-* / --shiki-* colour token of DSH 0.2.1, per colour scheme. */
    const TOKENS = ${tokenJson}
    const inject = ['theme']
    const apply = (ctx) => {
      ctx.effect(
        () => ctx.theme.overrideTokens(${JSON.stringify(name)}, TOKENS),
        ${JSON.stringify(`${name}: token layer`)},
      )
    }
    return { apply, inject }
  },
})
`;
}

/** cordis.patch.yml: insert this package's plugin row into the profile. */
function bundlePatch(pair: DshPair): string {
  const suffix = pair.id;
  return `# Generated by \`pnpm build\` — do not edit by hand.
#
# DSH reads this patch as the profile's plugin layer: inserting the row is what
# activates the package after \`dsh plugin add\`.
- insert:
    - id: ${dshRowId(suffix)}
      name: ${dshPackageName(suffix)}
`;
}

/** Per-package README: pairing, install/remove, compatibility, exclusivity. */
function packageReadme(pair: DshPair, version: string): string {
  const { light, dark } = resolvePair(pair);
  const name = dshPackageName(pair.id);
  const display = dshDisplayName(light, dark);
  return `# ${display} for DeepSeek Harness

${light.meta.zh} (light) + ${dark.meta.zh} (dark) — an Inkstone theme plugin for
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) ${version}.

Generated by \`pnpm build\` — do not edit by hand.

## Install

\`\`\`bash
dsh plugin --profile web add ${name}
\`\`\`

or install the release tarball / a local directory:

\`\`\`bash
dsh plugin --profile web add file:/absolute/path/to/${name}-${version}.tgz
dsh plugin --profile web add /absolute/path/to/dist/dsh/${name}
\`\`\`

Restart \`dsh web\` afterwards. The plugin declares
\`engines.dsh: ">=0.2.1-rc.3 <0.3.0"\`; DSH refuses to install or activate it
outside that range.

## Use

Leave **Settings → General → Appearance** on Light / Dark / System: Light uses
${light.meta.zh}, Dark uses ${dark.meta.zh}, System follows the OS. The plugin
overrides the built-in palettes, so there is no extra theme picker.

**Install only one Inkstone DSH package.** The three variants each stack their
own token layer, and a second one replaces the first; it is also exclusivity
with any other DSH theme plugin (e.g. Catppuccin).

The sidebar terminal's 16 ANSI colours come from the terminal itself, not this
theme.

## Remove

\`\`\`bash
dsh plugin --profile web remove ${name}
\`\`\`
`;
}

/** Render every file of one installable package. */
export function renderDshPackage(pair: DshPair, version: string, license: string): GeneratedFile[] {
  const name = dshPackageName(pair.id);
  const dir = `dist/dsh/${name}`;
  const tokens = buildDshTokens(pair);
  return [
    { path: `${dir}/package.json`, content: packageManifest(pair, version) },
    { path: `${dir}/cordis.patch.yml`, content: bundlePatch(pair) },
    { path: `${dir}/lib/index.js`, content: hostEntry(name) },
    { path: `${dir}/lib/client.js`, content: clientBundle(pair, tokens) },
    { path: `${dir}/README.md`, content: packageReadme(pair, version) },
    { path: `${dir}/LICENSE`, content: license },
  ];
}

/** Build all three pair packages plus the menu edition under `dist/dsh/`. */
export function generateDsh(version: string, license: string): GeneratedFile[] {
  return [
    ...DSH_PAIRS.flatMap((pair) => renderDshPackage(pair, version, license)),
    ...renderDshMenuPackage(version, license),
  ];
}

/** Menu-edition package.json: one package that registers every menu flavour. */
function menuPackageManifest(version: string): string {
  const name = dshMenuPackageName();
  return `${JSON.stringify(
    {
      name,
      version,
      description:
        '墨观 Inkstone for DeepSeek Harness — 宣纸 / 宣纸 Dimmed / 玄墨 / 玄墨 Dimmed / 沧海 / 青瓷, ' +
        'switchable from Settings → General with four registered themes.',
      license: 'MIT',
      type: 'module',
      main: 'lib/index.js',
      exports: {
        '.': './lib/index.js',
        './client': './lib/client.js',
        './package.json': './package.json',
      },
      files: ['lib', 'cordis.patch.yml', 'README.md', 'LICENSE'],
      engines: { dsh: '>=0.2.1-rc.3 <0.3.0' },
      dsh: {
        bundle: { patch: './cordis.patch.yml' },
        client: {
          platform: 'web',
          inject: [
            '@deepseek-ai/dsh-client-ui-theme',
            '@deepseek-ai/dsh-client-ui-renderer',
            '@deepseek-ai/dsh-client-ui-settings',
          ],
        },
      },
      repository: { type: 'git', url: 'git+https://github.com/Konata9/inkstone.git' },
      keywords: ['dsh', 'deepseek-harness', 'theme', 'inkstone'],
    },
    null,
    2,
  )}\n`;
}

/** Menu-edition patch: the Loader row that activates the package. */
function menuBundlePatch(): string {
  return `# Generated by \`pnpm build\` — do not edit by hand.
#
# DSH reads this patch as the profile's plugin layer: inserting the row is what
# activates the package after \`dsh plugin add\`.
- insert:
    - id: ${dshMenuRowId()}
      name: ${dshMenuPackageName()}
`;
}

/**
 * Menu browser bundle.
 *
 * Four real DSH themes (one per flavour) plus a Settings → General row. The row
 * is the analogue of Catppuccin's flavour picker: the official Appearance row
 * persists only light/dark/system, so the plugin keeps its own choice in
 * localStorage and re-applies it on boot. "跟随 DSH" disposes the named theme
 * and restores the built-in preference with the pair override layer
 * (light → 宣纸, dark → 玄墨), so Appearance keeps working in that mode.
 */
function menuClientBundle(): string {
  const name = dshMenuPackageName();
  const themes = DSH_MENU_FLAVORS.map((flavor) => ({
    id: flavor.themeId,
    scheme: flavor.appearance,
    zh: flavor.zh,
    en: flavor.en,
    swatch: flavor.swatch,
    tokens: buildFlavorTokens(flavor.id),
  }));
  const auto = buildDshTokens(DSH_PAIRS[0]!);
  const themeJson = JSON.stringify(themes, null, 2).replace(/\n/g, '\n    ');
  const autoJson = JSON.stringify(auto, null, 2).replace(/\n/g, '\n    ');
  return `/**
 * 墨观 Inkstone for DeepSeek Harness — 宣纸 / 宣纸 Dimmed / 玄墨 / 玄墨 Dimmed / 沧海 / 青瓷.
 * Generated by \`pnpm build\` — do not edit by hand.
 *
 * Registers one DSH theme per flavour and contributes a Settings → General row
 * to switch them. The choice lives in localStorage; "跟随 DSH" restores the
 * built-in Appearance preference and applies the 宣纸/玄墨 pair layer.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(name)},
  factory: (require) => {
    const React = require('react')
    const AUTO = 'auto'
    const PACKAGE = ${JSON.stringify(name)}
    const STORAGE_KEY = 'dsh.inkstone.choice'

    /** One registered theme per flavour. */
    const THEMES = ${themeJson}

    /** Pair layer for "跟随 DSH": 宣纸 in light, 玄墨 in dark. */
    const AUTO_TOKENS = ${autoJson}

    const byId = new Map(THEMES.map((theme) => [theme.id, theme]))
    const isBuiltin = (id) => id === 'light' || id === 'dark' || id === 'system'

    function readChoice() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        return raw === AUTO || byId.has(raw) ? raw : AUTO
      } catch {
        return AUTO
      }
    }

    function writeChoice(choice) {
      try {
        window.localStorage.setItem(STORAGE_KEY, choice)
      } catch {
        /* the in-memory switch still applies for this tab */
      }
    }

    function InkstoneRow(props) {
      const [choice, setChoice] = React.useState(props.current())
      React.useEffect(() => props.subscribe(() => setChoice(props.current())), [])
      const options = [{ id: AUTO, label: '跟随 DSH', hint: 'Light 宣纸 · Dark 玄墨' }].concat(
        THEMES.map((theme) => ({ id: theme.id, label: theme.zh + ' ' + theme.en, swatch: theme.swatch })),
      )
      return React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 0', borderTop: '0.5px solid var(--dsw-alias-border-l2)' } },
        React.createElement(
          'div',
          { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: 500, lineHeight: '20px' } },
          '墨观 Inkstone',
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
          options.map((option) => {
            const selected = choice === option.id
            return React.createElement(
              'button',
              {
                key: option.id,
                type: 'button',
                'aria-pressed': selected,
                onClick: () => { props.select(option.id) },
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: selected ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
                  background: selected ? 'var(--dsw-alias-interactive-bg-hover-accent)' : 'var(--dsw-alias-button-elevated-fill)',
                  border: selected ? '0.5px solid var(--dsw-alias-brand-primary)' : '0.5px solid var(--dsw-alias-border-l2)',
                },
              },
              option.swatch
                ? React.createElement('span', {
                    key: 'swatch',
                    style: {
                      width: '12px',
                      height: '12px',
                      borderRadius: '999px',
                      background: option.swatch,
                      border: '0.5px solid var(--dsw-alias-border-l3)',
                      display: 'inline-block',
                    },
                  })
                : null,
              option.label,
            )
          }),
        ),
        React.createElement(
          'div',
          { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', lineHeight: '18px' } },
          '选择后立即生效并记住；「跟随 DSH」沿用 Appearance 的 Light / Dark / System（宣纸 / 玄墨）。',
        ),
      )
    }

    function apply(ctx) {
      const themeDisposers = THEMES.map((theme) => ctx.theme.register({
        id: theme.id,
        colorScheme: theme.scheme,
        tokens: theme.tokens,
      }))

      let layer
      let lastBuiltin = 'system'
      let switching = false
      const listeners = new Set()
      const notify = () => { for (const listener of listeners) listener() }
      const dropLayer = () => {
        if (layer !== undefined) {
          layer()
          layer = undefined
        }
      }
      const ensureLayer = () => {
        if (layer === undefined) layer = ctx.theme.overrideTokens(PACKAGE, AUTO_TOKENS)
      }
      const current = () => {
        const preference = ctx.theme.getTheme().preference
        return byId.has(preference) ? preference : AUTO
      }
      const subscribe = (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }
      const select = (choice) => {
        switching = true
        try {
          if (choice === AUTO) {
            writeChoice(AUTO)
            dropLayer()
            ensureLayer()
            ctx.theme.setTheme(lastBuiltin)
          } else if (byId.has(choice)) {
            writeChoice(choice)
            dropLayer()
            ctx.theme.setTheme(choice)
          }
        } catch {
          /* keep the current theme when the runtime rejects the switch */
        } finally {
          switching = false
        }
        notify()
      }
      const onThemeChange = () => {
        const preference = ctx.theme.getTheme().preference
        if (isBuiltin(preference)) {
          lastBuiltin = preference
          if (!switching && readChoice() !== AUTO) writeChoice(AUTO)
          ensureLayer()
        }
        notify()
      }

      const initialPreference = ctx.theme.getTheme().preference
      if (isBuiltin(initialPreference)) lastBuiltin = initialPreference
      const initial = readChoice()
      if (byId.has(initial)) {
        switching = true
        try {
          ctx.theme.setTheme(initial)
        } catch {
          /* fall back to the pair layer below */
        } finally {
          switching = false
        }
      }
      if (!byId.has(ctx.theme.getTheme().preference)) ensureLayer()

      const offThemeChange = ctx.on('theme/change', onThemeChange)
      const offRow = ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'inkstone',
        order: 12,
        inject: () => ({ current, subscribe, select }),
      }, InkstoneRow))

      ctx.effect(() => () => {
        offThemeChange()
        offRow()
        dropLayer()
        for (const dispose of themeDisposers) dispose()
      }, 'inkstone: themes and settings row')
    }

    const inject = ['theme', 'slots']
    return { apply, inject }
  },
})
`;
}

/** Menu-edition README: install, where the picker lives, exclusivity. */
function menuReadme(version: string): string {
  const name = dshMenuPackageName();
  const rows = DSH_MENU_FLAVORS.map((flavor) => `| \`${flavor.themeId}\` | ${flavor.zh} ${flavor.en} | ${flavor.appearance} |`).join('\n');
  return `# 墨观 Inkstone for DeepSeek Harness

宣纸 / 宣纸 Dimmed / 玄墨 / 玄墨 Dimmed / 沧海 / 青瓷, switchable from one menu — an Inkstone theme plugin
for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) ${version}.

Generated by \`pnpm build\` — do not edit by hand.

## Install

\`\`\`bash
dsh plugin --profile web add ${name}
\`\`\`

or install the release tarball / a local directory:

\`\`\`bash
dsh plugin --profile web add file:/absolute/path/to/${name}-${version}.tgz
dsh plugin --profile web add /absolute/path/to/dist/dsh/${name}
\`\`\`

Restart \`dsh web\` afterwards. The plugin declares
\`engines.dsh: ">=0.2.1-rc.3 <0.3.0"\`; DSH refuses to install or activate it
outside that range.

## Use

Open **Settings → General** and pick one of the Inkstone buttons:

| Theme id | Flavour | Scheme |
| --- | --- | --- |
${rows}
| — | 跟随 DSH（宣纸 / 玄墨） | follows Appearance |

The choice applies immediately and survives a reload. "跟随 DSH" hands control
back to the official **Appearance** Light / Dark / System switch: Light uses
宣纸, Dark uses 玄墨.

**Install only one Inkstone DSH package.** The menu edition registers named
themes; the pair editions stack token layers. Mixing them (or installing another
theme plugin such as Catppuccin) makes one override the other.

The sidebar terminal's 16 ANSI colours come from the terminal itself, not this
theme.

## Remove

\`\`\`bash
dsh plugin --profile web remove ${name}
\`\`\`
`;
}

/** Render the menu-edition package under `dist/dsh/inkstone-dsh/`. */
export function renderDshMenuPackage(version: string, license: string): GeneratedFile[] {
  const name = dshMenuPackageName();
  const dir = `dist/dsh/${name}`;
  return [
    { path: `${dir}/package.json`, content: menuPackageManifest(version) },
    { path: `${dir}/cordis.patch.yml`, content: menuBundlePatch() },
    { path: `${dir}/lib/index.js`, content: hostEntry(name) },
    { path: `${dir}/lib/client.js`, content: menuClientBundle() },
    { path: `${dir}/README.md`, content: menuReadme(version) },
    { path: `${dir}/LICENSE`, content: license },
  ];
}
