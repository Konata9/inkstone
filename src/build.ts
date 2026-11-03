/**
 * Build every target from the six semantic palettes.
 *
 *   pnpm build
 *
 * Outputs:
 *   packages/vscode/themes/*.json
 *   dist/ghostty/Inkstone *
 *   dist/kaku/*.lua                (WezTerm-compatible Lua tables)
 *   dist/kaku/*.toml               (Kaku `colors/` directory schemes)
 *   dist/opencode/*.json
 *   dist/zed/inkstone.json
 *   dist/zed/extension.toml
 *   dist/dsh/<package>/**  (four installable DeepSeek Harness theme plugins)
 *
 * Showcase outputs (site, palette reference, README screenshot) are built
 * separately with `pnpm build:site`, `pnpm build:docs` and `pnpm capture:preview`.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reportFailures, runChecks } from './checks.ts';
import { collectAllOutputs } from './outputs.ts';
import { flavors } from './palette/index.ts';
import { readRootVersion } from './version.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const version = readRootVersion();

const checks = runChecks();
if (!checks.ok) {
  reportFailures(checks, 'Build stopped');
  process.exit(1);
}

// Start from a clean output directory: renamed or retired flavors must not
// leave stale theme files behind for install scripts and release packaging.
rmSync(join(root, 'dist'), { recursive: true, force: true });
console.log('  ✓ dist/ cleaned');

const files = collectAllOutputs(version);

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

console.log(
  `\nBuilt ${files.length} files for ${flavors.length} flavors ` +
    `(${checks.audit.checks} palette checks, ${flavors.length} VS Code themes, ` +
    `${flavors.length} Ghostty themes, ${flavors.length} Kaku schemes (Lua + TOML), ` +
    `${flavors.length} OpenCode themes, Zed themes, DSH theme plugins).\n`,
);
