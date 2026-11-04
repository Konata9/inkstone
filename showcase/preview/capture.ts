#!/usr/bin/env node
/**
 * Capture the editor-only gallery into docs/preview.png.
 *
 *   pnpm capture:preview
 *
 * The gallery HTML is rendered in memory and handed straight to Playwright, so
 * no intermediate page is written to disk.
 *
 * Needs Playwright Chromium once:
 *   pnpm exec playwright install chromium
 */

import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { renderGallery } from './gallery.ts';

const outputPath = fileURLToPath(new URL('../../docs/preview.png', import.meta.url));

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

await page.setContent(renderGallery(), { waitUntil: 'networkidle' });
const gallery = page.locator('.gallery');
await gallery.waitFor();
await gallery.screenshot({ path: outputPath, type: 'png' });
await browser.close();

const sizeKb = Math.round(statSync(outputPath).size / 1024);
console.log(`  ✓ docs/preview.png (${sizeKb} KB)`);
