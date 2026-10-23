/**
 * Helpers shared by the VSIX and release packagers.
 *
 * Both scripts read the same manifests and need the same VSIX asset name, so
 * the naming rule lives here instead of being spelled out twice.
 */

import { readFileSync } from 'node:fs';

export interface PackageJson {
  name: string;
  version: string;
  publisher?: string;
  license?: string;
  repository?: {
    type?: string;
    url?: string;
  };
}

export function readJson<T>(path: string | URL): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Web URL for the repository, accepting the usual git remote spellings. */
export function repoUrl(pkg: PackageJson): string {
  const raw = pkg.repository?.url ?? 'https://github.com/Konata9/inkstone';
  return raw
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git@github\.com:/, 'https://github.com/');
}

/** VSIX asset name, e.g. `Konata9.inkstone-0.3.2.vsix`. */
export function vsixFileName(pkg: PackageJson): string {
  if (!pkg.publisher) throw new Error(`${pkg.name} has no publisher; cannot name the VSIX`);
  return `${pkg.publisher}.${pkg.name}-${pkg.version}.vsix`;
}
