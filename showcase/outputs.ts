/**
 * Every file `pnpm build:showcase` writes, in build order.
 *
 * The showcase build and the release drift check share this list: the product
 * site under `site/`, the generated palette reference under `docs/`, and the
 * copied site assets. `docs/preview.png` is produced separately by
 * `pnpm capture:preview`.
 */

import { renderPaletteDoc } from './docs/palette.ts';
import { collectSiteOutputs, SITE_BINARY_OUTPUTS } from './site/outputs.ts';
import type { SiteBinaryOutput, SiteOutput } from './site/outputs.ts';

/** Text outputs for the site and the palette reference. */
export function collectShowcaseOutputs(version: string): SiteOutput[] {
  return [
    ...collectSiteOutputs(version),
    { path: 'docs/palette.md', content: renderPaletteDoc() },
  ];
}

/** Showcase assets that are copied rather than rendered. */
export const SHOWCASE_BINARY_OUTPUTS: SiteBinaryOutput[] = SITE_BINARY_OUTPUTS;
