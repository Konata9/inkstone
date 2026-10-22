/**
 * Build every target from the six semantic palettes.
 *
 *   pnpm build
 *
 * Outputs:
 *   packages/vscode/package.json   (version synced from the root package.json)
 *   packages/vscode/themes/*.json
 *   packages/vscode/CHANGELOG.md   (copy of the root CHANGELOG.md)
 *   dist/ghostty/Inkstone *
 *   dist/kaku/*.lua
 *   dist/opencode/*.json
 *   preview/index.html
 *   docs/palette.md
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reportFailures, runChecks } from './checks.ts';
import { flavors } from './palette/index.ts';
import { renderPaletteDoc } from './targets/docs.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku } from './targets/kaku.ts';
import { generateOpencode } from './targets/opencode.ts';
import { renderPreview } from './targets/preview.ts';
import { generateVscode } from './targets/vscode.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

const checks = runChecks();
if (!checks.ok) {
  reportFailures(checks, 'Build stopped');
  process.exit(1);
}

/** Keep the extension manifest on the root version; the file stays committed. */
function syncVscodeVersion(): string {
  const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    version: string;
  };
  const manifest = JSON.parse(
    readFileSync(join(root, 'packages', 'vscode', 'package.json'), 'utf8'),
  ) as Record<string, unknown>;
  return `${JSON.stringify({ ...manifest, version: rootPkg.version }, null, 2)}\n`;
}

const files = [
  {
    path: 'packages/vscode/package.json',
    content: syncVscodeVersion(),
  },
  ...generateVscode(),
  {
    path: 'packages/vscode/CHANGELOG.md',
    content: readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
  },
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
    `(${checks.audit.checks} palette checks, ${flavors.length} VS Code themes, ` +
    `${flavors.length} Ghostty themes, ${flavors.length} Kaku schemes, ` +
    `${flavors.length} OpenCode themes).\n`,
);
