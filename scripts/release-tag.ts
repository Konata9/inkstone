#!/usr/bin/env tsx
/**
 * Validate release invariants and create the annotated release tag.
 *
 * Usage:
 *   pnpm release:tag            # check, then `git tag -a v<version>`
 *   pnpm release:tag --dry-run  # check only
 *   pnpm release:tag --force    # allow tagging a branch other than main
 *
 * The root package.json version is the source of truth; the tag name must be
 * `v<version>` because the release workflow packages with
 * `--tag "$GITHUB_REF_NAME"`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { hasUnreleasedEntries, hasVersionSection } from './changelog.ts';
import { findGeneratedDrift, readRootPkg, releaseTag, root } from './versioning.ts';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

function fail(message: string): never {
  console.error(`\nRelease tag check failed: ${message}\n`);
  process.exit(1);
}

function git(...command: string[]): string {
  return execFileSync('git', command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function warn(message: string): void {
  console.warn(`  ! ${message}`);
}

const version = String(readRootPkg().version);
const tag = releaseTag(version);

const status = git('status', '--porcelain');
if (status.length > 0) {
  fail(`the working tree is not clean; commit or stash these changes first:\n\n${status}`);
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main' && !force) {
  fail(`refusing to tag on branch "${branch}"; switch to main or pass --force`);
}

const changelogPath = join(root, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf8');
if (!hasVersionSection(changelog, version)) {
  fail(`CHANGELOG.md has no "## ${version}" section; rename "## Unreleased" or add one`);
}
if (hasUnreleasedEntries(changelog)) {
  fail(
    'CHANGELOG.md still has entries under "## Unreleased"; ' +
      'move them into the release section before tagging',
  );
}

let localTagExists = false;
try {
  git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
  localTagExists = true;
} catch {
  // Expected: the tag does not exist yet.
}
if (localTagExists) {
  fail(`tag ${tag} already exists locally; bump the version or delete the old tag`);
}

try {
  const remoteTag = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`);
  if (remoteTag.length > 0) {
    fail(`tag ${tag} already exists on origin; bump the version instead of reusing it`);
  }
} catch {
  warn('could not query origin for existing tags; continuing (a push will still fail on a conflict)');
}

const drift = findGeneratedDrift(version, changelog);
if (drift.length > 0) {
  fail(`${drift.join('; ')}. Run \`pnpm build\` and commit the generated files`);
}

console.log(`  ✓ working tree clean, on ${branch}`);
console.log(`  ✓ CHANGELOG.md has a ${version} section with no Unreleased entries`);
console.log('  ✓ packages/vscode/package.json and CHANGELOG.md match the root files');
console.log(`  ✓ tag ${tag} is unused`);

if (dryRun) {
  console.log(`\nDry run: would create annotated tag ${tag}.\n`);
  process.exit(0);
}

git('tag', '-a', tag, '-m', `墨观 Inkstone ${tag}`);

console.log(`\nCreated annotated tag ${tag}.`);
console.log('\nPush the release commit and tag together:\n');
console.log(`  git push origin ${branch}`);
console.log(`  git push origin ${tag}\n`);
