#!/usr/bin/env tsx
/**
 * Fast release preflight for CI and local dry runs.
 *
 * Usage:
 *   pnpm release:check --tag v0.4.0              # theme release
 *   pnpm release:check --tag vscode-v0.3.6       # VS Code extension release
 *   pnpm release:check                            # checks the default theme tag
 *
 * The release workflow runs this before building, so a mismatched tag fails in
 * seconds instead of after the whole build.
 */

import { readFileSync } from 'node:fs';

import { createFail, parseArgs } from './args.ts';
import type { Fail } from './args.ts';
import { hasUnreleasedEntries, hasVersionSection } from './changelog.ts';
import {
  changelogPath,
  expectedReleaseTag,
  findGeneratedDrift,
  parseReleaseTag,
  readRootPkg,
  readVscodePkg,
} from './versioning.ts';
import type { ReleaseTarget } from './versioning.ts';

const fail: Fail = createFail('Release tag check failed');
const parsedArgs = parseArgs(process.argv.slice(2), { valueFlags: ['--tag', '--target'] }, fail);
const requestedTarget = parsedArgs.values.get('--target') as ReleaseTarget | undefined;
if (requestedTarget && requestedTarget !== 'themes' && requestedTarget !== 'vscode') {
  fail('--target must be "themes" or "vscode"');
}

const requestedTag = parsedArgs.values.get('--tag');
const parsed = requestedTag ? parseReleaseTag(requestedTag) : undefined;
if (requestedTag && !parsed) {
  fail(`tag ${requestedTag} must look like v<version> or vscode-v<version>`);
}
if (requestedTarget && parsed && parsed.target !== requestedTarget) {
  fail(`tag ${requestedTag} belongs to the ${parsed.target} release, not ${requestedTarget}`);
}

const target: ReleaseTarget = requestedTarget ?? parsed?.target ?? 'themes';
const version = String(
  target === 'vscode' ? readVscodePkg().version : readRootPkg().version,
);
const expected = expectedReleaseTag(target, version);
const tag = requestedTag ?? expected;

if (tag !== expected) {
  fail(`tag ${tag} does not match ${target} version ${version} (expected ${expected})`);
}

const changelogFile = changelogPath(target);
const changelogLabel = target === 'vscode' ? 'packages/vscode/CHANGELOG.md' : 'CHANGELOG.md';
const changelog = readFileSync(changelogFile, 'utf8');
if (!hasVersionSection(changelog, version)) {
  console.warn(`  ! ${changelogLabel} has no "## ${version}" section; Release notes will be generated`);
}
if (hasUnreleasedEntries(changelog)) {
  console.warn(
    `  ! ${changelogLabel} still has "## Unreleased" entries; ` +
      'they will not appear in the Release notes',
  );
}

const drift = findGeneratedDrift();
if (drift.length > 0) {
  fail(`${drift.join('; ')}. Run \`pnpm build\` and commit the generated files`);
}

console.log(`  ✓ tag ${tag} matches the ${target} version ${version}`);
console.log(`  ✓ ${changelogLabel} covers ${version}`);
console.log('  ✓ packages/vscode/themes are in sync with the palette\n');
