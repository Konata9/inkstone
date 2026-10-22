#!/usr/bin/env tsx
/**
 * Fast release preflight for CI and local dry runs.
 *
 * Usage:
 *   pnpm release:check --tag v0.4.0
 *   pnpm release:check            # checks v<root package.json version>
 *
 * The release workflow runs this before building, so a mismatched tag fails in
 * seconds instead of after the whole build.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { argValue } from './args.ts';
import { hasUnreleasedEntries, hasVersionSection } from './changelog.ts';
import { findGeneratedDrift, readRootPkg, releaseTag, root } from './versioning.ts';

function fail(message: string): never {
  console.error(`\nRelease tag check failed: ${message}\n`);
  process.exit(1);
}

const version = String(readRootPkg().version);
const expected = releaseTag(version);
const tag = argValue('--tag', fail) ?? expected;

if (tag !== expected) {
  fail(
    `tag ${tag} does not match package.json version ${version} (expected ${expected})`,
  );
}

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
if (!hasVersionSection(changelog, version)) {
  console.warn(`  ! CHANGELOG.md has no "## ${version}" section; Release notes will be generated`);
}
if (hasUnreleasedEntries(changelog)) {
  console.warn(
    '  ! CHANGELOG.md still has "## Unreleased" entries; ' +
      `they will not appear in the ${version} Release notes`,
  );
}

const drift = findGeneratedDrift(version, changelog);
if (drift.length > 0) {
  fail(`${drift.join('; ')}. Run \`pnpm build\` and commit the generated files`);
}

console.log(`  ✓ tag ${tag} matches package.json version ${version}`);
console.log('  ✓ packages/vscode/package.json and CHANGELOG.md match the root files\n');
