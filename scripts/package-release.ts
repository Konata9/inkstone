#!/usr/bin/env node
/**
 * Assemble the GitHub Release assets.
 *
 * Usage:
 *   pnpm build
 *   pnpm package:vscode
 *   pnpm package:release -- --tag v0.4.0
 *
 * Outputs to dist/release/:
 *   inkstone-ghostty-<version>.zip
 *   inkstone-kaku-<version>.zip
 *   inkstone-opencode-<version>.zip
 *   inkstone-<version>.zip          (all targets + manifest)
 *   moguan.inkstone-<version>.vsix
 *   manifest.json
 *   SHA256SUMS
 *
 * Release notes, when the version exists in CHANGELOG.md, are written to
 * dist/release-notes.md for `gh release create --notes-file`.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flavors } from '../src/palette/index.ts';
import {
  ghosttyThemeName,
  kakuFileName,
  opencodeFileName,
  themeDisplayName,
  vscodeFileName,
} from '../src/targets/naming.ts';
import { readJson, vsixFileName } from './packaging.ts';
import type { PackageJson } from './packaging.ts';

interface ThemeManifest {
  id: string;
  name: string;
  displayName: string;
  mode: string;
  family: string;
  files: {
    ghostty: string;
    kaku: string;
    opencode: string;
    vscode: string;
  };
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;

  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

function fail(message: string): never {
  console.error(`\nRelease packaging failed: ${message}\n`);
  process.exit(1);
}

function repoUrl(pkg: PackageJson): string {
  const raw = pkg.repository?.url ?? 'https://github.com/Konata9/inkstone';
  return raw
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git@github\.com:/, 'https://github.com/');
}

function assertFile(path: string): void {
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`missing ${path}; run \`pnpm build\` (and \`pnpm package:vscode\`) first`);
  }
}

function zipCommand(): void {
  try {
    execFileSync('zip', ['-v'], { stdio: 'ignore' });
  } catch {
    fail('the `zip` command is required to build release archives');
  }
}

const root = fileURLToPath(new URL('..', import.meta.url));
const releaseDir = join(root, 'dist', 'release');
const stagingDir = join(root, 'dist', '.release-staging');
const notesPath = join(root, 'dist', 'release-notes.md');

const rootPkg = readJson<PackageJson>(join(root, 'package.json'));
const vscodePkg = readJson<PackageJson>(join(root, 'packages', 'vscode', 'package.json'));
const version = String(rootPkg.version);
const tag = argValue('--tag');

if (rootPkg.version !== vscodePkg.version) {
  fail(
    `version mismatch: root package.json is ${rootPkg.version}, ` +
      `packages/vscode/package.json is ${vscodePkg.version}`,
  );
}

if (tag && tag !== `v${version}`) {
  fail(`tag ${tag} does not match package version v${version}`);
}

zipCommand();

rmSync(releaseDir, { recursive: true, force: true });
rmSync(stagingDir, { recursive: true, force: true });
rmSync(notesPath, { force: true });
mkdirSync(releaseDir, { recursive: true });

const ghosttyFiles = flavors.map(ghosttyThemeName);
const kakuFiles = flavors.map(kakuFileName);
const opencodeFiles = flavors.map(opencodeFileName);

for (const file of ghosttyFiles) assertFile(join(root, 'dist', 'ghostty', file));
for (const file of kakuFiles) assertFile(join(root, 'dist', 'kaku', file));
for (const file of opencodeFiles) assertFile(join(root, 'dist', 'opencode', file));

const ghosttyArchive = `inkstone-ghostty-${version}.zip`;
const kakuArchive = `inkstone-kaku-${version}.zip`;
const opencodeArchive = `inkstone-opencode-${version}.zip`;
const bundleArchive = `inkstone-${version}.zip`;
const vsixName = vsixFileName(vscodePkg);
const vsixPath = join(root, 'dist', vsixName);

assertFile(vsixPath);

function zipFlat(archive: string, directory: string, files: string[]): void {
  execFileSync('zip', ['-j', '-X', '-q', join(releaseDir, archive), ...files], {
    cwd: directory,
    stdio: 'inherit',
  });
}

zipFlat(ghosttyArchive, join(root, 'dist', 'ghostty'), ghosttyFiles);
zipFlat(kakuArchive, join(root, 'dist', 'kaku'), kakuFiles);
zipFlat(opencodeArchive, join(root, 'dist', 'opencode'), opencodeFiles);
copyFileSync(vsixPath, join(releaseDir, vsixName));

const themes: ThemeManifest[] = flavors.map((flavor) => ({
  id: flavor.meta.id,
  name: ghosttyThemeName(flavor),
  displayName: themeDisplayName(flavor),
  mode: flavor.meta.appearance,
  family: flavor.meta.family,
  files: {
    ghostty: ghosttyThemeName(flavor),
    kaku: kakuFileName(flavor),
    opencode: opencodeFileName(flavor),
    vscode: vscodeFileName(flavor),
  },
}));

const manifest = {
  schemaVersion: 1,
  name: 'inkstone',
  displayName: '墨观 Inkstone',
  version,
  license: rootPkg.license ?? 'MIT',
  repository: repoUrl(rootPkg),
  themes,
  targets: {
    ghostty: {
      directory: '~/.config/ghostty/themes',
      archive: ghosttyArchive,
      format: 'ghostty',
    },
    kaku: {
      directory: '~/.config/kaku',
      archive: kakuArchive,
      format: 'lua',
    },
    wezterm: {
      directory: '~/.config/wezterm',
      archive: kakuArchive,
      format: 'lua',
      note: "Reference a file with dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')",
    },
    opencode: {
      directory: '~/.config/opencode/themes',
      archive: opencodeArchive,
      format: 'json',
    },
  },
  vscode: {
    id: `${vscodePkg.publisher}.${vscodePkg.name}`,
    archive: vsixName,
  },
  bundle: bundleArchive,
};

const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync(join(releaseDir, 'manifest.json'), manifestJson, 'utf8');

const installDoc = `# 墨观 Inkstone ${version}

This bundle contains every theme file for the ${version} release.
The machine-readable index is \`manifest.json\`.

## Ghostty

\`\`\`bash
mkdir -p ~/.config/ghostty/themes
cp ghostty/* ~/.config/ghostty/themes/
\`\`\`

Add one of these lines to \`~/.config/ghostty/config\`:

\`\`\`ini
theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo
theme = light:Inkstone Xuanzhi Dimmed,dark:Inkstone Xuanmo Dimmed
theme = light:Inkstone Qingci,dark:Inkstone Canghai
\`\`\`

## Kaku

\`\`\`bash
cp kaku/*.lua ~/.config/kaku/
\`\`\`

Add one variant to \`~/.config/kaku/kaku.lua\`:

\`\`\`lua
config.color_schemes = config.color_schemes or {}
config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')
config.color_scheme = 'Inkstone Xuanmo'
\`\`\`

## WezTerm

Copy \`kaku/*.lua\` to \`~/.config/wezterm/\` and reference it with \`dofile\`
from \`wezterm.lua\`, the same way as Kaku.

## OpenCode (V2)

\`\`\`bash
mkdir -p ~/.config/opencode/themes
cp opencode/*.json ~/.config/opencode/themes/
\`\`\`

Restart OpenCode and pick a theme with \`/themes\`, or pin it in
\`~/.config/opencode/cli.json\`:

\`\`\`json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "theme": { "name": "inkstone-xuanmo", "mode": "dark" }
}
\`\`\`

## VS Code / Cursor / Windsurf / VSCodium

Install \`${vsixName}\` from the release assets:

\`\`\`bash
code --install-extension ${vsixName}
\`\`\`

Then run **Preferences: Color Theme** and pick an Inkstone variant.
`;

mkdirSync(join(stagingDir, 'ghostty'), { recursive: true });
mkdirSync(join(stagingDir, 'kaku'), { recursive: true });
mkdirSync(join(stagingDir, 'opencode'), { recursive: true });

for (const file of ghosttyFiles) {
  copyFileSync(join(root, 'dist', 'ghostty', file), join(stagingDir, 'ghostty', file));
}
for (const file of kakuFiles) {
  copyFileSync(join(root, 'dist', 'kaku', file), join(stagingDir, 'kaku', file));
}
for (const file of opencodeFiles) {
  copyFileSync(join(root, 'dist', 'opencode', file), join(stagingDir, 'opencode', file));
}

writeFileSync(join(stagingDir, 'manifest.json'), manifestJson, 'utf8');
writeFileSync(join(stagingDir, 'INSTALL.md'), installDoc, 'utf8');
copyFileSync(join(root, 'LICENSE'), join(stagingDir, 'LICENSE'));
copyFileSync(join(root, 'CHANGELOG.md'), join(stagingDir, 'CHANGELOG.md'));

execFileSync(
  'zip',
  ['-r', '-X', '-q', join(releaseDir, bundleArchive), 'ghostty', 'kaku', 'opencode', 'manifest.json', 'INSTALL.md', 'LICENSE', 'CHANGELOG.md'],
  { cwd: stagingDir, stdio: 'inherit' },
);

rmSync(stagingDir, { recursive: true, force: true });

function extractReleaseNotes(): string | undefined {
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const lines = changelog.split('\n');
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^##\\s+v?${escaped}(?:\\s|$)`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return undefined;

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) end = lines.length;

  const body = lines.slice(start + 1, end).join('\n').trim();
  return body.length > 0 ? `${body}\n` : undefined;
}

const notes = extractReleaseNotes();
if (notes) {
  writeFileSync(notesPath, notes, 'utf8');
  console.log(`  ✓ dist/release-notes.md (from CHANGELOG.md ${version})`);
} else {
  console.warn(`  ! CHANGELOG.md has no "## ${version}" section; the workflow will use generated notes`);
}

function unreleasedHasEntries(): boolean {
  const lines = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').split('\n');
  const start = lines.findIndex((line) => /^##\s+Unreleased\s*$/.test(line));
  if (start === -1) return false;

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) end = lines.length;

  return lines.slice(start + 1, end).some((line) => line.trim().length > 0);
}

if (notes && unreleasedHasEntries()) {
  console.warn(
    '  ! CHANGELOG.md still has an "## Unreleased" section; ' +
      `those entries are not in the ${version} release notes. ` +
      'Rename it to the release version or move the entries before tagging.',
  );
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const assets = readdirSync(releaseDir)
  .filter((name) => name !== 'SHA256SUMS' && statSync(join(releaseDir, name)).isFile())
  .sort();

writeFileSync(
  join(releaseDir, 'SHA256SUMS'),
  `${assets.map((name) => `${sha256(join(releaseDir, name))}  ${name}`).join('\n')}\n`,
  'utf8',
);

console.log(`\nRelease assets for ${version}:`);
for (const name of [...assets, 'SHA256SUMS']) {
  console.log(`  ✓ dist/release/${name}`);
}
console.log();
