#!/usr/bin/env tsx
/**
 * Package the VS Code extension with its own version.
 * Usage: pnpm package:vscode
 *
 * The extension version lives in `packages/vscode/package.json`; it is
 * independent from the root package version and from the theme release tags.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { readJson, vsixFileName } from './packaging.ts';
import type { PackageJson } from './packaging.ts';
import { root } from './versioning.ts';

const manifestPath = join(root, 'packages', 'vscode', 'package.json');
const manifest = readJson<PackageJson>(manifestPath);
const vsix = vsixFileName(manifest);

mkdirSync(join(root, 'dist'), { recursive: true });

execFileSync(
  'pnpm',
  ['dlx', '@vscode/vsce', 'package', '--no-dependencies', '--out', `../../dist/${vsix}`],
  { cwd: join(root, 'packages', 'vscode'), stdio: 'inherit' },
);

console.log(`\nVSIX: dist/${vsix} (version ${manifest.version} from packages/vscode/package.json)`);
