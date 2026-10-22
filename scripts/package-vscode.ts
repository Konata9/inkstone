#!/usr/bin/env tsx
/**
 * Package the VS Code extension with a version-aware output name.
 * Usage: pnpm package:vscode
 *
 * The VSIX manifest version is injected from the root package.json and the
 * committed file is restored afterwards, so the extension version can never
 * drift from the release version.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { vsixFileName } from './packaging.ts';
import type { PackageJson } from './packaging.ts';
import { readRootPkg, root } from './versioning.ts';

const manifestPath = join(root, 'packages', 'vscode', 'package.json');
const original = readFileSync(manifestPath, 'utf8');
const version = readRootPkg().version;
const manifest: PackageJson = { ...(JSON.parse(original) as PackageJson), version };
const vsix = vsixFileName(manifest);

mkdirSync(join(root, 'dist'), { recursive: true });

try {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  execFileSync(
    'pnpm',
    ['dlx', '@vscode/vsce', 'package', '--no-dependencies', '--out', `../../dist/${vsix}`],
    { cwd: join(root, 'packages', 'vscode'), stdio: 'inherit' },
  );
} finally {
  writeFileSync(manifestPath, original, 'utf8');
}

console.log(`\nVSIX: dist/${vsix} (version ${version} from package.json)`);
