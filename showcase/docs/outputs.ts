/**
 * Text outputs for the generated documentation under `docs/`.
 *
 * Shared by the docs build and the release drift check. Every Markdown file is
 * generated from `showcase/docs/`; `docs/preview.png` is produced separately by
 * `pnpm capture:preview`.
 */

import { renderDesignDoc } from './design.ts';
import { renderDevelopmentDoc } from './development.ts';
import { renderDocsIndex } from './index.ts';
import { renderInstallationDoc } from './installation.ts';
import { renderPaletteDoc } from './palette.ts';
import { renderPublishingDoc } from './publishing.ts';

export interface DocsOutput {
  path: string;
  content: string;
}

/** Generated docs files, in build order. */
export function collectDocsOutputs(): DocsOutput[] {
  return [
    { path: 'docs/README.md', content: renderDocsIndex() },
    { path: 'docs/design.md', content: renderDesignDoc() },
    { path: 'docs/installation.md', content: renderInstallationDoc() },
    { path: 'docs/development.md', content: renderDevelopmentDoc() },
    { path: 'docs/publishing.md', content: renderPublishingDoc() },
    { path: 'docs/palette.md', content: renderPaletteDoc() },
  ];
}
