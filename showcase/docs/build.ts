/**
 * Build the generated documentation under `docs/`.
 *
 *   pnpm build:docs
 *
 * Only Markdown is written; `docs/preview.png` is produced separately by
 * `pnpm capture:preview`. Existing Markdown is removed first so a retired
 * document cannot linger after its generator is deleted.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectDocsOutputs } from './outputs.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docsRoot = join(root, 'docs');
mkdirSync(docsRoot, { recursive: true });

// Render everything before deleting anything, so a generator error leaves the
// committed docs in place.
const files = collectDocsOutputs();

for (const entry of readdirSync(docsRoot, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    rmSync(join(docsRoot, entry.name));
  }
}
console.log('  ✓ docs/*.md cleaned');

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

console.log(`\nBuilt ${files.length} docs file(s).\n`);
