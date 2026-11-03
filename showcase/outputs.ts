/**
 * Every committed file the showcase builds write, in build order.
 *
 * The drift check shares this list: the product site under `site/`, the
 * generated palette reference under `docs/`, and the copied site assets.
 *
 * Site and docs have separate entries (`pnpm build:site` / `pnpm build:docs`);
 * `docs/preview.png` is produced separately by `pnpm capture:preview`.
 */

import { collectDocsOutputs } from './docs/outputs.ts';
import { collectSiteOutputs, SITE_BINARY_OUTPUTS } from './site/outputs.ts';
import type { SiteBinaryOutput, SiteOutput } from './site/outputs.ts';

/** Text outputs for the site and the generated docs. */
export function collectShowcaseOutputs(version: string): SiteOutput[] {
  return [...collectSiteOutputs(version), ...collectDocsOutputs()];
}

/** Showcase assets that are copied rather than rendered. */
export const SHOWCASE_BINARY_OUTPUTS: SiteBinaryOutput[] = SITE_BINARY_OUTPUTS;
