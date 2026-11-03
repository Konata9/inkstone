#!/usr/bin/env tsx
/**
 * Validate release invariants and create the annotated release tag.
 *
 * Usage:
 *   pnpm release:tag                        # theme release, tag v<version>
 *   pnpm release:tag --target vscode        # extension release, tag vscode-v<version>
 *   pnpm release:tag --dry-run              # check only
 *   pnpm release:tag --force                # allow tagging a branch other than main
 *
 * Theme tags are `v<root package.json version>` and extension tags are
 * `vscode-v<packages/vscode version>`; each workflow packages only its own
 * stream with `--tag "$GITHUB_REF_NAME"`.
 */

import { readFileSync } from 'node:fs';

import { hasUnreleasedEntries, hasVersionSection } from './changelog.ts';
import { createFail, parseArgs } from './args.ts';
import type { Fail } from './args.ts';
import {
  branchName,
  git,
  localTagExists,
  remoteTagExists,
  workingTreeStatus,
} from './git.ts';
import {
  changelogLabel,
  changelogPath,
  expectedReleaseTag,
  findGeneratedDrift,
  readRootPkg,
  readVscodePkg,
} from './versioning.ts';
import type { ReleaseTarget } from './versioning.ts';

const fail: Fail = createFail('Release tag check failed');

function warn(message: string): void {
  console.warn(`  ! ${message}`);
}

const parsedArgs = parseArgs(
  process.argv.slice(2),
  { valueFlags: ['--target'], knownFlags: ['--dry-run', '--force'] },
  fail,
);
const dryRun = parsedArgs.flags.has('--dry-run');
const force = parsedArgs.flags.has('--force');
const targetArg = parsedArgs.values.get('--target');

const target: ReleaseTarget = (targetArg ?? 'themes') as ReleaseTarget;
if (target !== 'themes' && target !== 'vscode') {
  fail('--target must be "themes" or "vscode"');
}

const version = String(
  target === 'vscode' ? readVscodePkg().version : readRootPkg().version,
);
const tag = expectedReleaseTag(target, version);
const changelogLabelText = changelogLabel(target);

const status = workingTreeStatus();
if (status.length > 0) {
  fail(`the working tree is not clean; commit or stash these changes first:\n\n${status}`);
}

const branch = branchName();
if (branch !== 'main' && !force) {
  fail(`refusing to tag on branch "${branch}"; switch to main or pass --force`);
}

const changelog = readFileSync(changelogPath(target), 'utf8');
if (!hasVersionSection(changelog, version)) {
  fail(`${changelogLabelText} has no "## ${version}" section; rename "## Unreleased" or add one`);
}
if (hasUnreleasedEntries(changelog)) {
  fail(
    `${changelogLabelText} still has entries under "## Unreleased"; ` +
      'move them into the release section before tagging',
  );
}

if (localTagExists(tag)) {
  fail(`tag ${tag} already exists locally; bump the version or delete the old tag`);
}

const remoteTag = remoteTagExists(tag);
if (remoteTag === true) {
  fail(`tag ${tag} already exists on origin; bump the version instead of reusing it`);
}
if (remoteTag === undefined) {
  warn('could not query origin for existing tags; continuing (a push will still fail on a conflict)');
}

const drift = findGeneratedDrift();
if (drift.length > 0) {
  fail(`${drift.join('; ')}. Run \`pnpm build\` and commit the generated files`);
}

console.log(`  ✓ working tree clean, on ${branch}`);
console.log(`  ✓ ${changelogLabelText} has a ${version} section with no Unreleased entries`);
console.log('  ✓ generated files are in sync with the palette');
console.log(`  ✓ tag ${tag} is unused`);

if (dryRun) {
  console.log(`\nDry run: would create annotated tag ${tag}.\n`);
  process.exit(0);
}

git('tag', '-a', tag, '-m', `墨观 Inkstone ${target === 'vscode' ? 'VS Code ' : ''}${tag}`);

console.log(`\nCreated annotated tag ${tag}.`);
console.log('\nPush the release commit and tag together:\n');
console.log(`  git push origin ${branch}`);
console.log(`  git push origin ${tag}\n`);
