/**
 * Build the generated documentation under `docs/`.
 *
 *   pnpm build:docs
 *
 * Only text outputs are written; `docs/preview.png` and hand-written notes
 * such as `docs/publishing.md` are left untouched.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectDocsOutputs } from './outputs.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const files = collectDocsOutputs();

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

console.log(`\nBuilt ${files.length} docs file(s).\n`);
