#!/usr/bin/env tsx
/**
 * Package the VS Code extension with a version-aware output name.
 * Usage: pnpm package:vscode
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { readJson, vsixFileName } from './packaging.ts';
import type { PackageJson } from './packaging.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = readJson<PackageJson>(new URL('../packages/vscode/package.json', import.meta.url));
const vsix = vsixFileName(manifest);

mkdirSync(new URL('../dist', import.meta.url), { recursive: true });

execFileSync(
  'pnpm',
  ['dlx', '@vscode/vsce', 'package', '--no-dependencies', '--out', `../../dist/${vsix}`],
  { cwd: `${root}/packages/vscode`, stdio: 'inherit' },
);

console.log(`\nVSIX: dist/${vsix}`);
