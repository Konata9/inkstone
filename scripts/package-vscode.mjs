#!/usr/bin/env node
/**
 * Package the VS Code extension with a version-aware output name.
 * Usage: pnpm package:vscode
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(new URL('../packages/vscode/package.json', import.meta.url), 'utf8'));
const out = `../../dist/${manifest.publisher}.${manifest.name}-${manifest.version}.vsix`;

mkdirSync(new URL('../dist', import.meta.url), { recursive: true });

execFileSync(
  'pnpm',
  ['dlx', '@vscode/vsce', 'package', '--no-dependencies', '--out', out],
  { cwd: `${root}/packages/vscode`, stdio: 'inherit' },
);

console.log(`\nVSIX: dist/${manifest.publisher}.${manifest.name}-${manifest.version}.vsix`);
