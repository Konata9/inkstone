#!/usr/bin/env tsx
/**
 * One-command release: bump, build, commit, tag, push.
 *
 * Usage:
 *   pnpm release patch|minor|major|<x.y.z> [--target themes|vscode] [--no-push] [--dry-run] [--force]
 *
 * Requires a clean working tree on main and a non-empty `## Unreleased`
 * section in the target changelog. `themes` (the default) bumps the root
 * package.json and tags `v<version>`; `vscode` bumps
 * packages/vscode/package.json and tags `vscode-v<version>`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { hasUnreleasedEntries, hasVersionSection } from './changelog.ts';
import {
  branchName,
  git,
  localTagExists,
  remoteTagExists,
  workingTreeStatus,
} from './git.ts';
import { repoUrl } from './packaging.ts';
import {
  changelogPath,
  expectedReleaseTag,
  findGeneratedDrift,
  readRootPkg,
  readVscodePkg,
  root,
} from './versioning.ts';
import type { ReleaseTarget } from './versioning.ts';

const USAGE =
  'usage: pnpm release patch|minor|major|<x.y.z> [--target themes|vscode] [--no-push] [--dry-run] [--force]';
const KNOWN_FLAGS = new Set(['--dry-run', '--no-push', '--force', '--help']);

type Version = [number, number, number];

function fail(message: string): never {
  console.error(`\nRelease failed: ${message}\n`);
  process.exit(1);
}

function parseVersion(value: string): Version | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isNewer(next: Version, current: Version): boolean {
  const [major, minor, patch] = next;
  const [currentMajor, currentMinor, currentPatch] = current;
  if (major !== currentMajor) return major > currentMajor;
  if (minor !== currentMinor) return minor > currentMinor;
  return patch > currentPatch;
}

function resolveVersion(current: string, requested: string): string {
  const currentParts = parseVersion(current);
  if (!currentParts) fail(`package.json version ${current} is not x.y.z`);

  if (requested === 'patch' || requested === 'minor' || requested === 'major') {
    const [major, minor, patch] = currentParts;
    if (requested === 'major') return `${major + 1}.0.0`;
    if (requested === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  }

  const requestedParts = parseVersion(requested);
  if (!requestedParts) fail(`invalid version ${requested}\n${USAGE}`);
  if (!isNewer(requestedParts, currentParts)) {
    fail(`new version ${requested} must be greater than ${current}`);
  }

  return requested;
}

function run(command: string, commandArgs: string[]): void {
  execFileSync(command, commandArgs, { cwd: root, stdio: 'inherit' });
}

const args = process.argv.slice(2);
const flags = new Set<string>();
const positional: string[] = [];
let targetArg: string | undefined;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]!;
  if (arg === '--target') {
    targetArg = args[index + 1];
    if (!targetArg || targetArg.startsWith('--')) fail(`--target requires a value\n${USAGE}`);
    index += 1;
    continue;
  }
  if (arg.startsWith('--target=')) {
    targetArg = arg.slice('--target='.length);
    continue;
  }
  if (arg.startsWith('--')) flags.add(arg);
  else positional.push(arg);
}

for (const flag of flags) {
  if (!KNOWN_FLAGS.has(flag)) fail(`unknown option ${flag}\n${USAGE}`);
}

if (flags.has('--help')) {
  console.log(`\n${USAGE}\n`);
  process.exit(0);
}

const bump = positional[0];
if (!bump || positional.length > 1) fail(USAGE);

const target: ReleaseTarget = (targetArg ?? 'themes') as ReleaseTarget;
if (target !== 'themes' && target !== 'vscode') {
  fail(`--target must be "themes" or "vscode"\n${USAGE}`);
}

const dryRun = flags.has('--dry-run');
const noPush = flags.has('--no-push');
const force = flags.has('--force');

const pkg = target === 'vscode' ? readVscodePkg() : readRootPkg();
const pkgPath =
  target === 'vscode' ? join(root, 'packages', 'vscode', 'package.json') : join(root, 'package.json');
const pkgLabel = target === 'vscode' ? 'packages/vscode/package.json' : 'package.json';
const changelogFile = changelogPath(target);
const changelogLabel = target === 'vscode' ? 'packages/vscode/CHANGELOG.md' : 'CHANGELOG.md';

const current = String(pkg.version);
const next = resolveVersion(current, bump);
const tag = expectedReleaseTag(target, next);

const status = workingTreeStatus();
if (status.length > 0) {
  fail(`the working tree is not clean; commit or stash these changes first:\n\n${status}`);
}

const branch = branchName();
if (branch !== 'main' && !force) {
  fail(`refusing to release from branch "${branch}"; switch to main or pass --force`);
}

if (localTagExists(tag)) {
  fail(`tag ${tag} already exists locally; pick a different version`);
}
const remoteTag = remoteTagExists(tag);
if (remoteTag === true) {
  fail(`tag ${tag} already exists on origin; pick a different version`);
}
if (remoteTag === undefined) {
  console.warn('  ! could not query origin for existing tags; continuing');
}

const changelog = readFileSync(changelogFile, 'utf8');
if (!/^##\s+Unreleased\s*$/m.test(changelog)) {
  fail(`${changelogLabel} has no "## Unreleased" section; add release notes first`);
}
if (!hasUnreleasedEntries(changelog)) {
  fail(`${changelogLabel} "## Unreleased" section is empty; add release notes first`);
}
if (hasVersionSection(changelog, next)) {
  fail(`${changelogLabel} already has a "## ${next}" section`);
}
const nextChangelog = changelog.replace(/^##\s+Unreleased\s*$/m, `## ${next}`);

if (dryRun) {
  console.log(`\nWould release ${target} ${current} -> ${next}`);
  console.log(`  • ${pkgLabel}: ${current} -> ${next}`);
  console.log(`  • ${changelogLabel}: "## Unreleased" -> "## ${next}"`);
  console.log(`  • build + typecheck, commit "chore: release ${tag}", tag ${tag}`);
  console.log(noPush ? '  • no push (--no-push)' : `  • push origin ${branch} and ${tag}`);
  console.log('\nDry run: no files changed.\n');
  process.exit(0);
}

writeFileSync(pkgPath, `${JSON.stringify({ ...pkg, version: next }, null, 2)}\n`, 'utf8');
writeFileSync(changelogFile, nextChangelog, 'utf8');

try {
  run('pnpm', ['build']);
  run('pnpm', ['typecheck']);
  const drift = findGeneratedDrift();
  if (drift.length > 0) throw new Error(drift.join('; '));
} catch (error) {
  git('restore', '--source=HEAD', '--staged', '--worktree', '--', '.');
  fail(`${(error as Error).message}\nRolled back the version and changelog changes.`);
}

try {
  git('add', '-A');
  git('commit', '-m', `chore: release ${tag}`);
} catch (error) {
  fail(
    `git commit failed: ${(error as Error).message}\n` +
      'The version bump and build output are left in the working tree.',
  );
}

try {
  git('tag', '-a', tag, '-m', `墨观 Inkstone ${target === 'vscode' ? 'VS Code ' : ''}${tag}`);
} catch (error) {
  fail(
    `git tag failed: ${(error as Error).message}\n` +
      'The release commit exists; fix the problem and run `pnpm release:tag`.',
  );
}

if (!noPush) {
  try {
    git('push', 'origin', branch);
    git('push', 'origin', tag);
  } catch (error) {
    console.error(`\nRelease failed: push failed: ${(error as Error).message}\n`);
    console.error('The commit and tag exist locally. Push them with:');
    console.error(`  git push origin ${branch}`);
    console.error(`  git push origin ${tag}\n`);
    process.exit(1);
  }
}

console.log(`\nReleased ${tag}.`);
if (noPush) {
  console.log('\nTag created locally. Push with:');
  console.log(`  git push origin ${branch}`);
  console.log(`  git push origin ${tag}\n`);
} else {
  console.log(`GitHub Actions is building the release: ${repoUrl(pkg)}/releases/tag/${tag}\n`);
}
