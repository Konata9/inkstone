/**
 * Text outputs for the generated documentation under `docs/`.
 *
 * Shared by the docs build and the release drift check.
 */

import { renderPaletteDoc } from './palette.ts';

export interface DocsOutput {
  path: string;
  content: string;
}

/** Generated docs files, in build order. */
export function collectDocsOutputs(): DocsOutput[] {
  return [{ path: 'docs/palette.md', content: renderPaletteDoc() }];
}
