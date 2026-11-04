/**
 * Root package version.
 *
 * The release scripts read `package.json` through their own helpers, but the
 * generators live in `src/` and must not import from `scripts/`. This is the
 * one place the build and the post-build checks read the theme version.
 */

import { readFileSync } from 'node:fs';

export function readRootVersion(): string {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string };
  return pkg.version;
}
