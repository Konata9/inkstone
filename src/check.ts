/**
 * Post-build checks for every generated target.
 *
 * Catches the failure modes that are easy to miss in a generator: malformed
 * color values, missing workbench keys (VS Code silently ignores those), broken
 * OpenCode token references, and Lua themes that do not parse.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

import { parse as parseLua } from 'luaparse';
import { parse as parseToml } from 'smol-toml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { contrast, isValidHex } from './color.ts';
import { flavors } from './palette/index.ts';
import { ANSI_NAMES } from './palette/types.ts';
import { buildDshTokens, buildFlavorTokens, DSH_MENU_FLAVORS, DSH_PAIRS, renderDshMenuPackage, renderDshPackage } from './targets/dsh.ts';
import { DSH_TOKENS } from './targets/dsh-tokens.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku, generateKakuToml } from './targets/kaku.ts';
import { dshMenuPackageName, dshMenuRowId, dshPackageName, dshRowId, kakuTomlFileName } from './targets/naming.ts';
import {
  generateOpencode,
  OPENCODE_HUES,
  OPENCODE_MARKDOWN_KEYS,
  OPENCODE_STEPS,
  OPENCODE_SYNTAX_KEYS,
} from './targets/opencode.ts';
import { buildTheme, vscodeThemeContribution } from './targets/vscode.ts';
import { generateZed } from './targets/zed.ts';
import { ZED_FAMILY_NAME } from './targets/naming.ts';
import { readRootVersion } from './version.ts';

/** Workbench key for an ANSI slot, e.g. `terminal.ansiBrightBlack`. */
function terminalAnsiKey(slot: number): string {
  const name = ANSI_NAMES[slot];
  if (!name) throw new Error(`ANSI slot ${slot} is out of range`);
  return `terminal.ansi${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

const requiredColors = [
  'editor.background',
  'editor.foreground',
  'editor.lineHighlightBackground',
  'editor.selectionBackground',
  'editorCursor.foreground',
  'sideBar.background',
  'sideBar.foreground',
  'activityBar.background',
  'activityBar.foreground',
  'statusBar.background',
  'statusBar.foreground',
  'titleBar.activeBackground',
  'tab.activeBackground',
  'tab.inactiveBackground',
  'panel.background',
  'input.background',
  'input.foreground',
  'button.background',
  'button.foreground',
  'list.activeSelectionBackground',
  'list.hoverBackground',
  'menu.background',
  'menu.foreground',
  'dropdown.background',
  'terminal.background',
  'terminal.foreground',
  'terminal.ansiRed',
  'terminal.ansiBlue',
  'terminal.ansiBrightWhite',
  'gitDecoration.addedResourceForeground',
  'editorError.foreground',
  'editorWarning.foreground',
  'editorInfo.foreground',
  'diffEditor.insertedTextBackground',
  'diffEditor.removedTextBackground',
];

const requiredScopes = [
  'comment',
  'keyword',
  'string',
  'constant.numeric',
  'entity.name.function',
  'entity.name.type',
  'variable',
  'meta.decorator',
  'entity.name.tag',
  'entity.other.attribute-name',
  'invalid',
  'markup.heading',
];

interface VscodeManifest {
  contributes?: {
    themes?: Array<{
      label?: string;
      uiTheme?: string;
      path?: string;
    }>;
  };
}

/**
 * The extension manifest lists its themes by hand. Compare it with the
 * generator so a new flavor cannot ship with a missing picker entry.
 *
 * This checks the manifest only; theme-file existence is covered by the
 * release drift check, which runs after `pnpm build`.
 */
function checkVscodeManifest(issues: string[]): void {
  const manifestPath = fileURLToPath(new URL('../packages/vscode/package.json', import.meta.url));
  let manifest: VscodeManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as VscodeManifest;
  } catch (error) {
    issues.push(
      `packages/vscode/package.json: cannot read manifest — ${(error as Error).message}`,
    );
    return;
  }

  const contributed = manifest.contributes?.themes;
  if (!Array.isArray(contributed)) {
    issues.push('packages/vscode/package.json: contributes.themes is missing');
    return;
  }

  const expected = flavors.map(vscodeThemeContribution);
  if (contributed.length !== expected.length) {
    issues.push(
      `packages/vscode/package.json: contributes.themes has ${contributed.length} entries, ` +
        `expected ${expected.length}`,
    );
  }

  const total = Math.max(contributed.length, expected.length);
  for (let index = 0; index < total; index += 1) {
    const actual = contributed[index];
    const want = expected[index];
    if (!actual) {
      issues.push(
        `packages/vscode/package.json: missing theme entry "${want?.label}" -> ${want?.path}`,
      );
      continue;
    }
    if (!want) {
      issues.push(`packages/vscode/package.json: unexpected theme entry "${actual.label}"`);
      continue;
    }
    for (const field of ['label', 'uiTheme', 'path'] as const) {
      if (actual[field] !== want[field]) {
        issues.push(
          `packages/vscode/package.json: contributes.themes[${index}].${field} is ` +
            `${JSON.stringify(actual[field])}, expected ${JSON.stringify(want[field])} for ${want.label}`,
        );
      }
    }
  }
}

export function checkThemes(): string[] {
  const issues: string[] = [];

  checkVscodeManifest(issues);

  for (const flavor of flavors) {
    const theme = buildTheme(flavor);
    const label = flavor.meta.id;

    if (theme.type !== flavor.meta.appearance) issues.push(`${label}: wrong theme type`);
    if (!theme.name.includes(flavor.meta.zh)) issues.push(`${label}: name is missing the Chinese flavor name`);

    for (const [key, value] of Object.entries(theme.colors)) {
      if (!isValidHex(value)) issues.push(`${label}: ${key} has invalid color ${value}`);
      if (!/^[a-z][a-zA-Z0-9.]*$/i.test(key)) issues.push(`${label}: suspicious workbench key "${key}"`);
    }

    for (const key of requiredColors) {
      if (!(key in theme.colors)) issues.push(`${label}: missing required color ${key}`);
    }

    const scopeSet = new Set(theme.tokenColors.flatMap((rule) => rule.scope));
    for (const scope of requiredScopes) {
      if (!scopeSet.has(scope)) issues.push(`${label}: missing token scope ${scope}`);
    }

    for (const rule of theme.tokenColors) {
      if (rule.scope.length === 0) issues.push(`${label}: token rule "${rule.name}" has no scopes`);
      const foreground = rule.settings.foreground;
      if (foreground && !isValidHex(foreground)) {
        issues.push(`${label}: token rule "${rule.name}" has invalid color ${foreground}`);
      }
    }

    const semantic = Object.keys(theme.semanticTokenColors);
    if (semantic.length < 20) issues.push(`${label}: semanticTokenColors looks too small (${semantic.length})`);

    for (const [slot, hex] of flavor.ansi.entries()) {
      const key = terminalAnsiKey(slot);
      if (theme.colors[key] !== hex) issues.push(`${label}: ${key} drifted from the ANSI palette`);
    }
  }

  // --- Ghostty ---------------------------------------------------------
  for (const file of generateGhostty()) {
    const lines = file.content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
    const entries = new Map<string, string>();
    for (const line of lines) {
      const match = /^([a-z-]+)\s*=\s*(.+)$/.exec(line.trim());
      if (!match) {
        issues.push(`ghostty ${file.path}: unparseable line "${line}"`);
        continue;
      }
      entries.set(match[1]!, match[2]!);
    }
    for (const required of ['background', 'foreground', 'cursor-color', 'cursor-text', 'selection-background']) {
      if (!entries.has(required)) issues.push(`ghostty ${file.path}: missing ${required}`);
    }
    for (const [key, value] of entries) {
      if (key === 'palette') continue;
      if (!isValidHex(value)) issues.push(`ghostty ${file.path}: invalid color for ${key}: ${value}`);
    }
    const palette = file.content
      .split('\n')
      .map((line) => /^palette\s*=\s*(\d+)=(.+)$/.exec(line.trim()))
      .filter((match): match is RegExpExecArray => Boolean(match));
    if (palette.length !== 16) issues.push(`ghostty ${file.path}: expected 16 palette slots, found ${palette.length}`);
    const indices = new Set(palette.map((match) => match[1]));
    if (indices.size !== 16) issues.push(`ghostty ${file.path}: duplicate palette indices`);
  }

  // --- Kaku / WezTerm --------------------------------------------------
  for (const file of generateKaku()) {
    try {
      parseLua(file.content);
    } catch (error) {
      issues.push(`kaku ${file.path}: Lua syntax error — ${(error as Error).message}`);
    }
    for (const required of ['ansi = {', 'brights = {', 'tab_bar = {', 'selection_bg', 'cursor_bg']) {
      if (!file.content.includes(required)) issues.push(`kaku ${file.path}: missing ${required}`);
    }
    if (/#[0-9a-f]{8}\b/i.test(file.content)) {
      issues.push(`kaku ${file.path}: 8-digit hex colors are not supported by WezTerm/Kaku`);
    }
    const ansiCount = (file.content.match(/^    '#[0-9a-f]{6}',$/gm) ?? []).length;
    if (ansiCount !== 16) issues.push(`kaku ${file.path}: expected 16 ANSI colors, found ${ansiCount}`);
  }

  // --- Kaku / WezTerm TOML ---------------------------------------------
  const kakuTomlFiles = generateKakuToml();
  for (const file of kakuTomlFiles) {
    let document: Record<string, unknown>;
    try {
      document = parseToml(file.content) as unknown as Record<string, unknown>;
    } catch (error) {
      issues.push(`kaku toml ${file.path}: TOML syntax error — ${(error as Error).message}`);
      continue;
    }

    const colors = document.colors as Record<string, unknown> | undefined;
    if (!colors) {
      issues.push(`kaku toml ${file.path}: missing [colors]`);
      continue;
    }

    for (const required of [
      'foreground',
      'background',
      'cursor_bg',
      'cursor_fg',
      'selection_bg',
      'ansi',
      'brights',
      'tab_bar',
    ]) {
      if (colors[required] === undefined) {
        issues.push(`kaku toml ${file.path}: missing colors.${required}`);
      }
    }

    for (const key of ['background', 'foreground', 'cursor_bg', 'cursor_fg', 'selection_bg']) {
      const value = colors[key];
      if (typeof value !== 'string' || !isValidHex(value)) {
        issues.push(`kaku toml ${file.path}: invalid colors.${key}`);
      }
    }

    const metadata = document.metadata as Record<string, unknown> | undefined;
    if (typeof metadata?.name !== 'string' || metadata.name === '') {
      issues.push(`kaku toml ${file.path}: missing [metadata].name`);
    }

    const ansi = Array.isArray(colors.ansi) ? colors.ansi : [];
    const brights = Array.isArray(colors.brights) ? colors.brights : [];
    if (ansi.length !== 8 || brights.length !== 8) {
      issues.push(`kaku toml ${file.path}: expected 8 ansi and 8 bright colors`);
    } else {
      // Both formats come from one palette, so a drift here means one of the
      // two generators lost a slot.
      const flavor = flavors.find((candidate) => file.path.endsWith(kakuTomlFileName(candidate)));
      const slots = [...ansi, ...brights];
      if (flavor && slots.some((value, index) => value !== flavor.ansi[index])) {
        issues.push(`kaku toml ${file.path}: ANSI palette drifted from the flavor`);
      }
    }

    if (/#[0-9a-f]{8}\b/i.test(file.content)) {
      issues.push(`kaku toml ${file.path}: 8-digit hex colors are not supported by WezTerm/Kaku`);
    }
  }

  // --- OpenCode --------------------------------------------------------
  const opencodeAliases = ['accent', 'interactive', 'neutral'];

  function readReference(root: Record<string, unknown>, reference: string): unknown {
    return reference
      .slice(1)
      .split('.')
      .reduce<unknown>((value, key) => (value && typeof value === 'object'
        ? (value as Record<string, unknown>)[key]
        : undefined), root);
  }

  /** Resolve a `$token` / `$hue.name.step` chain to a concrete value, if it is valid. */
  function resolvedColor(root: Record<string, unknown>, value: unknown, depth = 0): string | undefined {
    if (typeof value !== 'string') return undefined;
    if (value === 'transparent' || isValidHex(value)) return value;
    if (depth > 20 || !value.startsWith('$')) return undefined;
    return resolvedColor(root, readReference(root, value), depth + 1);
  }

  for (const file of generateOpencode()) {
    let document: Record<string, unknown>;
    try {
      document = JSON.parse(file.content) as Record<string, unknown>;
    } catch (error) {
      issues.push(`opencode ${file.path}: invalid JSON — ${(error as Error).message}`);
      continue;
    }

    const flavor = flavors.find((entry) => file.path.endsWith(`${entry.meta.id}.json`));
    if (!flavor) {
      issues.push(`opencode ${file.path}: does not match a palette flavor`);
      continue;
    }

    if (document.$schema !== 'https://opencode.ai/theme.json') {
      issues.push(`opencode ${file.path}: wrong $schema`);
    }
    const base = document.base as Record<string, unknown> | undefined;
    if (!base) {
      issues.push(`opencode ${file.path}: missing base`);
      continue;
    }

    const mode = flavor.meta.appearance;
    const modeDefinition = document[mode] as Record<string, unknown> | undefined;
    const otherMode = document[mode === 'dark' ? 'light' : 'dark'];
    if (!modeDefinition) issues.push(`opencode ${file.path}: missing ${mode} mode`);
    if (otherMode) issues.push(`opencode ${file.path}: unexpected second mode`);

    const hue = modeDefinition?.hue as Record<string, unknown> | undefined;
    if (!hue) {
      issues.push(`opencode ${file.path}: missing hue scales`);
    } else {
      for (const name of OPENCODE_HUES) {
        const scale = hue[name] as Record<string, unknown> | undefined;
        if (!scale || typeof scale !== 'object') {
          issues.push(`opencode ${file.path}: missing hue ${name}`);
          continue;
        }
        for (const step of OPENCODE_STEPS) {
          if (!isValidHex(String(scale[step]))) {
            issues.push(`opencode ${file.path}: hue.${name}.${step} is not a hex color`);
          }
        }
      }
      for (const alias of opencodeAliases) {
        const value = hue[alias];
        if (typeof value !== 'string' || !value.startsWith('$hue.')) {
          issues.push(`opencode ${file.path}: hue.${alias} must alias a hue scale`);
        } else if (!hue[value.slice(5)]) {
          issues.push(`opencode ${file.path}: hue.${alias} points at a missing scale`);
        }
      }
    }

    // Hue aliases resolve to a whole scale; expand them so `$hue.accent.500`
    // passes the same reference check the OpenCode resolver performs.
    const expandedHue: Record<string, unknown> = {};
    const expandHue = (name: string, stack: string[] = []): unknown => {
      if (expandedHue[name]) return expandedHue[name];
      const value = hue?.[name];
      if (typeof value === 'string' && value.startsWith('$hue.')) {
        const target = value.slice(5);
        if (stack.includes(target)) return undefined;
        const resolved = expandHue(target, [...stack, name]);
        expandedHue[name] = resolved;
        return resolved;
      }
      expandedHue[name] = value;
      return value;
    };
    if (hue) for (const name of Object.keys(hue)) expandHue(name);

    const merged: Record<string, unknown> = { ...base, hue: expandedHue };
    let checkedColors = 0;
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (resolvedColor(merged, value) === undefined) {
          issues.push(`opencode ${file.path}: ${path} is not a valid color (${value})`);
        }
        checkedColors += 1;
        return;
      }
      if (!value || typeof value !== 'object' || Array.isArray(value)) return;
      for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    };
    for (const [key, value] of Object.entries(base)) {
      if (key === 'categorical') continue;
      walk(value, key);
    }

    const syntax = base.syntax as Record<string, unknown> | undefined;
    for (const token of OPENCODE_SYNTAX_KEYS) {
      if (!syntax || !(token in syntax)) issues.push(`opencode ${file.path}: missing syntax.${token}`);
    }
    const markdown = base.markdown as Record<string, unknown> | undefined;
    for (const token of OPENCODE_MARKDOWN_KEYS) {
      if (!markdown || !(token in markdown)) issues.push(`opencode ${file.path}: missing markdown.${token}`);
    }

    const checkContrast = (label: string, fg: unknown, bg: unknown, minimum: number) => {
      const foreground = resolvedColor(merged, fg);
      const background = resolvedColor(merged, bg);
      if (!foreground || !background || !isValidHex(foreground) || !isValidHex(background)) return;
      const ratio = contrast(foreground, background);
      if (ratio < minimum) {
        issues.push(`opencode ${file.path}: ${label} is ${ratio.toFixed(2)}:1 (min ${minimum}:1)`);
      }
    };

    const text = base.text as Record<string, unknown>;
    const background = base.background as Record<string, unknown>;
    const syntaxRecord = syntax ?? {};
    const diff = base.diff as Record<string, any>;
    checkContrast('text.base / background', text.base, background.base, 7);
    checkContrast('text.muted / background', text.muted, background.base, 4.5);
    checkContrast('text.faint / background', text.faint, background.base, 3);
    checkContrast('syntax.comment / background', syntaxRecord.comment, background.base, 4.5);
    checkContrast('syntax.keyword / background', syntaxRecord.keyword, background.base, 4.5);
    checkContrast('syntax.operator / background', syntaxRecord.operator, background.base, 3);
    for (const kind of ['error', 'warning', 'success', 'info'] as const) {
      checkContrast(
        `feedback.${kind}`,
        (text.feedback as Record<string, any>)[kind].base,
        (background.feedback as Record<string, any>)[kind].base,
        4.5,
      );
    }
    checkContrast('diff.text.added / diff fill', diff.text.added, diff.background.added, 4.5);
    checkContrast('diff.text.removed / diff fill', diff.text.removed, diff.background.removed, 4.5);
    checkContrast(
      'diff.lineNumber.text / added gutter',
      diff.lineNumber.text,
      diff.lineNumber.background.added,
      3,
    );
    checkContrast(
      'text.action.destructive / destructive fill',
      (text.action as Record<string, any>).destructive.base,
      (background.action as Record<string, any>).destructive.base,
      4.5,
    );
    checkContrast(
      'text.action.primary.$focused / focus fill',
      (text.action as Record<string, any>).primary.$focused,
      (background.action as Record<string, any>).primary.$focused,
      4.5,
    );

    if (checkedColors === 0) issues.push(`opencode ${file.path}: no color tokens were checked`);
  }

  const requiredZedStyles = [
    'background',
    'surface.background',
    'elevated_surface.background',
    'border',
    'border.focused',
    'text',
    'text.muted',
    'icon',
    'status_bar.background',
    'title_bar.background',
    'tab_bar.background',
    'tab.active_background',
    'editor.foreground',
    'editor.background',
    'editor.gutter.background',
    'editor.active_line.background',
    'editor.line_number',
    'terminal.background',
    'terminal.foreground',
  ];

  const requiredZedSyntax = [
    'comment',
    'keyword',
    'function',
    'string',
    'number',
    'type',
    'operator',
    'variable',
    'property',
    'punctuation',
  ];

  for (const file of generateZed(readRootVersion())) {
    if (file.path.endsWith('.toml')) {
      let doc: Record<string, unknown>;
      try {
        doc = parseToml(file.content) as Record<string, unknown>;
      } catch (error) {
        issues.push(`zed ${file.path}: invalid TOML — ${(error as Error).message}`);
        continue;
      }
      if (doc.id !== 'inkstone') issues.push(`zed ${file.path}: expected id = "inkstone"`);
      if (doc.name !== ZED_FAMILY_NAME) issues.push(`zed ${file.path}: expected name = "${ZED_FAMILY_NAME}"`);
      if (!doc.version) issues.push(`zed ${file.path}: missing version`);
      continue;
    }

    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(file.content) as Record<string, unknown>;
    } catch (error) {
      issues.push(`zed ${file.path}: invalid JSON — ${(error as Error).message}`);
      continue;
    }

    if (doc.$schema !== 'https://zed.dev/schema/themes/v0.2.0.json') {
      issues.push(`zed ${file.path}: wrong $schema`);
    }
    if (doc.name !== ZED_FAMILY_NAME) {
      issues.push(`zed ${file.path}: expected family name "${ZED_FAMILY_NAME}"`);
    }
    if (doc.author !== 'Konata9') {
      issues.push(`zed ${file.path}: expected author "Konata9"`);
    }

    const themes = doc.themes as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(themes)) {
      issues.push(`zed ${file.path}: themes must be an array`);
      continue;
    }
    if (themes.length !== flavors.length) {
      issues.push(`zed ${file.path}: expected ${flavors.length} themes, found ${themes.length}`);
    }

    for (const theme of themes) {
      const themeName = String(theme.name);
      const flavor = flavors.find((item) => themeName.includes(item.meta.en));
      if (!flavor) {
        issues.push(`zed ${file.path}: theme "${themeName}" does not match any flavor`);
        continue;
      }
      if (theme.appearance !== flavor.meta.appearance) {
        issues.push(`zed ${file.path}: theme "${themeName}" has appearance ${theme.appearance}, expected ${flavor.meta.appearance}`);
      }

      const style = theme.style as Record<string, unknown> | undefined;
      if (!style || typeof style !== 'object') {
        issues.push(`zed ${file.path}: theme "${themeName}" missing style`);
        continue;
      }

      for (const key of requiredZedStyles) {
        if (!(key in style)) issues.push(`zed ${file.path}: theme "${themeName}" missing style.${key}`);
      }

      const zedAnsiKeys = [
        'terminal.ansi.black',
        'terminal.ansi.red',
        'terminal.ansi.green',
        'terminal.ansi.yellow',
        'terminal.ansi.blue',
        'terminal.ansi.magenta',
        'terminal.ansi.cyan',
        'terminal.ansi.white',
        'terminal.ansi.bright_black',
        'terminal.ansi.bright_red',
        'terminal.ansi.bright_green',
        'terminal.ansi.bright_yellow',
        'terminal.ansi.bright_blue',
        'terminal.ansi.bright_magenta',
        'terminal.ansi.bright_cyan',
        'terminal.ansi.bright_white',
      ];
      for (const ansiKey of zedAnsiKeys) {
        if (!style[ansiKey] || !isValidHex(String(style[ansiKey]))) {
          issues.push(`zed ${file.path}: theme "${themeName}" invalid or missing ${ansiKey}`);
        }
      }

      const syntax = style.syntax as Record<string, Record<string, unknown>> | undefined;
      if (!syntax || typeof syntax !== 'object') {
        issues.push(`zed ${file.path}: theme "${themeName}" missing syntax`);
      } else {
        for (const token of requiredZedSyntax) {
          const rule = syntax[token];
          if (!rule || !rule.color || !isValidHex(String(rule.color))) {
            issues.push(`zed ${file.path}: theme "${themeName}" syntax.${token} is missing or has invalid color`);
          }
        }
      }

      const bg = String(style['editor.background']);
      const fg = String(style['editor.foreground']);
      if (isValidHex(bg) && isValidHex(fg)) {
        const ratio = contrast(fg, bg);
        if (ratio < 7) {
          issues.push(`zed ${file.path}: theme "${themeName}" editor text contrast is ${ratio.toFixed(2)}:1 (min 7:1)`);
        }
      }

      const commentColor = syntax?.comment?.color ? String(syntax.comment.color) : undefined;
      if (commentColor && isValidHex(bg) && isValidHex(commentColor)) {
        const ratio = contrast(commentColor, bg);
        if (ratio < 4.5) {
          issues.push(`zed ${file.path}: theme "${themeName}" comment contrast is ${ratio.toFixed(2)}:1 (min 4.5:1)`);
        }
      }
    }
  }

  checkDsh(issues);

  return issues;
}

/** One registration passed to the DSH module loader by a generated client bundle. */
interface DshRegistration {
  id?: unknown;
  factory?: unknown;
}

/** Generated values accepted by the DSH token legality check. */
function isDshColorValue(value: string): boolean {
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return true;
  if (/^rgba?\(/.test(value)) return true;
  if (/^color-mix\(in srgb,/.test(value)) return true;
  if (value === 'transparent') return true;
  if (/^linear-gradient\(/.test(value)) return true;
  // Onboarding gradient stops are a bare four-stop list: three positioned
  // stops plus the closing colour at the implicit 100%.
  return /^(#[0-9a-f]{6}(?:[0-9a-f]{2})? [0-9.]+%, ){3}#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value);
}

/** Assert one contrast pair from a token map, with optional ceiling. */
function checkDshContrast(
  values: Record<string, string>,
  issues: string[],
  label: string,
  foreground: string,
  background: string,
  min: number,
  max?: number,
): void {
  const fg = values[foreground];
  const bg = values[background];
  if (fg === undefined || bg === undefined) {
    issues.push(`${label}: missing ${foreground} or ${background} for the contrast check`);
    return;
  }
  if (!isValidHex(fg) || !isValidHex(bg)) {
    issues.push(`${label}: contrast pair ${foreground} / ${background} is not hex (${fg} / ${bg})`);
    return;
  }
  const ratio = contrast(fg, bg);
  if (ratio < min) {
    issues.push(`${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1 (min ${min}:1)`);
  } else if (max !== undefined && ratio > max) {
    issues.push(`${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1 (max ${max}:1)`);
  }
}

/** Exercise the generated browser bundle in a sandbox: registration, plugin shape, override call. */
function checkDshBundle(
  source: string,
  packageName: string,
  tokens: Record<string, { light: string; dark: string }>,
  label: string,
  issues: string[],
): void {
  const registrations: DshRegistration[] = [];
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(registration: DshRegistration): void {
          registrations.push(registration);
        },
      },
    },
  };
  try {
    runInNewContext(source, sandbox, { filename: `${label}/lib/client.js` });
  } catch (error) {
    issues.push(`${label}: client bundle throws — ${(error as Error).message}`);
    return;
  }
  if (registrations.length !== 1) {
    issues.push(`${label}: client bundle registered ${registrations.length} times (expected exactly 1)`);
    return;
  }
  const registration = registrations[0]!;
  if (registration.id !== packageName) {
    issues.push(`${label}: client bundle id is ${String(registration.id)}, expected ${packageName}`);
  }
  if (typeof registration.factory !== 'function') {
    issues.push(`${label}: client bundle factory is not a function`);
    return;
  }

  let exported: Record<string, unknown>;
  try {
    exported = (registration.factory as () => Record<string, unknown>)();
  } catch (error) {
    issues.push(`${label}: client bundle factory throws — ${(error as Error).message}`);
    return;
  }
  if (typeof exported.apply !== 'function') {
    issues.push(`${label}: client bundle does not export apply`);
    return;
  }
  const inject = exported.inject;
  if (!Array.isArray(inject) || !inject.includes('theme')) {
    issues.push(`${label}: client bundle does not inject the "theme" service`);
  }

  const calls: Array<{ source: unknown; tokens: Record<string, { light: string; dark: string }> }> = [];
  const fakeCtx = {
    effect: (effect: () => unknown) => effect(),
    theme: {
      overrideTokens(from: unknown, map: Record<string, { light: string; dark: string }>) {
        calls.push({ source: from, tokens: map });
        return () => {};
      },
    },
  };
  try {
    (exported.apply as (ctx: unknown) => void)(fakeCtx);
  } catch (error) {
    issues.push(`${label}: apply() throws in the sandbox — ${(error as Error).message}`);
    return;
  }
  if (calls.length !== 1) {
    issues.push(`${label}: apply() called theme.overrideTokens ${calls.length} times (expected exactly 1)`);
    return;
  }
  const call = calls[0]!;
  if (call.source !== packageName) {
    issues.push(`${label}: overrideTokens layer source is ${String(call.source)}, expected ${packageName}`);
  }

  const generated = Object.keys(call.tokens);
  if (generated.length !== DSH_TOKENS.length) {
    issues.push(`${label}: bundle carries ${generated.length} tokens, expected ${DSH_TOKENS.length}`);
  }
  for (const token of DSH_TOKENS) {
    const modes = call.tokens[token];
    if (!modes || typeof modes.light !== 'string' || typeof modes.dark !== 'string') {
      issues.push(`${label}: bundle token ${token} is not a { light, dark } pair`);
      continue;
    }
    if (modes.light !== tokens[token]!.light || modes.dark !== tokens[token]!.dark) {
      issues.push(`${label}: bundle token ${token} drifted from buildDshTokens()`);
    }
  }
}

/**
 * DSH package checks.
 *
 * Deliberately in-memory: `pnpm validate` runs before (and without) the build,
 * so reading `dist/dsh/` would either fail on a clean checkout or bless a stale
 * directory. Every check renders the same files the build will write.
 */
function checkDsh(issues: string[]): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const version = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    version: string;
  }).version;
  const license = readFileSync(join(root, 'LICENSE'), 'utf8');
  const requiredFiles = [
    'package.json',
    'cordis.patch.yml',
    'lib/index.js',
    'lib/client.js',
    'README.md',
    'LICENSE',
  ];

  for (const pair of DSH_PAIRS) {
    const packageName = dshPackageName(pair.id);
    const label = `dsh ${packageName}`;
    const dir = `dist/dsh/${packageName}`;
    const files = renderDshPackage(pair, version, license);
    const contents = new Map(files.map((file) => [file.path, file.content]));

    if (files.length !== requiredFiles.length) {
      issues.push(`${label}: generated ${files.length} files, expected ${requiredFiles.length}`);
    }
    for (const name of requiredFiles) {
      if (!contents.has(`${dir}/${name}`)) issues.push(`${label}: missing ${name}`);
    }

    const manifestText = contents.get(`${dir}/package.json`);
    if (manifestText === undefined) continue;
    let manifest: Record<string, any>;
    try {
      manifest = JSON.parse(manifestText) as Record<string, any>;
    } catch (error) {
      issues.push(`${label}: invalid package.json — ${(error as Error).message}`);
      continue;
    }

    const fields: Array<[string, boolean]> = [
      ['name', manifest.name === packageName],
      ['version', manifest.version === version],
      ['main', manifest.main === 'lib/index.js'],
      ['exports["."]', manifest.exports?.['.'] === './lib/index.js'],
      ['exports["./client"]', manifest.exports?.['./client'] === './lib/client.js'],
      ['dsh.bundle.patch', manifest.dsh?.bundle?.patch === './cordis.patch.yml'],
      ['dsh.client.platform', manifest.dsh?.client?.platform === 'web'],
      ['engines.dsh', manifest.engines?.dsh === '>=0.2.1-rc.3 <0.3.0'],
    ];
    for (const [field, ok] of fields) {
      if (!ok) issues.push(`${label}: package.json ${field} is missing or wrong`);
    }
    const filesField = manifest.files;
    if (
      !Array.isArray(filesField) ||
      !['lib', 'cordis.patch.yml', 'README.md', 'LICENSE'].every((entry) => filesField.includes(entry))
    ) {
      issues.push(`${label}: package.json "files" does not ship lib, patch, README and LICENSE`);
    }
    const inject = manifest.dsh?.client?.inject;
    if (!Array.isArray(inject) || !inject.includes('@deepseek-ai/dsh-client-ui-theme')) {
      issues.push(`${label}: package.json dsh.client.inject misses @deepseek-ai/dsh-client-ui-theme`);
    }

    const patch = contents.get(`${dir}/cordis.patch.yml`) ?? '';
    if (
      !patch.includes('- insert:') ||
      !patch.includes(`id: ${dshRowId(pair.id)}`) ||
      !patch.includes(`name: ${packageName}`)
    ) {
      issues.push(`${label}: cordis.patch.yml does not insert row ${dshRowId(pair.id)}`);
    }

    const host = contents.get(`${dir}/lib/index.js`) ?? '';
    if (!host.includes('export function apply')) {
      issues.push(`${label}: lib/index.js does not export apply`);
    }

    const readme = contents.get(`${dir}/README.md`) ?? '';
    if (!readme.includes(`dsh plugin --profile web remove ${packageName}`)) {
      issues.push(`${label}: README misses the remove command`);
    }

    const tokens = buildDshTokens(pair);
    const frozen = [...DSH_TOKENS].sort();
    const generated = Object.keys(tokens).sort();
    const missing = frozen.filter((token) => !generated.includes(token));
    const extra = generated.filter((token) => !frozen.includes(token as (typeof frozen)[number]));
    if (missing.length > 0 || extra.length > 0) {
      issues.push(
        `${label}: token coverage mismatch — ` +
          `${missing.length} missing${missing.length ? ` (${missing.slice(0, 10).join(', ')})` : ''}, ` +
          `${extra.length} extra${extra.length ? ` (${extra.slice(0, 10).join(', ')})` : ''}`,
      );
    }

    for (const token of DSH_TOKENS) {
      for (const mode of ['light', 'dark'] as const) {
        const value = tokens[token][mode];
        if (!isDshColorValue(value)) {
          issues.push(`${label}: ${token} (${mode}) has an unsupported value ${value}`);
        }
      }
    }

    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    for (const token of DSH_TOKENS) {
      light[token] = tokens[token].light;
      dark[token] = tokens[token].dark;
    }
    for (const [mode, values] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      checkDshModeContrast(values, issues, `${label} ${mode}`);
    }

    const client = contents.get(`${dir}/lib/client.js`);
    if (client !== undefined) checkDshBundle(client, packageName, tokens, label, issues);
  }

  checkDshMenu(issues, version, license);
}

/** Contrast bands every generated mode (pair half or registered flavour) must hold. */
function checkDshModeContrast(values: Record<string, string>, issues: string[], scope: string): void {
  checkDshContrast(values, issues, scope, '--dsw-alias-label-primary', '--dsw-alias-bg-base', 7, 12.5);
  checkDshContrast(values, issues, scope, '--dsw-alias-label-secondary', '--dsw-alias-bg-base', 4.5, 8);
  checkDshContrast(values, issues, scope, '--dsw-alias-label-tertiary', '--dsw-alias-bg-base', 4.5);
  checkDshContrast(values, issues, scope, '--dsw-alias-toast-label', '--dsw-alias-toast-bg', 4.5);
  checkDshContrast(
    values,
    issues,
    scope,
    '--dsw-alias-label-primary-foreground',
    '--dsw-alias-brand-primary',
    4.5,
  );
  checkDshContrast(values, issues, scope, '--dsw-static-neutral-bluish-00', '--dsw-alias-tooltip-bg', 4.5);
  for (const token of [
    '--shiki-token-keyword',
    '--shiki-token-string',
    '--shiki-token-string-expression',
    '--shiki-token-comment',
    '--shiki-token-function',
    '--shiki-token-constant',
    '--shiki-token-parameter',
  ]) {
    checkDshContrast(values, issues, `${scope} syntax`, token, '--dsw-alias-markdown-code-block', 4.5, 9);
  }
  checkDshContrast(values, issues, `${scope} syntax`, '--shiki-token-punctuation', '--dsw-alias-markdown-code-block', 4, 9);
}

/** One registered theme as the menu bundle declares it. */
interface DshMenuThemeDefinition {
  id: string;
  colorScheme: string;
  tokens: Record<string, string>;
}

/** The menu bundle's Settings row registration. */
interface DshMenuRowRegistration {
  options: {
    name: string;
    id?: string;
    inject: () => Record<string, unknown>;
  };
  component: unknown;
}

/** Exercise the menu bundle: every registered theme, the Settings row, and both switch paths. */
function checkDshMenuBundle(source: string, packageName: string, issues: string[]): void {
  const label = `dsh ${packageName}`;
  const registrations: DshRegistration[] = [];
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(registration: DshRegistration): void {
          registrations.push(registration);
        },
      },
      localStorage: {
        store: new Map<string, string>(),
        getItem(key: string): string | null {
          return this.store.get(key) ?? null;
        },
        setItem(key: string, value: string): void {
          this.store.set(key, value);
        },
      },
    },
  };
  try {
    runInNewContext(source, sandbox, { filename: `${label}/lib/client.js` });
  } catch (error) {
    issues.push(`${label}: menu client bundle throws — ${(error as Error).message}`);
    return;
  }
  if (registrations.length !== 1) {
    issues.push(`${label}: menu client bundle registered ${registrations.length} times (expected exactly 1)`);
    return;
  }
  const registration = registrations[0]!;
  if (registration.id !== packageName) {
    issues.push(`${label}: menu client bundle id is ${String(registration.id)}, expected ${packageName}`);
  }
  if (typeof registration.factory !== 'function') {
    issues.push(`${label}: menu client bundle factory is not a function`);
    return;
  }

  const fakeReact = {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({ type, props, children }),
    useState<T>(value: T): [T, () => void] {
      return [value, () => {}];
    },
    useEffect: () => {},
  };
  let exported: Record<string, unknown>;
  try {
    exported = (registration.factory as (require: (specifier: string) => unknown) => Record<string, unknown>)(
      (specifier) => {
        if (specifier === 'react') return fakeReact;
        throw new Error(`unexpected module request ${specifier}`);
      },
    );
  } catch (error) {
    issues.push(`${label}: menu client bundle factory throws — ${(error as Error).message}`);
    return;
  }
  if (typeof exported.apply !== 'function') {
    issues.push(`${label}: menu client bundle does not export apply`);
    return;
  }
  const inject = exported.inject;
  if (!Array.isArray(inject) || !inject.includes('theme') || !inject.includes('slots')) {
    issues.push(`${label}: menu client bundle does not inject theme and slots`);
  }

  const themes: DshMenuThemeDefinition[] = [];
  const rows: DshMenuRowRegistration[] = [];
  const layers = new Map<string, Record<string, { light: string; dark: string }>>();
  const listeners = new Set<() => void>();
  let preference = 'system';
  const runtime = {
    register(definition: DshMenuThemeDefinition): () => void {
      themes.push(definition);
      return () => {};
    },
    getTheme(): { preference: string } {
      return { preference };
    },
    setTheme(id: string): void {
      preference = id;
      for (const listener of listeners) listener();
    },
    overrideTokens(
      from: string,
      tokens: Record<string, { light: string; dark: string }>,
    ): () => void {
      layers.set(from, tokens);
      return () => {
        layers.delete(from);
      };
    },
  };
  const fakeCtx = {
    effect(effect: () => unknown): () => void {
      const dispose = effect();
      return typeof dispose === 'function' ? (dispose as () => void) : () => {};
    },
    on(_event: string, listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    theme: runtime,
    slots: {
      inject(_name: string, callback: () => unknown): () => void {
        callback();
        return () => {};
      },
      register(options: DshMenuRowRegistration['options'], component: unknown): () => void {
        rows.push({ options, component });
        return () => {};
      },
    },
  };
  try {
    (exported.apply as (ctx: unknown) => void)(fakeCtx);
  } catch (error) {
    issues.push(`${label}: menu apply() throws in the sandbox — ${(error as Error).message}`);
    return;
  }

  if (themes.length !== DSH_MENU_FLAVORS.length) {
    issues.push(`${label}: menu registers ${themes.length} themes, expected ${DSH_MENU_FLAVORS.length}`);
  }
  for (const flavor of DSH_MENU_FLAVORS) {
    const theme = themes.find((candidate) => candidate.id === flavor.themeId);
    if (!theme) {
      issues.push(`${label}: menu does not register ${flavor.themeId}`);
      continue;
    }
    if (theme.colorScheme !== flavor.appearance) {
      issues.push(`${label}: ${flavor.themeId} declares ${theme.colorScheme}, expected ${flavor.appearance}`);
    }
    const expected = buildFlavorTokens(flavor.id);
    const keys = Object.keys(theme.tokens);
    if (keys.length !== DSH_TOKENS.length) {
      issues.push(`${label}: ${flavor.themeId} carries ${keys.length} tokens, expected ${DSH_TOKENS.length}`);
    }
    for (const token of DSH_TOKENS) {
      if (theme.tokens[token] !== expected[token]) {
        issues.push(`${label}: ${flavor.themeId} token ${token} drifted from buildFlavorTokens()`);
        break;
      }
    }
  }

  if (rows.length !== 1) {
    issues.push(`${label}: menu registered ${rows.length} settings rows, expected exactly 1`);
    return;
  }
  const row = rows[0]!;
  if (row.options.name !== 'settings.general.item') {
    issues.push(`${label}: menu row targets ${row.options.name}, expected settings.general.item`);
  }
  if (row.options.id !== 'inkstone') {
    issues.push(`${label}: menu row id is ${String(row.options.id)}, expected "inkstone"`);
  }
  const face = row.options.inject();
  if (typeof face.select !== 'function' || typeof face.current !== 'function' || typeof face.subscribe !== 'function') {
    issues.push(`${label}: menu row face is missing select/current/subscribe`);
    return;
  }
  if (typeof row.component !== 'function') {
    issues.push(`${label}: menu row component is not a function`);
  } else {
    // Render once with the framework-free props so a broken row fails here
    // instead of blanking the user's Settings page.
    let tree: unknown;
    try {
      tree = (row.component as (props: Record<string, unknown>) => unknown)({ ...face });
    } catch (error) {
      issues.push(`${label}: menu row throws while rendering — ${(error as Error).message}`);
    }
    const texts: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {
        texts.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node !== null && typeof node === 'object') {
        const children = (node as { children?: unknown[] }).children;
        if (Array.isArray(children)) children.forEach(walk);
      }
    };
    walk(tree);
    if (!texts.some((text) => text.includes('墨观 Inkstone'))) {
      issues.push(`${label}: menu row does not render its title`);
    }
    for (const flavor of DSH_MENU_FLAVORS) {
      if (!texts.some((text) => text.includes(flavor.zh))) {
        issues.push(`${label}: menu row does not render the ${flavor.zh} option`);
      }
    }
  }
  if (!layers.has(packageName)) {
    issues.push(`${label}: menu did not apply the 跟随 DSH pair layer on boot`);
  }

  const select = face.select as (choice: string) => void;
  const current = face.current as () => string;
  const first = DSH_MENU_FLAVORS[0]!;
  select(first.themeId);
  if (preference !== first.themeId) {
    issues.push(`${label}: selecting ${first.themeId} left the preference at ${preference}`);
  }
  if (layers.has(packageName)) {
    issues.push(`${label}: selecting a named theme kept the pair layer stacked on top`);
  }
  if (current() !== first.themeId) {
    issues.push(`${label}: current() reports ${current()} after selecting ${first.themeId}`);
  }
  select('auto');
  if (preference !== 'system') {
    issues.push(`${label}: selecting auto did not restore the built-in preference (got ${preference})`);
  }
  if (!layers.has(packageName)) {
    issues.push(`${label}: selecting auto did not re-apply the pair layer`);
  }
  runtime.setTheme('dark');
  if (layers.size === 0) {
    issues.push(`${label}: an external Appearance change dropped the pair layer`);
  }
  if (current() !== 'auto') {
    issues.push(`${label}: current() reports ${current()} after an external Appearance change`);
  }
}

/** Menu-edition package checks: structure, per-flavour tokens, and the live switch behaviour. */
function checkDshMenu(issues: string[], version: string, license: string): void {
  const packageName = dshMenuPackageName();
  const label = `dsh ${packageName}`;
  const dir = `dist/dsh/${packageName}`;
  const files = renderDshMenuPackage(version, license);
  const contents = new Map(files.map((file) => [file.path, file.content]));
  const requiredFiles = ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'README.md', 'LICENSE'];

  if (files.length !== requiredFiles.length) {
    issues.push(`${label}: generated ${files.length} files, expected ${requiredFiles.length}`);
  }
  for (const name of requiredFiles) {
    if (!contents.has(`${dir}/${name}`)) issues.push(`${label}: missing ${name}`);
  }

  const manifestText = contents.get(`${dir}/package.json`);
  if (manifestText === undefined) return;
  let manifest: Record<string, any>;
  try {
    manifest = JSON.parse(manifestText) as Record<string, any>;
  } catch (error) {
    issues.push(`${label}: invalid package.json — ${(error as Error).message}`);
    return;
  }
  const fields: Array<[string, boolean]> = [
    ['name', manifest.name === packageName],
    ['version', manifest.version === version],
    ['main', manifest.main === 'lib/index.js'],
    ['exports["."]', manifest.exports?.['.'] === './lib/index.js'],
    ['exports["./client"]', manifest.exports?.['./client'] === './lib/client.js'],
    ['dsh.bundle.patch', manifest.dsh?.bundle?.patch === './cordis.patch.yml'],
    ['dsh.client.platform', manifest.dsh?.client?.platform === 'web'],
    ['engines.dsh', manifest.engines?.dsh === '>=0.2.1-rc.3 <0.3.0'],
  ];
  for (const [field, ok] of fields) {
    if (!ok) issues.push(`${label}: package.json ${field} is missing or wrong`);
  }
  const injection: unknown[] = Array.isArray(manifest.dsh?.client?.inject) ? manifest.dsh.client.inject : [];
  for (const dependency of [
    '@deepseek-ai/dsh-client-ui-theme',
    '@deepseek-ai/dsh-client-ui-renderer',
    '@deepseek-ai/dsh-client-ui-settings',
  ]) {
    if (!injection.includes(dependency)) issues.push(`${label}: package.json dsh.client.inject misses ${dependency}`);
  }
  const filesField = manifest.files;
  if (
    !Array.isArray(filesField) ||
    !['lib', 'cordis.patch.yml', 'README.md', 'LICENSE'].every((entry) => filesField.includes(entry))
  ) {
    issues.push(`${label}: package.json "files" does not ship lib, patch, README and LICENSE`);
  }

  const patch = contents.get(`${dir}/cordis.patch.yml`) ?? '';
  if (
    !patch.includes('- insert:') ||
    !patch.includes(`id: ${dshMenuRowId()}`) ||
    !patch.includes(`name: ${packageName}`)
  ) {
    issues.push(`${label}: cordis.patch.yml does not insert row ${dshMenuRowId()}`);
  }

  const host = contents.get(`${dir}/lib/index.js`) ?? '';
  if (!host.includes('export function apply')) issues.push(`${label}: lib/index.js does not export apply`);

  const readme = contents.get(`${dir}/README.md`) ?? '';
  if (!readme.includes(`dsh plugin --profile web remove ${packageName}`)) {
    issues.push(`${label}: README misses the remove command`);
  }

  for (const flavor of DSH_MENU_FLAVORS) {
    const tokens = buildFlavorTokens(flavor.id);
    const keys = Object.keys(tokens).sort();
    const frozen = [...DSH_TOKENS].sort();
    const missing = frozen.filter((token) => !keys.includes(token));
    const extra = keys.filter((token) => !frozen.includes(token as (typeof frozen)[number]));
    if (missing.length > 0 || extra.length > 0) {
      issues.push(
        `${label} ${flavor.id}: token coverage mismatch — ` +
          `${missing.length} missing${missing.length ? ` (${missing.slice(0, 10).join(', ')})` : ''}, ` +
          `${extra.length} extra${extra.length ? ` (${extra.slice(0, 10).join(', ')})` : ''}`,
      );
    }
    for (const token of DSH_TOKENS) {
      if (!isDshColorValue(tokens[token])) {
        issues.push(`${label} ${flavor.id}: ${token} has an unsupported value ${tokens[token]}`);
      }
    }
    checkDshModeContrast(tokens, issues, `${label} ${flavor.id}`);
  }

  const client = contents.get(`${dir}/lib/client.js`);
  if (client !== undefined) checkDshMenuBundle(client, packageName, issues);
}
