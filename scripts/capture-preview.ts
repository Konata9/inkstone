#!/usr/bin/env node
/**
 * Capture the editor-only gallery into docs/preview.png.
 *
 * Usage:
 *   pnpm build
 *   pnpm capture:preview
 *
 * Needs Playwright Chromium once:
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const galleryPath = join(root, 'preview', 'gallery.html');
const outputPath = join(root, 'docs', 'preview.png');

if (!existsSync(galleryPath)) {
  console.error('preview/gallery.html is missing; run `pnpm build` first.');
  process.exit(1);
}

let chromium: typeof import('playwright').chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'Playwright is required for screenshots.\n' +
      '  pnpm add -D playwright\n' +
      '  pnpm exec playwright install chromium',
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1736, height: 1200 },
  deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(galleryPath).href, { waitUntil: 'networkidle' });
const gallery = page.locator('.gallery');
await gallery.waitFor();
await gallery.screenshot({ path: outputPath, type: 'png' });
await browser.close();

const sizeKb = Math.round(statSync(outputPath).size / 1024);
console.log(`  ✓ docs/preview.png (${sizeKb} KB)`);
