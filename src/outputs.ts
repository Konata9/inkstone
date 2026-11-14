/**
 * Every file `pnpm build` writes, in build order.
 *
 * The build and the release drift check share this list. Splitting it into
 * "committed" and "all" outputs keeps the drift check focused on the files that
 * live in the repository while the build still writes `dist/`.
 *
 * Showcase outputs (the product site, the palette reference and the README
 * screenshot) are not theme targets: they live under `showcase/` and are built
 * with `pnpm build:site`, `pnpm build:docs` and `pnpm capture:preview`.
 */

import { readFileSync } from 'node:fs';

import { generateDsh } from './targets/dsh.ts';
import { generateGhostty } from './targets/ghostty.ts';
import { generateKaku, generateKakuToml } from './targets/kaku.ts';
import { generateOpencode } from './targets/opencode.ts';
import { generateOrca } from './targets/orca.ts';
import { generateVscode } from './targets/vscode.ts';
import { generateZed } from './targets/zed.ts';

export interface GeneratedOutput {
  path: string;
  content: string;
  /** True when the build output is tracked in git and must stay in sync. */
  committed: boolean;
}

/** Root `LICENSE`, embedded verbatim in every generated DSH package. */
const licenseText = (): string => readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');

/** Files that are tracked in git; the release drift check reads this list. */
export function collectCommittedOutputs(version: string): GeneratedOutput[] {
  return generateVscode().map((file) => ({ ...file, committed: true }));
}

/** Everything `pnpm build` writes; text outputs only. */
export function collectAllOutputs(version: string): GeneratedOutput[] {
  return [
    ...generateVscode(),
    ...generateGhostty(),
    ...generateKaku(),
    ...generateKakuToml(),
    ...generateOpencode(),
    ...generateZed(version),
    ...generateDsh(version, licenseText()),
    ...generateOrca(version, licenseText()),
  ].map((file) => ({ ...file, committed: isCommitted(file.path) }));
}

function isCommitted(path: string): boolean {
  return path.startsWith('packages/vscode/themes/');
}
