/**
 * Release version helpers.
 *
 * The repository ships two independently versioned release streams:
 *
 * - `themes`: the root package.json version, tagged `v<version>`. It covers the
 *   Ghostty / Kaku / OpenCode / Zed targets and the bundle.
 * - `vscode`: the `packages/vscode/package.json` version, tagged
 *   `vscode-v<version>`. The extension can stay on an older release while the
 *   palettes keep moving.
 *
 * `pnpm build` generates the theme JSON but never rewrites either manifest, so
 * the two versions can drift apart on purpose.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateVscode } from '../src/targets/vscode.ts';
import { readJson } from './packaging.ts';
import type { PackageJson } from './packaging.ts';

/** Repository root, with a trailing slash. */
export const root = fileURLToPath(new URL('..', import.meta.url));

export type ReleaseTarget = 'themes' | 'vscode';

export const VSCODE_TAG_PREFIX = 'vscode-';
export const VSCODE_CHANGELOG = join(root, 'packages', 'vscode', 'CHANGELOG.md');

export function readRootPkg(): PackageJson {
  return readJson<PackageJson>(join(root, 'package.json'));
}

export function readVscodePkg(): PackageJson {
  return readJson<PackageJson>(join(root, 'packages', 'vscode', 'package.json'));
}

/** Changelog that documents a release stream. */
export function changelogPath(target: ReleaseTarget): string {
  return target === 'vscode'
    ? VSCODE_CHANGELOG
    : join(root, 'CHANGELOG.md');
}

/** Release tag for a theme version, e.g. `v0.4.0`. */
export function releaseTag(version: string): string {
  return `v${version}`;
}

/** Release tag for a VS Code extension version, e.g. `vscode-v0.3.6`. */
export function vscodeReleaseTag(version: string): string {
  return `${VSCODE_TAG_PREFIX}v${version}`;
}

export function expectedReleaseTag(target: ReleaseTarget, version: string): string {
  return target === 'vscode' ? vscodeReleaseTag(version) : releaseTag(version);
}

/** Split a release tag into its stream and version; undefined for other tags. */
export function parseReleaseTag(
  tag: string,
): { target: ReleaseTarget; version: string } | undefined {
  const vscode = /^vscode-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag);
  if (vscode) return { target: 'vscode', version: vscode[1]! };

  const themes = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag);
  if (themes) return { target: 'themes', version: themes[1]! };

  return undefined;
}

export function assertTagMatchesVersion(
  tag: string,
  version: string,
  target: ReleaseTarget = 'themes',
): void {
  const expected = expectedReleaseTag(target, version);
  if (tag !== expected) {
    throw new Error(
      `tag ${tag} does not match ${target} version ${version} (expected ${expected})`,
    );
  }
}

/**
 * Committed files that `pnpm build` generates and that must stay in the tree.
 * Returns one message per file that is stale or missing.
 */
export function findGeneratedDrift(): string[] {
  const drift: string[] = [];

  for (const file of generateVscode()) {
    const path = join(root, file.path);
    if (!existsSync(path)) {
      drift.push(`${file.path} is missing`);
    } else if (readFileSync(path, 'utf8') !== file.content) {
      drift.push(`${file.path} is out of sync with the current palette`);
    }
  }

  return drift;
}
