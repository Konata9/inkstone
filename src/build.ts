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
 *   dist/kaku/*.lua                (WezTerm-compatible Lua tables)
 *   dist/kaku/*.toml               (Kaku `colors/` directory schemes)
 *   dist/opencode/*.json
 *   dist/warp/*.yaml
 *   dist/zed/inkstone.json
 *   dist/zed/extension.toml
 *   preview/index.html
 *   preview/gallery.html   (editor-only shot source for docs/preview.png)
 *   site/                  (product site for GitHub Pages)
 *   docs/palette.md
 */

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reportFailures, runChecks } from './checks.ts';
import { flavors } from './palette/index.ts';
import { renderPaletteDoc } from './targets/docs.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku, generateKakuToml } from './targets/kaku.ts';
import { generateOpencode } from './targets/opencode.ts';
import { renderGallery, renderPreview } from './targets/preview.ts';
import { generateSite, SITE_FAVICON_SOURCE } from './targets/site.ts';
import { generateVscode } from './targets/vscode.ts';
import { generateWarp } from './targets/warp.ts';
import { generateZed } from './targets/zed.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
};

/** Keep the extension manifest on the root version; the file stays committed. */
function syncVscodeVersion(): string {
  const manifest = JSON.parse(
    readFileSync(join(root, 'packages', 'vscode', 'package.json'), 'utf8'),
  ) as Record<string, unknown>;
  return `${JSON.stringify({ ...manifest, version: rootPkg.version }, null, 2)}\n`;
}


const checks = runChecks();
if (!checks.ok) {
  reportFailures(checks, 'Build stopped');
  process.exit(1);
}

// Start from a clean output directory: renamed or retired flavors must not
// leave stale theme files behind for install scripts and release packaging.
rmSync(join(root, 'dist'), { recursive: true, force: true });
console.log('  ✓ dist/ cleaned');

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
  ...generateKakuToml(),
  ...generateOpencode(),
  ...generateWarp(),
  ...generateZed(rootPkg.version),
  { path: 'preview/index.html', content: renderPreview() },
  { path: 'preview/gallery.html', content: renderGallery() },
  ...generateSite(),
  { path: 'docs/palette.md', content: renderPaletteDoc() },
];

for (const file of files) {
  const destination = join(root, file.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, file.content, 'utf8');
  console.log(`  ✓ ${file.path}`);
}

mkdirSync(join(root, 'site'), { recursive: true });
copyFileSync(SITE_FAVICON_SOURCE, join(root, 'site', 'favicon.png'));
writeFileSync(join(root, 'site', '.nojekyll'), '');
console.log('  ✓ site/favicon.png');
console.log('  ✓ site/.nojekyll');

console.log(
  `\nBuilt ${files.length} files for ${flavors.length} flavors ` +
    `(${checks.audit.checks} palette checks, ${flavors.length} VS Code themes, ` +
    `${flavors.length} Ghostty themes, ${flavors.length} Kaku schemes (Lua + TOML), ` +
    `${flavors.length} OpenCode themes, ${flavors.length} Warp themes, Zed themes, site pages).\n`,
);
