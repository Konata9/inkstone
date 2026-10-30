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
 *   inkstone-warp-<version>.zip
 *   inkstone-<version>.zip          (all targets + manifest)
 *   Konata9.inkstone-<version>.vsix
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

import { flavors } from '../src/palette/index.ts';
import {
  ghosttyThemeName,
  kakuFileName,
  kakuTomlFileName,
  opencodeFileName,
  themeDisplayName,
  vscodeFileName,
  warpFileName,
  ZED_FILE_NAME,
} from '../src/targets/naming.ts';
import { argValue } from './args.ts';
import { extractReleaseNotes, hasUnreleasedEntries } from './changelog.ts';
import { repoUrl, vsixFileName } from './packaging.ts';
import {
  assertTagMatchesVersion,
  readRootPkg,
  readVscodePkg,
  root,
} from './versioning.ts';

interface ThemeManifest {
  id: string;
  name: string;
  displayName: string;
  mode: string;
  family: string;
  files: {
    ghostty: string;
    kaku: string;
    kakuToml: string;
    opencode: string;
    vscode: string;
    warp: string;
    zed: string;
  };
}

function fail(message: string): never {
  console.error(`\nRelease packaging failed: ${message}\n`);
  process.exit(1);
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

const releaseDir = join(root, 'dist', 'release');
const stagingDir = join(root, 'dist', '.release-staging');
const notesPath = join(root, 'dist', 'release-notes.md');

const rootPkg = readRootPkg();
const vscodePkg = readVscodePkg();
const version = String(rootPkg.version);
const tag = argValue('--tag', fail);

if (tag) {
  try {
    assertTagMatchesVersion(tag, version);
  } catch (error) {
    fail((error as Error).message);
  }
}

zipCommand();

rmSync(releaseDir, { recursive: true, force: true });
rmSync(stagingDir, { recursive: true, force: true });
rmSync(notesPath, { force: true });
mkdirSync(releaseDir, { recursive: true });

const ghosttyFiles = flavors.map(ghosttyThemeName);
const kakuFiles = flavors.map(kakuFileName);
const kakuTomlFiles = flavors.map(kakuTomlFileName);
const opencodeFiles = flavors.map(opencodeFileName);
const warpFiles = flavors.map(warpFileName);

for (const file of ghosttyFiles) assertFile(join(root, 'dist', 'ghostty', file));
for (const file of kakuFiles) assertFile(join(root, 'dist', 'kaku', file));
for (const file of kakuTomlFiles) assertFile(join(root, 'dist', 'kaku', file));
for (const file of opencodeFiles) assertFile(join(root, 'dist', 'opencode', file));
for (const file of warpFiles) assertFile(join(root, 'dist', 'warp', file));
assertFile(join(root, 'dist', 'zed', ZED_FILE_NAME));

const ghosttyArchive = `inkstone-ghostty-${version}.zip`;
const kakuArchive = `inkstone-kaku-${version}.zip`;
const opencodeArchive = `inkstone-opencode-${version}.zip`;
const warpArchive = `inkstone-warp-${version}.zip`;
const zedArchive = `inkstone-zed-${version}.zip`;
const bundleArchive = `inkstone-${version}.zip`;
const vsixName = vsixFileName({ ...vscodePkg, version });
const vsixPath = join(root, 'dist', vsixName);

assertFile(vsixPath);

function zipFlat(archive: string, directory: string, files: string[]): void {
  execFileSync('zip', ['-j', '-X', '-q', join(releaseDir, archive), ...files], {
    cwd: directory,
    stdio: 'inherit',
  });
}

zipFlat(ghosttyArchive, join(root, 'dist', 'ghostty'), ghosttyFiles);
zipFlat(kakuArchive, join(root, 'dist', 'kaku'), [...kakuFiles, ...kakuTomlFiles]);
zipFlat(opencodeArchive, join(root, 'dist', 'opencode'), opencodeFiles);
zipFlat(warpArchive, join(root, 'dist', 'warp'), warpFiles);
zipFlat(zedArchive, join(root, 'dist', 'zed'), [ZED_FILE_NAME]);
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
    kakuToml: kakuTomlFileName(flavor),
    opencode: opencodeFileName(flavor),
    vscode: vscodeFileName(flavor),
    warp: warpFileName(flavor),
    zed: ZED_FILE_NAME,
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
      tomlDirectory: '~/.config/kaku/colors',
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
    warp: {
      directory: '~/.warp/themes',
      linuxDirectory: '~/.local/share/warp-terminal/themes',
      archive: warpArchive,
      format: 'yaml',
    },
    zed: {
      directory: '~/.config/zed/themes',
      archive: zedArchive,
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

Kaku 0.27.1 and newer list custom themes from \`~/.config/kaku/colors/\`:

\`\`\`bash
mkdir -p ~/.config/kaku/colors
cp kaku/*.toml ~/.config/kaku/colors/
\`\`\`

Open Settings (Cmd+,) and pick \`Inkstone Xuanmo\` from Theme; Kaku writes
\`config.color_scheme\` for you.

On an older Kaku, or in WezTerm, use the Lua table instead:

\`\`\`bash
cp kaku/*.lua ~/.config/kaku/
\`\`\`

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

## Warp

\`\`\`bash
mkdir -p ~/.warp/themes        # Linux: ~/.local/share/warp-terminal/themes
cp warp/*.yaml ~/.warp/themes/
\`\`\`

Open Settings → Appearance → Themes and pick an Inkstone variant; turn on
"Sync with OS" to pair a light and a dark one.

## Zed

\`\`\`bash
mkdir -p ~/.config/zed/themes
cp zed/inkstone.json ~/.config/zed/themes/
\`\`\`

Pick an Inkstone variant with the theme selector (\`cmd-k cmd-t\`), or configure in \`~/.config/zed/settings.json\`:

\`\`\`json
{
  "theme": {
    "mode": "system",
    "light": "墨观 · 宣纸 (Inkstone Xuanzhi)",
    "dark": "墨观 · 玄墨 (Inkstone Xuanmo)"
  }
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
mkdirSync(join(stagingDir, 'warp'), { recursive: true });
mkdirSync(join(stagingDir, 'zed'), { recursive: true });

for (const file of ghosttyFiles) {
  copyFileSync(join(root, 'dist', 'ghostty', file), join(stagingDir, 'ghostty', file));
}
for (const file of kakuFiles) {
  copyFileSync(join(root, 'dist', 'kaku', file), join(stagingDir, 'kaku', file));
}
for (const file of kakuTomlFiles) {
  copyFileSync(join(root, 'dist', 'kaku', file), join(stagingDir, 'kaku', file));
}
for (const file of opencodeFiles) {
  copyFileSync(join(root, 'dist', 'opencode', file), join(stagingDir, 'opencode', file));
}
for (const file of warpFiles) {
  copyFileSync(join(root, 'dist', 'warp', file), join(stagingDir, 'warp', file));
}
copyFileSync(join(root, 'dist', 'zed', ZED_FILE_NAME), join(stagingDir, 'zed', ZED_FILE_NAME));

writeFileSync(join(stagingDir, 'manifest.json'), manifestJson, 'utf8');
writeFileSync(join(stagingDir, 'INSTALL.md'), installDoc, 'utf8');
copyFileSync(join(root, 'LICENSE'), join(stagingDir, 'LICENSE'));
copyFileSync(join(root, 'CHANGELOG.md'), join(stagingDir, 'CHANGELOG.md'));

execFileSync(
  'zip',
  ['-r', '-X', '-q', join(releaseDir, bundleArchive), 'ghostty', 'kaku', 'opencode', 'warp', 'zed', 'manifest.json', 'INSTALL.md', 'LICENSE', 'CHANGELOG.md'],
  { cwd: stagingDir, stdio: 'inherit' },
);

rmSync(stagingDir, { recursive: true, force: true });

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const notes = extractReleaseNotes(changelog, version);
if (notes) {
  writeFileSync(notesPath, notes, 'utf8');
  console.log(`  ✓ dist/release-notes.md (from CHANGELOG.md ${version})`);
} else {
  console.warn(`  ! CHANGELOG.md has no "## ${version}" section; the workflow will use generated notes`);
}

if (notes && hasUnreleasedEntries(changelog)) {
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
