/**
 * Orca app-theme tokens, and which Inkstone colour paints each one.
 *
 * Orca's theme interface is public: `docs/reference/plugin-theme-tokens.md` in
 * `stablyai/orca` (MIT) lists every token a theme may set, what it paints and
 * what it falls back to. Token names are that interface — every theme has to
 * spell them the same way — so `ORCA_APP_TOKENS` reproduces the list, while
 * every value below is an Inkstone semantic field. Reading the palette directly,
 * rather than routing through the VS Code workbench keys, keeps a mapping edit a
 * one-line change in this file instead of a change with two themes to verify.
 *
 * Fetched from `stablyai/orca` at `ff1de8254a1f` (2026-11-14).
 *
 * Deliberately absent: `--host-badge`, `--host-badge-foreground`, the `--chat-*`
 * family, `--worktree-sidebar-active` and the `--diff-*-background`,
 * `-emphasis` and `-gutter` tints. Orca lets those be translucent and checks
 * them as painted over the surface beneath; it derives every one of them from
 * `--foreground`, `--background`, `--muted-foreground`, `--diff-added` and
 * `--diff-removed`, which already carry the flavour. Setting them here would add
 * a second contrast audit for no colour the palette does not already express.
 */

import type { Flavor } from '../palette/types.ts';

/** Every token an app theme may set, in the order the reference lists them. */
export const ORCA_APP_TOKENS = [
  '--background',
  '--editor-surface',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
  '--worktree-sidebar',
  '--worktree-sidebar-foreground',
  '--worktree-sidebar-accent',
  '--worktree-sidebar-accent-foreground',
  '--worktree-sidebar-border',
  '--worktree-sidebar-ring',
  '--worktree-sidebar-active',
  '--worktree-sidebar-active-border',
  '--host-badge',
  '--host-badge-foreground',
  '--tab-bar',
  '--tab-active',
  '--tab-active-foreground',
  '--tab-active-indicator',
  '--tab-inactive',
  '--tab-inactive-foreground',
  '--split-divider',
  '--split-divider-hover',
  '--chat-user-message',
  '--chat-bold-foreground',
  '--chat-muted-foreground',
  '--chat-inline-code',
  '--chat-inline-code-foreground',
  '--chat-code-block',
  '--chat-selection',
  '--chat-selection-foreground',
  '--text-link',
  '--diff-added',
  '--diff-added-background',
  '--diff-added-emphasis',
  '--diff-added-gutter',
  '--diff-removed',
  '--diff-removed-background',
  '--diff-removed-emphasis',
  '--diff-removed-gutter',
  '--git-decoration-added',
  '--git-decoration-modified',
  '--git-decoration-deleted',
  '--git-decoration-renamed',
  '--git-decoration-untracked',
  '--git-decoration-copied',
  '--git-decoration-ignored',
] as const;

export type OrcaAppToken = (typeof ORCA_APP_TOKENS)[number];

/**
 * The Inkstone field painting each token. Tokens missing here are omitted from
 * the file and left to Orca's own derivation, which starts from the tokens that
 * are set — so the theme stays whole instead of falling back to Orca's defaults.
 */
export const ORCA_TOKEN_SOURCES = {
  // The canvas, and the editor that shares it.
  '--background': (f) => f.surface.base,
  '--editor-surface': (f) => f.surface.base,
  '--foreground': (f) => f.text.primary,

  // Cards and panels sit on the sidebar step; menus float one step higher.
  '--card': (f) => f.surface.alt,
  '--card-foreground': (f) => f.text.primary,
  '--popover': (f) => f.surface.overlay,
  '--popover-foreground': (f) => f.text.primary,

  // Commands. The palette keeps the action blue apart from the annotation red,
  // and `.text.inverse` is the colour the palette draws on top of it.
  '--primary': (f) => f.action,
  '--primary-foreground': (f) => f.text.inverse,

  // Quiet fills.
  '--secondary': (f) => f.surface.raised,
  '--secondary-foreground': (f) => f.text.primary,
  '--muted': (f) => f.surface.sunken,
  '--muted-foreground': (f) => f.text.muted,
  '--accent': (f) => f.surface.hover,
  '--accent-foreground': (f) => f.text.primary,

  // Edges.
  '--border': (f) => f.border.normal,
  '--input': (f) => f.border.normal,
  '--ring': (f) => f.border.focus,

  // Charts take the syntax ramp, the palette's ready-made set of distinct hues.
  '--chart-1': (f) => f.syntax.function,
  '--chart-2': (f) => f.syntax.string,
  '--chart-3': (f) => f.syntax.number,
  '--chart-4': (f) => f.syntax.keyword,
  '--chart-5': (f) => f.syntax.type,

  // Right sidebar and settings navigation, mirroring `sideBar.*` in the VS Code
  // theme: `surface.alt` with `.text.secondary` on it.
  '--sidebar': (f) => f.surface.alt,
  '--sidebar-foreground': (f) => f.text.secondary,
  '--sidebar-primary': (f) => f.action,
  '--sidebar-primary-foreground': (f) => f.text.inverse,
  '--sidebar-accent': (f) => f.surface.active,
  '--sidebar-accent-foreground': (f) => f.text.primary,
  '--sidebar-border': (f) => f.border.normal,
  '--sidebar-ring': (f) => f.border.focus,

  // Left workspace sidebar, mirroring `activityBar.background`: the palette
  // deepens it on dark flavours and raises it on light ones.
  '--worktree-sidebar': (f) => (f.meta.appearance === 'dark' ? f.surface.sunken : f.surface.raised),
  '--worktree-sidebar-foreground': (f) => f.text.primary,
  '--worktree-sidebar-accent': (f) => f.surface.active,
  '--worktree-sidebar-accent-foreground': (f) => f.text.primary,
  '--worktree-sidebar-border': (f) => f.border.normal,
  '--worktree-sidebar-ring': (f) => f.border.focus,
  '--worktree-sidebar-active-border': (f) => f.border.strong,

  // Tabs: the active tab joins the editor, the strip behind it is the sidebar step.
  '--tab-bar': (f) => f.surface.alt,
  '--tab-active': (f) => f.surface.base,
  '--tab-active-foreground': (f) => f.text.primary,
  '--tab-active-indicator': (f) => f.action,
  '--tab-inactive': (f) => f.surface.alt,
  '--tab-inactive-foreground': (f) => f.text.secondary,
  '--split-divider': (f) => f.border.subtle,
  '--split-divider-hover': (f) => f.border.strong,

  // Links and source-control decorations.
  '--text-link': (f) => f.action,
  '--diff-added': (f) => f.status.added,
  '--diff-removed': (f) => f.status.deleted,
  '--git-decoration-added': (f) => f.status.added,
  '--git-decoration-modified': (f) => f.status.modified,
  '--git-decoration-deleted': (f) => f.status.deleted,
  '--git-decoration-renamed': (f) => f.status.renamed,
  '--git-decoration-untracked': (f) => f.syntax.regexp,
  '--git-decoration-copied': (f) => f.text.muted,
  '--git-decoration-ignored': (f) => f.text.muted,
} satisfies Partial<Record<OrcaAppToken, (flavor: Flavor) => string>>;

/** One text token checked against the surface it is drawn on. */
export interface OrcaContrastPair {
  text: OrcaAppToken;
  surface: OrcaAppToken;
  /** Minimum WCAG 2.x ratio Orca accepts for this kind of pair. */
  ratio: number;
}

/** A pair that misses its ratio is dropped: Orca would drop it anyway. */
export const ORCA_TEXT_PAIRS: readonly OrcaContrastPair[] = [
  { text: '--foreground', surface: '--background', ratio: 4.5 },
  { text: '--foreground', surface: '--editor-surface', ratio: 4.5 },
  { text: '--card-foreground', surface: '--card', ratio: 4.5 },
  { text: '--popover-foreground', surface: '--popover', ratio: 4.5 },
  { text: '--primary-foreground', surface: '--primary', ratio: 4.5 },
  { text: '--secondary-foreground', surface: '--secondary', ratio: 4.5 },
  { text: '--muted-foreground', surface: '--muted', ratio: 4.5 },
  { text: '--muted-foreground', surface: '--background', ratio: 4.5 },
  { text: '--accent-foreground', surface: '--accent', ratio: 4.5 },
  { text: '--sidebar-foreground', surface: '--sidebar', ratio: 4.5 },
  { text: '--sidebar-primary-foreground', surface: '--sidebar-primary', ratio: 4.5 },
  { text: '--sidebar-accent-foreground', surface: '--sidebar-accent', ratio: 4.5 },
  { text: '--worktree-sidebar-foreground', surface: '--worktree-sidebar', ratio: 4.5 },
  { text: '--worktree-sidebar-accent-foreground', surface: '--worktree-sidebar-accent', ratio: 4.5 },
  { text: '--tab-active-foreground', surface: '--tab-active', ratio: 4.5 },
  { text: '--tab-inactive-foreground', surface: '--tab-inactive', ratio: 4.5 },
  { text: '--text-link', surface: '--editor-surface', ratio: 4.5 },
  { text: '--git-decoration-added', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-modified', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-deleted', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-renamed', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-untracked', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-copied', surface: '--sidebar', ratio: 3 },
  { text: '--git-decoration-ignored', surface: '--sidebar', ratio: 3 },
];

/** Tokens Orca refuses to render without. */
export const ORCA_REQUIRED_TOKENS = ['--background', '--foreground'] as const satisfies readonly OrcaAppToken[];
