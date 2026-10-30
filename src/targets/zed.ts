/**
 * Zed theme generator.
 *
 * Generates theme families adhering to https://zed.dev/schema/themes/v0.2.0.json,
 * mapping Inkstone's traditional Chinese semantic palettes to Zed's UI surfaces,
 * editor elements, tree-sitter syntax nodes and integrated terminal.
 */

import { alpha, darken, lighten, mix } from '../color.ts';
import { flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { themeDisplayName, ZED_FAMILY_NAME, ZED_FILE_NAME } from './naming.ts';
import type { GeneratedFile } from './vscode.ts';

export interface ZedHighlightStyle {
  color?: string | null;
  font_style?: 'normal' | 'italic' | 'oblique' | null;
  font_weight?: number | null;
  background_color?: string | null;
}

export interface ZedPlayerColor {
  cursor: string;
  background: string;
  selection: string;
}

export interface ZedTheme {
  name: string;
  appearance: 'dark' | 'light';
  style: Record<string, unknown>;
}

export interface ZedThemeFamily {
  $schema: string;
  name: string;
  author: string;
  themes: ZedTheme[];
}

const transparent = '#00000000';

function buildSyntax(f: Flavor): Record<string, ZedHighlightStyle> {
  const y = f.syntax;
  const t = f.text;
  const st = f.status;

  return {
    attribute: { color: y.attribute },
    boolean: { color: y.boolean },
    comment: { color: y.comment },
    'comment.doc': { color: y.comment },
    constant: { color: y.constant },
    constructor: { color: y.function },
    embedded: { color: t.primary },
    emphasis: { color: y.string, font_style: 'italic' },
    'emphasis.strong': { color: y.type, font_weight: 700 },
    enum: { color: y.type },
    function: { color: y.function },
    'function.method': { color: y.method },
    hint: { color: t.muted },
    keyword: { color: y.keyword, font_weight: 700 },
    label: { color: y.property },
    link_text: { color: y.function, font_style: 'italic' },
    link_uri: { color: y.method },
    namespace: { color: y.type },
    number: { color: y.number },
    operator: { color: y.operator },
    predictive: { color: t.muted, font_style: 'italic' },
    preproc: { color: y.decorator },
    primary: { color: t.primary },
    property: { color: y.property },
    punctuation: { color: y.punctuation },
    'punctuation.bracket': { color: y.punctuation },
    'punctuation.delimiter': { color: y.punctuation },
    'punctuation.list_marker': { color: y.keyword },
    'punctuation.markup': { color: y.punctuation },
    'punctuation.special': { color: y.decorator },
    selector: { color: y.keyword },
    'selector.pseudo': { color: y.attribute },
    string: { color: y.string },
    'string.escape': { color: y.escape },
    'string.regex': { color: y.regexp },
    'string.special': { color: y.escape },
    'string.special.symbol': { color: y.constant },
    tag: { color: y.tag },
    'text.literal': { color: y.string },
    title: { color: y.type, font_weight: 700 },
    type: { color: y.type },
    variable: { color: y.variable },
    'variable.parameter': { color: y.parameter },
    'variable.special': { color: y.constant },
    variant: { color: y.function },
    'diff.plus': { color: st.added },
    'diff.minus': { color: st.deleted },
  };
}

function buildPlayers(f: Flavor): ZedPlayerColor[] {
  const s = f.surface;
  const t = f.text;
  const palette = [
    f.ansi[4], // blue
    f.ansi[1], // red
    f.ansi[3], // yellow
    f.ansi[5], // magenta
    f.ansi[6], // cyan
    f.ansi[2], // green
    f.action,
  ];

  return [
    { cursor: t.cursor, background: t.cursor, selection: s.selection },
    ...palette.map((color) => ({
      cursor: color,
      background: color,
      selection: alpha(color, 0.24),
    })),
  ];
}

function buildStyle(f: Flavor): Record<string, unknown> {
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  const y = f.syntax;
  const st = f.status;
  const dark = f.meta.appearance === 'dark';

  return {
    accents: [f.action],
    // ----------------------------------------------------------- window & base
    background: s.base,
    'background.appearance': 'opaque',
    'surface.background': s.alt,
    'elevated_surface.background': s.overlay,
    'panel.background': s.alt,
    'panel.indent_guide': b.subtle,
    'panel.indent_guide_active': b.normal,
    'panel.indent_guide_hover': b.focus,
    'status_bar.background': s.sunken,
    'title_bar.background': s.alt,
    'title_bar.inactive_background': s.sunken,
    'toolbar.background': s.base,
    'tab_bar.background': s.alt,
    'tab.inactive_background': s.alt,
    'tab.active_background': s.base,

    // ---------------------------------------------------------------- elements
    'element.background': s.raised,
    'element.hover': s.hover,
    'element.active': s.active,
    'element.selected': s.active,
    'element.disabled': alpha(s.raised, 0.6),
    'ghost_element.background': transparent,
    'ghost_element.hover': s.hover,
    'ghost_element.active': s.active,
    'ghost_element.selected': s.active,
    'ghost_element.disabled': transparent,
    'drop_target.background': alpha(f.action, 0.2),

    // ----------------------------------------------------------------- borders
    border: b.normal,
    'border.variant': b.subtle,
    'border.focused': b.focus,
    'border.selected': b.focus,
    'border.transparent': transparent,
    'border.disabled': b.subtle,
    'pane.focused_border': b.focus,
    'panel.focused_border': b.focus,
    'pane_group.border': b.normal,

    // ------------------------------------------------------------- text & icon
    text: t.primary,
    'text.muted': t.secondary,
    'text.placeholder': t.muted,
    'text.disabled': t.faint,
    'text.accent': f.action,
    icon: t.primary,
    'icon.muted': t.secondary,
    'icon.disabled': t.faint,
    'icon.placeholder': t.muted,
    'icon.accent': f.action,

    // --------------------------------------------------------------- scrollbar
    'scrollbar.thumb.background': alpha(t.primary, 0.18),
    'scrollbar.thumb.hover_background': alpha(t.primary, 0.3),
    'scrollbar.thumb.border': transparent,
    'scrollbar.track.background': transparent,
    'scrollbar.track.border': b.subtle,

    // ------------------------------------------------------------------ editor
    'editor.foreground': t.primary,
    'editor.background': s.base,
    'editor.gutter.background': s.base,
    'editor.subheader.background': s.alt,
    'editor.active_line.background': alpha(f.action, 0.08),
    'editor.highlighted_line.background': alpha(f.action, 0.12),
    'editor.line_number': t.faint,
    'editor.active_line_number': t.secondary,
    'editor.invisible': t.faint,
    'editor.wrap_guide': b.subtle,
    'editor.active_wrap_guide': b.normal,
    'editor.indent_guide': b.subtle,
    'editor.indent_guide_active': b.normal,
    'editor.document_highlight.read_background': alpha(y.function, 0.16),
    'editor.document_highlight.write_background': alpha(y.function, 0.24),
    'editor.document_highlight.bracket_background': alpha(y.function, 0.2),

    // ------------------------------------------------------------------ search
    'search.match_background': alpha(y.number, 0.32),

    // ------------------------------------------------------------------- links
    'link_text.hover': y.method,

    // ----------------------------------------------------------------- status
    created: st.added,
    'created.background': alpha(st.added, 0.12),
    'created.border': alpha(st.added, 0.4),
    modified: st.modified,
    'modified.background': alpha(st.modified, 0.12),
    'modified.border': alpha(st.modified, 0.4),
    deleted: st.deleted,
    'deleted.background': alpha(st.deleted, 0.12),
    'deleted.border': alpha(st.deleted, 0.4),
    conflict: y.number,
    'conflict.background': alpha(y.number, 0.12),
    'conflict.border': alpha(y.number, 0.4),
    error: st.error,
    'error.background': alpha(st.error, 0.12),
    'error.border': alpha(st.error, 0.4),
    warning: st.warning,
    'warning.background': alpha(st.warning, 0.12),
    'warning.border': alpha(st.warning, 0.4),
    info: st.info,
    'info.background': alpha(st.info, 0.12),
    'info.border': alpha(st.info, 0.4),
    hint: t.muted,
    'hint.background': alpha(t.muted, 0.12),
    'hint.border': b.normal,
    success: st.success,
    'success.background': alpha(st.success, 0.12),
    'success.border': alpha(st.success, 0.4),
    hidden: t.faint,
    'hidden.background': transparent,
    'hidden.border': b.subtle,
    ignored: t.faint,
    'ignored.background': transparent,
    'ignored.border': b.subtle,
    renamed: st.renamed,
    'renamed.background': alpha(st.renamed, 0.12),
    'renamed.border': alpha(st.renamed, 0.4),
    predictive: t.muted,
    'predictive.background': alpha(t.muted, 0.08),
    'predictive.border': b.subtle,
    unreachable: t.faint,
    'unreachable.background': transparent,
    'unreachable.border': b.subtle,

    // ----------------------------------------------------------------- players
    players: buildPlayers(f),

    // ---------------------------------------------------------------- terminal
    'terminal.ansi.background': s.sunken,
    'terminal.background': s.sunken,
    'terminal.foreground': t.primary,
    'terminal.bright_foreground': dark ? lighten(t.primary, 0.1) : darken(t.primary, 0.1),
    'terminal.dim_foreground': t.secondary,
    'terminal.ansi.black': f.ansi[0],
    'terminal.ansi.red': f.ansi[1],
    'terminal.ansi.green': f.ansi[2],
    'terminal.ansi.yellow': f.ansi[3],
    'terminal.ansi.blue': f.ansi[4],
    'terminal.ansi.magenta': f.ansi[5],
    'terminal.ansi.cyan': f.ansi[6],
    'terminal.ansi.white': f.ansi[7],
    'terminal.ansi.bright_black': f.ansi[8],
    'terminal.ansi.bright_red': f.ansi[9],
    'terminal.ansi.bright_green': f.ansi[10],
    'terminal.ansi.bright_yellow': f.ansi[11],
    'terminal.ansi.bright_blue': f.ansi[12],
    'terminal.ansi.bright_magenta': f.ansi[13],
    'terminal.ansi.bright_cyan': f.ansi[14],
    'terminal.ansi.bright_white': f.ansi[15],
    'terminal.ansi.dim_black': mix(f.ansi[0], s.sunken, 0.5),
    'terminal.ansi.dim_red': mix(f.ansi[1], s.sunken, 0.5),
    'terminal.ansi.dim_green': mix(f.ansi[2], s.sunken, 0.5),
    'terminal.ansi.dim_yellow': mix(f.ansi[3], s.sunken, 0.5),
    'terminal.ansi.dim_blue': mix(f.ansi[4], s.sunken, 0.5),
    'terminal.ansi.dim_magenta': mix(f.ansi[5], s.sunken, 0.5),
    'terminal.ansi.dim_cyan': mix(f.ansi[6], s.sunken, 0.5),
    'terminal.ansi.dim_white': mix(f.ansi[7], s.sunken, 0.5),

    // ------------------------------------------------------------------ syntax
    syntax: buildSyntax(f),
  };
}

export function buildZedTheme(flavor: Flavor): ZedTheme {
  return {
    name: themeDisplayName(flavor),
    appearance: flavor.meta.appearance,
    style: buildStyle(flavor),
  };
}

export function buildZedFamily(): ZedThemeFamily {
  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: ZED_FAMILY_NAME,
    author: 'Konata9',
    themes: flavors.map(buildZedTheme),
  };
}

export function buildExtensionToml(version: string): string {
  return [
    'id = "inkstone"',
    'name = "Inkstone"',
    `version = "${version}"`,
    'schema_version = 1',
    'authors = ["Konata9"]',
    'description = "墨观 Inkstone — a traditional Chinese color theme for editors and terminals"',
    'repository = "https://github.com/Konata9/inkstone"',
    '',
  ].join('\n');
}

export function generateZed(version = '0.3.5'): GeneratedFile[] {
  const familyContent = `${JSON.stringify(buildZedFamily(), null, 2)}\n`;
  return [
    {
      path: `dist/zed/${ZED_FILE_NAME}`,
      content: familyContent,
    },
    {
      path: `dist/zed/themes/${ZED_FILE_NAME}`,
      content: familyContent,
    },
    {
      path: 'dist/zed/extension.toml',
      content: buildExtensionToml(version),
    },
  ];
}
