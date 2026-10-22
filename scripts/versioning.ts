/**
 * Release version helpers.
 *
 * The root package.json is the single source of truth for the release version.
 * `pnpm build` copies the version and the changelog into `packages/vscode`, and
 * `scripts/package-vscode.ts` injects the version again while packaging so the
 * VSIX can never disagree with the tag.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJson } from './packaging.ts';
import type { PackageJson } from './packaging.ts';

/** Repository root, with a trailing slash. */
export const root = fileURLToPath(new URL('..', import.meta.url));

export function readRootPkg(): PackageJson {
  return readJson<PackageJson>(join(root, 'package.json'));
}

export function readVscodePkg(): PackageJson {
  return readJson<PackageJson>(join(root, 'packages', 'vscode', 'package.json'));
}

/** Release tag for a version, e.g. `v0.4.0`. */
export function releaseTag(version: string): string {
  return `v${version}`;
}

export function assertTagMatchesVersion(tag: string, version: string): void {
  const expected = releaseTag(version);
  if (tag !== expected) {
    throw new Error(`tag ${tag} does not match package version ${expected}`);
  }
}

/**
 * Committed files that `pnpm build` generates from the root manifest and
 * changelog. Returns one message per file that is stale or missing.
 */
export function findGeneratedDrift(version: string, rootChangelog: string): string[] {
  const drift: string[] = [];

  const vscodeVersion = String(readVscodePkg().version);
  if (vscodeVersion !== version) {
    drift.push(`packages/vscode/package.json is ${vscodeVersion}, expected ${version}`);
  }

  const generatedChangelogPath = join(root, 'packages', 'vscode', 'CHANGELOG.md');
  if (!existsSync(generatedChangelogPath)) {
    drift.push('packages/vscode/CHANGELOG.md is missing');
  } else if (readFileSync(generatedChangelogPath, 'utf8') !== rootChangelog) {
    drift.push('packages/vscode/CHANGELOG.md is out of sync with CHANGELOG.md');
  }

  return drift;
}
