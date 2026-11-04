#!/usr/bin/env node
/**
 * Assemble the GitHub Release assets for one release stream.
 *
 * Usage:
 *   pnpm build
 *   pnpm package:vscode
 *   pnpm package:release --target themes --tag v0.4.0
 *   pnpm package:release --target vscode --tag vscode-v0.3.6
 *
 * `themes` writes to dist/release/:
 *   inkstone-ghostty-<themeVersion>.zip
 *   inkstone-kaku-<themeVersion>.zip
 *   inkstone-opencode-<themeVersion>.zip
 *   inkstone-warp-<themeVersion>.zip
 *   inkstone-zed-<themeVersion>.zip
 *   inkstone-dsh-<themeVersion>.tgz
 *   inkstone-dsh-<variant>-<themeVersion>.tgz
 *   inkstone-<themeVersion>.zip          (theme targets + manifest)
 *   Konata9.inkstone-<vscodeVersion>.vsix
 *   manifest.json
 *   SHA256SUMS
 *
 * `vscode` writes to dist/release/:
 *   Konata9.inkstone-<vscodeVersion>.vsix
 *   manifest.json
 *   SHA256SUMS
 *
 * Release notes, when the version exists in the stream's changelog, are
 * written to dist/release-notes.md for `gh release create --notes-file`.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  cpSync,
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
import { DSH_MENU_FLAVORS, DSH_PAIRS } from '../src/targets/dsh.ts';
import {
  dshDisplayName,
  dshMenuPackageName,
  dshMenuRowId,
  dshPackageName,
  dshRowId,
  dshTarballFileName,
  inkstoneThemeName,
  kakuFileName,
  kakuTomlFileName,
  opencodeFileName,
  themeDisplayName,
  vscodeFileName,
  warpFileName,
  ZED_FILE_NAME,
} from '../src/targets/naming.ts';
import { createFail, parseArgs } from './args.ts';
import type { Fail } from './args.ts';
import { extractReleaseNotes, hasUnreleasedEntries } from './changelog.ts';
import { repoUrl, vsixFileName } from './packaging.ts';
import {
  assertTagMatchesVersion,
  changelogLabel,
  changelogPath,
  readRootPkg,
  readVscodePkg,
  root,
} from './versioning.ts';
import type { ReleaseTarget } from './versioning.ts';

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

const fail: Fail = createFail('Release packaging failed');

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

const parsedArgs = parseArgs(process.argv.slice(2), { valueFlags: ['--tag', '--target'] }, fail);
const target = (parsedArgs.values.get('--target') ?? 'themes') as ReleaseTarget;
if (target !== 'themes' && target !== 'vscode') {
  fail('--target must be "themes" or "vscode"');
}

const releaseDir = join(root, 'dist', 'release');
const stagingDir = join(root, 'dist', '.release-staging');
const notesPath = join(root, 'dist', 'release-notes.md');

const rootPkg = readRootPkg();
const vscodePkg = readVscodePkg();
const themeVersion = String(rootPkg.version);
const vscodeVersion = String(vscodePkg.version);
const version = target === 'vscode' ? vscodeVersion : themeVersion;
const tag = parsedArgs.values.get('--tag');

if (tag) {
  try {
    assertTagMatchesVersion(tag, version, target);
  } catch (error) {
    fail((error as Error).message);
  }
}

rmSync(releaseDir, { recursive: true, force: true });
rmSync(stagingDir, { recursive: true, force: true });
rmSync(notesPath, { force: true });
mkdirSync(releaseDir, { recursive: true });

const vsixName = vsixFileName(vscodePkg);
const vsixPath = join(root, 'dist', vsixName);

function writeNotes(): void {
  const changelog = readFileSync(changelogPath(target), 'utf8');
  const label = changelogLabel(target);
  const notes = extractReleaseNotes(changelog, version);
  if (notes) {
    writeFileSync(notesPath, notes, 'utf8');
    console.log(`  ✓ dist/release-notes.md (from ${label} ${version})`);
  } else {
    console.warn(
      `  ! ${label} has no "## ${version}" section; the workflow will use generated notes`,
    );
  }

  if (notes && hasUnreleasedEntries(changelog)) {
    console.warn(
      `  ! ${label} still has an "## Unreleased" section; ` +
        `those entries are not in the ${version} release notes. ` +
        'Rename it to the release version or move the entries before tagging.',
    );
  }
}

function writeChecksums(): void {
  const assets = readdirSync(releaseDir)
    .filter((name) => name !== 'SHA256SUMS' && statSync(join(releaseDir, name)).isFile())
    .sort();

  writeFileSync(
    join(releaseDir, 'SHA256SUMS'),
    `${assets.map((name) => `${sha256(join(releaseDir, name))}  ${name}`).join('\n')}\n`,
    'utf8',
  );

  console.log(`\nRelease assets for ${target} ${version}:`);
  for (const name of [...assets, 'SHA256SUMS']) {
    console.log(`  ✓ dist/release/${name}`);
  }
  console.log();
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

if (target === 'vscode') {
  assertFile(vsixPath);
  copyFileSync(vsixPath, join(releaseDir, vsixName));

  const manifest = {
    schemaVersion: 2,
    name: 'inkstone',
    displayName: '墨观 Inkstone',
    license: rootPkg.license ?? 'MIT',
    repository: repoUrl(rootPkg),
    versions: { vscode: vscodeVersion },
    vscode: {
      id: `${vscodePkg.publisher}.${vscodePkg.name}`,
      version: vscodeVersion,
      archive: vsixName,
    },
  };
  writeFileSync(
    join(releaseDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  writeNotes();
  writeChecksums();
  process.exit(0);
}

zipCommand();

const ghosttyFiles = flavors.map(inkstoneThemeName);
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

for (const pair of DSH_PAIRS) {
  const packageDir = join(root, 'dist', 'dsh', dshPackageName(pair.id));
  assertFile(join(packageDir, 'package.json'));
  assertFile(join(packageDir, 'cordis.patch.yml'));
  assertFile(join(packageDir, 'lib', 'client.js'));

  // A drifted row id would install a package that never adds its Loader row.
  if (!readFileSync(join(packageDir, 'cordis.patch.yml'), 'utf8').includes(dshRowId(pair.id))) {
    fail(`${packageDir}/cordis.patch.yml is missing the ${dshRowId(pair.id)} row; run \`pnpm build\` first`);
  }
}

const menuPackageName = dshMenuPackageName();
const menuPackageDir = join(root, 'dist', 'dsh', menuPackageName);
assertFile(join(menuPackageDir, 'package.json'));
assertFile(join(menuPackageDir, 'cordis.patch.yml'));
assertFile(join(menuPackageDir, 'lib', 'client.js'));
if (!readFileSync(join(menuPackageDir, 'cordis.patch.yml'), 'utf8').includes(dshMenuRowId())) {
  fail(`${menuPackageDir}/cordis.patch.yml is missing the ${dshMenuRowId()} row; run \`pnpm build\` first`);
}

assertFile(vsixPath);

const ghosttyArchive = `inkstone-ghostty-${themeVersion}.zip`;
const kakuArchive = `inkstone-kaku-${themeVersion}.zip`;
const opencodeArchive = `inkstone-opencode-${themeVersion}.zip`;
const warpArchive = `inkstone-warp-${themeVersion}.zip`;
const zedArchive = `inkstone-zed-${themeVersion}.zip`;
const bundleArchive = `inkstone-${themeVersion}.zip`;

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

// DSH plugins ship as tarballs so `dsh plugin add file:<path>` works from one
// download; the generated package directories also go into the bundle below.
for (const pair of DSH_PAIRS) {
  const pkg = dshPackageName(pair.id);
  execFileSync('npm', ['pack', '--pack-destination', releaseDir, join(root, 'dist', 'dsh', pkg)], {
    stdio: 'inherit',
  });
  assertFile(join(releaseDir, dshTarballFileName(pkg, version)));
}
execFileSync('npm', ['pack', '--pack-destination', releaseDir, menuPackageDir], { stdio: 'inherit' });
assertFile(join(releaseDir, dshTarballFileName(menuPackageName, version)));

const themes: ThemeManifest[] = flavors.map((flavor) => ({
  id: flavor.meta.id,
  name: inkstoneThemeName(flavor),
  displayName: themeDisplayName(flavor),
  mode: flavor.meta.appearance,
  family: flavor.meta.family,
  files: {
    ghostty: inkstoneThemeName(flavor),
    kaku: kakuFileName(flavor),
    kakuToml: kakuTomlFileName(flavor),
    opencode: opencodeFileName(flavor),
    vscode: vscodeFileName(flavor),
    warp: warpFileName(flavor),
    zed: ZED_FILE_NAME,
  },
}));

const manifest = {
  schemaVersion: 2,
  name: 'inkstone',
  displayName: '墨观 Inkstone',
  version: themeVersion,
  versions: { themes: themeVersion, vscode: vscodeVersion },
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
    dsh: {
      menu: {
        name: menuPackageName,
        archive: dshTarballFileName(menuPackageName, version),
        themes: DSH_MENU_FLAVORS.map((flavor) => ({
          themeId: flavor.themeId,
          flavor: flavor.id,
          appearance: flavor.appearance,
        })),
      },
      packages: DSH_PAIRS.map((pair) => {
        const name = dshPackageName(pair.id);
        return {
          name,
          pair: [pair.light, pair.dark],
          archive: dshTarballFileName(name, version),
        };
      }),
      install: 'dsh plugin --profile web add file:<absolute-path>/inkstone-dsh-<version>.tgz',
      remove: 'dsh plugin --profile web remove inkstone-dsh',
    },
  },
  vscode: {
    id: `${vscodePkg.publisher}.${vscodePkg.name}`,
    version: vscodeVersion,
    archive: vsixName,
  },
  bundle: bundleArchive,
};

const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync(join(releaseDir, 'manifest.json'), manifestJson, 'utf8');

const dshVariantRows = [
  `| \`${menuPackageName}\` | 菜单版：宣纸 / 宣纸 Dimmed / 玄墨 / 玄墨 Dimmed / 沧海 / 青瓷（Settings → General 直接切换） |`,
  ...DSH_PAIRS.map((pair) => {
    const light = flavors.find((flavor) => flavor.meta.id === pair.light);
    const dark = flavors.find((flavor) => flavor.meta.id === pair.dark);
    if (!light || !dark) {
      fail(`DSH pair "${pair.id}" points at an unknown flavour; check src/targets/dsh.ts`);
    }
    return `| \`${dshPackageName(pair.id)}\` | ${dshDisplayName(light, dark)} |`;
  }),
].join('\n');

const installDoc = `# 墨观 Inkstone ${themeVersion}

This bundle contains every theme file for the ${themeVersion} release.
The machine-readable index is \`manifest.json\`.

The VS Code extension is versioned separately: this release ships
\`${vsixName}\` (extension ${vscodeVersion}), which may be older than ${themeVersion}.

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

## DeepSeek Harness (DSH)

Download \`inkstone-dsh-<version>.tgz\` (menu edition) and install it:

\`\`\`bash
dsh plugin --profile web add file:/absolute/path/to/inkstone-dsh-<version>.tgz
\`\`\`

Restart \`dsh web\`, then open **Settings → General** and pick 宣纸 / 宣纸 Dimmed /
玄墨 / 玄墨 Dimmed / 沧海 / 青瓷 from the Inkstone row; the choice applies
immediately and is remembered.
"跟随 DSH" hands control back to Appearance (Light → 宣纸, Dark → 玄墨). Remove
the plugin with:

\`\`\`bash
dsh plugin --profile web remove inkstone-dsh
\`\`\`

The two-variant pair packages are still available for Appearance-driven use;
install exactly one DSH theme package at a time because they all override the
same tokens, and any other DSH theme plugin (for example Catppuccin) is
mutually exclusive with them.

| Package | Variants |
| --- | --- |
${dshVariantRows}

The packages declare \`engines.dsh: ">=0.2.1-rc.3 <0.3.0"\`; a pre-release DSH
outside that range refuses the install. Terminal ANSI colours are chosen by the
terminal itself and are out of scope here.
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

for (const pair of DSH_PAIRS) {
  const pkg = dshPackageName(pair.id);
  cpSync(join(root, 'dist', 'dsh', pkg), join(stagingDir, 'dsh', pkg), { recursive: true });
}
cpSync(menuPackageDir, join(stagingDir, 'dsh', menuPackageName), { recursive: true });

writeFileSync(join(stagingDir, 'manifest.json'), manifestJson, 'utf8');
writeFileSync(join(stagingDir, 'INSTALL.md'), installDoc, 'utf8');
copyFileSync(join(root, 'LICENSE'), join(stagingDir, 'LICENSE'));
copyFileSync(join(root, 'CHANGELOG.md'), join(stagingDir, 'CHANGELOG.md'));

execFileSync(
  'zip',
  ['-r', '-X', '-q', join(releaseDir, bundleArchive), 'ghostty', 'kaku', 'opencode', 'warp', 'zed', 'dsh', 'manifest.json', 'INSTALL.md', 'LICENSE', 'CHANGELOG.md'],
  { cwd: stagingDir, stdio: 'inherit' },
);

rmSync(stagingDir, { recursive: true, force: true });

writeNotes();
writeChecksums();
