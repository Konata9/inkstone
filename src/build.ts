/**
 * Build every target from the six semantic palettes.
 *
 *   pnpm build
 *
 * Outputs:
 *   packages/vscode/themes/*.json
 *   dist/ghostty/Inkstone *
 *   dist/kaku/*.lua
 *   dist/opencode/*.json
 *   preview/index.html
 *   docs/palette.md
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { audit } from './audit.ts';
import { checkThemes } from './check.ts';
import { flavors } from './palette/index.ts';
import { renderPaletteDoc } from './targets/docs.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku } from './targets/kaku.ts';
import { generateOpencode } from './targets/opencode.ts';
import { renderPreview } from './targets/preview.ts';
import { generateVscode } from './targets/vscode.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

const report = audit();
if (!report.ok) {
  console.error('Build stopped: fix the palette audit first.');
  process.exit(1);
}

const issues = checkThemes();
if (issues.length > 0) {
  console.error('\nTheme checks failed:');
  for (const issue of issues) console.error(`  ✗ ${issue}`);
  process.exit(1);
}

const files = [
  ...generateVscode(),
  ...generateGhostty(),
  ...generateKaku(),
  ...generateOpencode(),
  { path: 'preview/index.html', content: renderPreview() },
  { path: 'docs/palette.md', content: renderPaletteDoc() },
];

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

console.log(
  `\nBuilt ${files.length} files for ${flavors.length} flavors ` +
    `(${report.checks} contrast checks, ${flavors.length} VS Code themes, ` +
    `${flavors.length} Ghostty themes, ${flavors.length} Kaku schemes, ` +
    `${flavors.length} OpenCode themes).\n`,
);
