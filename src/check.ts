/**
 * Post-build checks for every generated target.
 *
 * Catches the failure modes that are easy to miss in a generator: malformed
 * color values, missing workbench keys (VS Code silently ignores those), broken
 * OpenCode token references, and Lua themes that do not parse.
 */

import { parse as parseLua } from 'luaparse';

import { contrast, isValidHex } from './color.ts';
import { flavors } from './palette/index.ts';
import { ANSI_NAMES } from './palette/types.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku } from './targets/kaku.ts';
import {
  generateOpencode,
  OPENCODE_HUES,
  OPENCODE_MARKDOWN_KEYS,
  OPENCODE_STEPS,
  OPENCODE_SYNTAX_KEYS,
} from './targets/opencode.ts';
import { buildTheme } from './targets/vscode.ts';

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

export function checkThemes(): string[] {
  const issues: string[] = [];

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

  return issues;
}
