/** Shared git helpers for the release scripts. */

import { execFileSync } from 'node:child_process';

import { root } from './versioning.ts';

export function git(...command: string[]): string {
  return execFileSync('git', command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function branchName(): string {
  return git('rev-parse', '--abbrev-ref', 'HEAD');
}

export function workingTreeStatus(): string {
  return git('status', '--porcelain');
}

export function localTagExists(tag: string): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

/** `undefined` when origin cannot be queried (offline or no remote). */
export function remoteTagExists(tag: string): boolean | undefined {
  try {
    return git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`).length > 0;
  } catch {
    return undefined;
  }
}
