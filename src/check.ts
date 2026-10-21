/**
 * Post-build checks for the generated VS Code themes.
 *
 * Catches the two failure modes that are easy to miss in a generator:
 * malformed color values and missing workbench keys (VS Code silently
 * ignores those, leaving parts of the UI unthemed).
 */

import { parse as parseLua } from 'luaparse';

import { isValidHex } from './color.ts';
import { flavors } from './palette/index.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku } from './targets/kaku.ts';
import { buildTheme } from './targets/vscode.ts';

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
      const key = `terminal.${[
        'ansiBlack',
        'ansiRed',
        'ansiGreen',
        'ansiYellow',
        'ansiBlue',
        'ansiMagenta',
        'ansiCyan',
        'ansiWhite',
        'ansiBrightBlack',
        'ansiBrightRed',
        'ansiBrightGreen',
        'ansiBrightYellow',
        'ansiBrightBlue',
        'ansiBrightMagenta',
        'ansiBrightCyan',
        'ansiBrightWhite',
      ][slot]}`;
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

  return issues;
}
