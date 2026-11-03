/**
 * Every file `pnpm build` writes, in build order.
 *
 * The build and the release drift check share this list. Splitting it into
 * "committed" and "all" outputs keeps the drift check focused on the files that
 * live in the repository while the build still writes `dist/` and `preview/`.
 */

import { readFileSync } from 'node:fs';

import { renderPaletteDoc } from './targets/docs.ts';
import { generateDsh } from './targets/dsh.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku, generateKakuToml } from './targets/kaku.ts';
import { generateOpencode } from './targets/opencode.ts';
import { renderGallery, renderPreview } from './targets/preview.ts';
import { generateSite } from './targets/site.ts';
import { generateVscode } from './targets/vscode.ts';
import { generateZed } from './targets/zed.ts';

export interface GeneratedOutput {
  path: string;
  content: string;
  /** True when the build output is tracked in git and must stay in sync. */
  committed: boolean;
}

export interface GeneratedBinaryOutput {
  /** Committed destination, relative to the repository root. */
  path: string;
  /** Source file, relative to the repository root. */
  source: string;
}

/** Committed files that are copied rather than rendered. */
export const GENERATED_BINARY_OUTPUTS: GeneratedBinaryOutput[] = [
  { path: 'site/favicon.png', source: 'packages/vscode/icon.png' },
];

const paletteDoc = (): string => renderPaletteDoc();

/** Root `LICENSE`, embedded verbatim in every generated DSH package. */
const licenseText = (): string => readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');

/** Files that are tracked in git; the release drift check reads this list. */
export function collectCommittedOutputs(version: string): GeneratedOutput[] {
  return [
    ...generateVscode(),
    ...generateSite(version),
    { path: 'docs/palette.md', content: paletteDoc() },
    { path: 'site/.nojekyll', content: '' },
  ].map((file) => ({ ...file, committed: true }));
}

/**
 * Everything the build writes. Text outputs only; binary copies are described
 * by {@link GENERATED_BINARY_OUTPUTS}.
 */
export function collectAllOutputs(version: string): GeneratedOutput[] {
  return [
    ...generateVscode(),
    ...generateGhostty(),
    ...generateKaku(),
    ...generateKakuToml(),
    ...generateOpencode(),
    ...generateZed(version),
    ...generateDsh(version, licenseText()),
    { path: 'preview/index.html', content: renderPreview() },
    { path: 'preview/gallery.html', content: renderGallery() },
    ...generateSite(version),
    { path: 'docs/palette.md', content: paletteDoc() },
    { path: 'site/.nojekyll', content: '' },
  ].map((file) => ({ ...file, committed: isCommitted(file.path) }));
}

function isCommitted(path: string): boolean {
  return (
    path === 'docs/palette.md' ||
    path.startsWith('packages/vscode/themes/') ||
    path.startsWith('site/')
  );
}
