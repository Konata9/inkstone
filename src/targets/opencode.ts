/**
 * OpenCode themes (V2 theme documents).
 *
 * OpenCode discovers `.json` files in `~/.config/opencode/themes/` and in a
 * project's `.opencode/themes/`; the file name becomes the theme name. Each
 * document carries a complete shared `base` token tree plus one mode (`dark`
 * or `light`) with the nine-step hue scales that mode requires.
 *
 * Docs: https://opencode.ai/v2/docs/cli/theme
 */

import { contrast, darken, lighten, luminance, mix } from '../color.ts';
import { flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { opencodeFileName } from './naming.ts';
import type { GeneratedFile } from './vscode.ts';

type Mode = 'dark' | 'light';

/** A hex color, `transparent`, or a `$token` / `$hue.name.step` reference. */
type ColorValue = string;

/** Hue scales every OpenCode theme must provide. */
export const OPENCODE_HUES = ['gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'] as const;

/** Steps in a hue scale, light (100) to dark (900). */
export const OPENCODE_STEPS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

/** Syntax roles OpenCode renders. */
export const OPENCODE_SYNTAX_KEYS = [
  'comment',
  'keyword',
  'function',
  'variable',
  'string',
  'number',
  'type',
  'operator',
  'punctuation',
] as const;

/** Markdown roles OpenCode renders. */
export const OPENCODE_MARKDOWN_KEYS = [
  'text',
  'heading',
  'link',
  'linkText',
  'code',
  'blockQuote',
  'emphasis',
  'strong',
  'horizontalRule',
  'listItem',
  'listEnumeration',
  'image',
  'imageText',
  'codeBlock',
] as const;

type HueStep = (typeof OPENCODE_STEPS)[number];

interface StatefulColor {
  base: ColorValue;
  $hovered?: ColorValue;
  $focused?: ColorValue;
  $pressed?: ColorValue;
  $selected?: ColorValue;
  $disabled?: ColorValue;
}

type HueScale = Record<HueStep, string>;

interface OpencodeTheme {
  $schema: string;
  base: {
    categorical: string[];
    text: {
      base: ColorValue;
      muted: ColorValue;
      faint: ColorValue;
      action: Record<'primary' | 'secondary' | 'destructive', StatefulColor>;
      formfield: StatefulColor;
      feedback: Record<'error' | 'warning' | 'success' | 'info', { base: ColorValue; muted?: ColorValue }>;
    };
    background: {
      base: ColorValue;
      raised: { base: ColorValue; high: ColorValue; max: ColorValue };
      action: Record<'primary' | 'secondary' | 'destructive', StatefulColor>;
      formfield: StatefulColor;
      feedback: Record<'error' | 'warning' | 'success' | 'info', { base: ColorValue }>;
    };
    border: { base: ColorValue };
    scrollbar: { base: ColorValue };
    diff: {
      text: { added: ColorValue; removed: ColorValue; context: ColorValue; hunkHeader: ColorValue };
      background: { added: ColorValue; removed: ColorValue; context: ColorValue };
      highlight: { added: ColorValue; removed: ColorValue };
      lineNumber: { text: ColorValue; background: { added: ColorValue; removed: ColorValue } };
    };
    syntax: Record<(typeof OPENCODE_SYNTAX_KEYS)[number], ColorValue>;
    markdown: Record<(typeof OPENCODE_MARKDOWN_KEYS)[number], ColorValue>;
    '@dialog': {
      background: {
        base: ColorValue;
        action: { primary: { $hovered: ColorValue } };
      };
    };
  };
  dark?: { hue: Record<string, HueScale | string> };
  light?: { hue: Record<string, HueScale | string> };
}

/** Percentages used to build the nine steps of a hue scale. */
const RAMP = {
  dark: [0.55, 0.38, 0.2, 0.07, 0, 0.22, 0.42, 0.62, 0.8],
  light: [0.45, 0.3, 0.15, 0.05, 0, 0.22, 0.42, 0.62, 0.8],
} as const;

/**
 * Extend one traditional accent into the nine-step scale OpenCode expects.
 *
 * Dark scales run light (100) to dark (900); light scales run dark (100) to
 * light (900). The anchor color sits at 500, so `$hue.<name>.500` is exactly
 * the color used by the editor palette.
 */
function hueScale(flavor: Flavor, anchor: string): HueScale {
  const dark = flavor.meta.appearance === 'dark';
  const steps = dark ? RAMP.dark : RAMP.light;
  const far = dark ? '#ffffff' : '#000000';
  const scale = steps.map((amount, index) => {
    if (amount === 0) return anchor;
    // Steps 100–400 move toward the mode's light/dark end; 600–900 recede
    // into the canvas, so every scale stays usable on the theme's background.
    const toward = index < 4 ? far : flavor.surface.base;
    return mix(toward, anchor, amount);
  });
  const [s100, s200, s300, s400, s500, s600, s700, s800, s900] = scale as [
    string, string, string, string, string, string, string, string, string,
  ];
  return {
    100: s100,
    200: s200,
    300: s300,
    400: s400,
    500: s500,
    600: s600,
    700: s700,
    800: s800,
    900: s900,
  };
}

/**
 * Nudge an accent until it clears a contrast floor on a tinted surface.
 *
 * The palette floors cover editor text on plain canvases; tinted diff rows and
 * feedback panels need a per-pair check because the fill moves toward the
 * accent. Hues are preserved by mixing toward white or black in small steps.
 */
function readable(color: string, background: string, minimum: number): string {
  if (contrast(color, background) >= minimum) return color;
  const toward = luminance(background) > 0.5 ? '#000000' : '#ffffff';
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mix(toward, color, step * 0.03);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return toward;
}

function buildTheme(flavor: Flavor): OpencodeTheme {
  const f = flavor;
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  const y = f.syntax;
  const st = f.status;
  const dark = f.meta.appearance === 'dark';
  const mode: Mode = dark ? 'dark' : 'light';
  const highlight = (color: string) => (dark ? lighten(color, 0.18) : darken(color, 0.14));
  const feedbackFill = {
    error: mix(st.error, s.base, 0.1),
    warning: mix(st.warning, s.base, 0.1),
    success: mix(st.success, s.base, 0.1),
    info: mix(st.info, s.base, 0.1),
  };
  const diffFill = {
    added: mix(st.added, s.base, 0.1),
    removed: mix(st.deleted, s.base, 0.1),
  };

  const hue = {
    gray: hueScale(f, t.muted),
    red: hueScale(f, y.keyword),
    orange: hueScale(f, y.type),
    yellow: hueScale(f, y.number),
    green: hueScale(f, y.string),
    cyan: hueScale(f, y.regexp),
    blue: hueScale(f, y.function),
    purple: hueScale(f, y.decorator),
    accent: '$hue.blue',
    interactive: '$hue.blue',
    neutral: '$hue.gray',
  };

  const theme: OpencodeTheme = {
    $schema: 'https://opencode.ai/theme.json',
    base: {
      categorical: ['purple', 'green', 'blue', 'orange', 'red'],
      text: {
        base: t.primary,
        muted: t.secondary,
        faint: t.faint,
        action: {
          primary: {
            base: t.primary,
            $hovered: t.primary,
            $focused: t.inverse,
            $pressed: t.secondary,
            $selected: y.function,
            $disabled: t.faint,
          },
          secondary: {
            base: t.secondary,
            $hovered: t.primary,
            $focused: t.primary,
            $pressed: t.muted,
            $selected: t.primary,
            $disabled: t.faint,
          },
          destructive: {
            base: t.inverse,
            $hovered: t.inverse,
            $focused: t.inverse,
            $pressed: t.inverse,
            $selected: t.inverse,
            $disabled: t.faint,
          },
        },
        formfield: {
          base: t.primary,
          $hovered: y.function,
          $focused: y.function,
          $pressed: y.function,
          $selected: y.function,
          $disabled: t.faint,
        },
        feedback: {
          error: { base: readable(st.error, feedbackFill.error, 4.5) },
          warning: { base: readable(st.warning, feedbackFill.warning, 4.5) },
          success: { base: readable(st.success, feedbackFill.success, 4.5) },
          info: { base: readable(st.info, feedbackFill.info, 4.5) },
        },
      },
      background: {
        base: s.base,
        raised: { base: s.alt, high: s.raised, max: s.overlay },
        action: {
          primary: {
            base: 'transparent',
            $hovered: s.raised,
            $focused: y.function,
            $pressed: s.overlay,
            $selected: 'transparent',
            $disabled: s.input,
          },
          secondary: {
            base: 'transparent',
            $hovered: s.hover,
            $focused: s.hover,
            $pressed: s.active,
            $selected: s.active,
            $disabled: s.input,
          },
          destructive: {
            base: st.error,
            $hovered: highlight(st.error),
            $focused: highlight(st.error),
            $pressed: mix(st.error, s.base, 0.35),
            $selected: st.error,
            $disabled: mix(st.error, s.base, 0.2),
          },
        },
        formfield: {
          base: s.input,
          $hovered: s.hover,
          $focused: s.raised,
          $pressed: s.active,
          $selected: s.selection,
          $disabled: s.sunken,
        },
        feedback: {
          error: { base: feedbackFill.error },
          warning: { base: feedbackFill.warning },
          success: { base: feedbackFill.success },
          info: { base: feedbackFill.info },
        },
      },
      border: { base: b.normal },
      scrollbar: { base: b.strong },
      diff: {
        text: {
          added: readable(st.added, diffFill.added, 4.5),
          removed: readable(st.deleted, diffFill.removed, 4.5),
          context: t.secondary,
          hunkHeader: y.function,
        },
        background: {
          added: diffFill.added,
          removed: diffFill.removed,
          context: s.alt,
        },
        highlight: { added: highlight(st.added), removed: highlight(st.deleted) },
        lineNumber: {
          text: t.secondary,
          background: {
            added: diffFill.added,
            removed: diffFill.removed,
          },
        },
      },
      syntax: {
        comment: y.comment,
        keyword: y.keyword,
        function: y.function,
        variable: y.variable,
        string: y.string,
        number: y.number,
        type: y.type,
        operator: y.operator,
        punctuation: y.punctuation,
      },
      markdown: {
        text: t.primary,
        heading: y.keyword,
        link: y.function,
        linkText: y.function,
        code: y.string,
        blockQuote: y.type,
        emphasis: y.type,
        strong: y.number,
        horizontalRule: b.strong,
        listItem: y.function,
        listEnumeration: y.number,
        image: y.function,
        imageText: y.method,
        codeBlock: t.primary,
      },
      '@dialog': {
        background: {
          base: '$background.raised.base',
          action: {
            primary: { $hovered: '$background.raised.high' },
          },
        },
      },
    },
  };
  theme[mode] = { hue };
  return theme;
}

export function generateOpencode(): GeneratedFile[] {
  return flavors.map((flavor) => ({
    path: `dist/opencode/${opencodeFileName(flavor)}`,
    content: `${JSON.stringify(buildTheme(flavor), null, 2)}\n`,
  }));
}
