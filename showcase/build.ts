/**
 * Build the showcase text outputs: the product site and the palette reference.
 *
 *   pnpm build:showcase
 *
 * `site/` is a pure output directory, so the build starts from a clean slate.
 * `docs/palette.md` is overwritten in place; other files under `docs/` (the
 * screenshot and hand-written publishing notes) are left alone.
 *
 * Source lives under `showcase/`; the theme source in `src/` is only read.
 */

import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectShowcaseOutputs,
  SHOWCASE_BINARY_OUTPUTS,
} from './outputs.ts';
import { readRootVersion } from '../src/version.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const version = readRootVersion();

// `site/` holds generated files only, so a full clean keeps retired pages and
// assets from lingering after a rename.
rmSync(join(root, 'site'), { recursive: true, force: true });
console.log('  ✓ site/ cleaned');

const files = collectShowcaseOutputs(version);

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

for (const binary of SHOWCASE_BINARY_OUTPUTS) {
  const destination = join(root, binary.path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(root, binary.source), destination);
  console.log(`  ✓ ${binary.path}`);
}

console.log(
  `\nBuilt ${files.length + SHOWCASE_BINARY_OUTPUTS.length} showcase files for ${version} ` +
    `(EN + ZH pages, SEO companions, palette reference, site assets).\n`,
);
