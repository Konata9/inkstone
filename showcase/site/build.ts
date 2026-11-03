/**
 * Build the product site into `site/`.
 *
 *   pnpm build:site
 *
 * `site/` is a pure output directory: everything in it is written by this
 * script, so the build starts from a clean slate. Site source lives in
 * `showcase/site/`; the theme source in `src/` is only read.
 */

import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectSiteOutputs, SITE_BINARY_OUTPUTS } from './outputs.ts';
import { readRootVersion } from '../../src/version.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const version = readRootVersion();

// `site/` holds generated files only, so a full clean keeps retired pages and
// assets from lingering after a rename.
rmSync(join(root, 'site'), { recursive: true, force: true });
console.log('  ✓ site/ cleaned');

const files = collectSiteOutputs(version);

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

for (const binary of SITE_BINARY_OUTPUTS) {
  const destination = join(root, binary.path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(root, binary.source), destination);
  console.log(`  ✓ ${binary.path}`);
}

console.log(
  `\nBuilt ${files.length + SITE_BINARY_OUTPUTS.length} site files for ${version} ` +
    `(EN + ZH pages, SEO companions, site assets).\n`,
);
