/**
 * docs/README.md — the documentation home.
 */

import { docsIndex as render } from './shared.ts';

export function renderDocsIndex(): string {
  return render();
}
