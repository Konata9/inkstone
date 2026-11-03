/**
 * Compact 3×2 editor gallery for README and Marketplace screenshots.
 *
 * The HTML is rendered in memory by `capture.ts`; it is never written to disk.
 */

import { flavors, flavorName } from '../../src/palette/index.ts';
import type { Flavor } from '../../src/palette/types.ts';
import { cssVars, editorMock, editorStyles, galleryTsLines } from '../specimen.ts';

function galleryCard(f: Flavor): string {
  return `
  <article class="card" style="${cssVars(f)}">
    <header class="card-head">
      <h2>${f.meta.zh}<span>${flavorName(f, 'en')}</span></h2>
      <span class="card-tone">${f.meta.appearance === 'dark' ? 'DARK' : 'LIGHT'}${f.meta.dimmed ? ' · DIMMED' : ''}</span>
    </header>
    ${editorMock(f, { lines: galleryTsLines(f) })}
  </article>`;
}

/** Editor-only gallery captured by `pnpm capture:preview`. */
export function renderGallery(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>墨观 Inkstone · gallery</title>
<style>
  :root {
    --page-bg: #0e0d13;
    --page-fg: #e9e3d7;
    --page-dim: #8f8899;
    --serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
    --sans: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif;
    --mono: "JetBrains Mono", "SF Mono", "Cascadia Code", Menlo, monospace;
  }
  * { box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; }
  body {
    margin: 0;
    background: var(--page-bg);
    color: var(--page-fg);
    font-family: var(--sans);
  }
  .gallery {
    width: 1680px;
    margin: 0 auto;
    padding: 28px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }
  .card {
    background: var(--bg);
    color: var(--fg);
    border: 1px solid #262430;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 18px 48px rgba(0, 0, 0, .32);
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .card-head h2 {
    margin: 0;
    font-family: var(--serif);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: .04em;
  }
  .card-head h2 span {
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 400;
    color: var(--fg-3);
    letter-spacing: .06em;
    margin-left: 8px;
  }
  .card-tone {
    font-size: 10px;
    letter-spacing: .16em;
    color: var(--fg-3);
    white-space: nowrap;
  }
  .card .editor { border: 0; border-radius: 0; }
  .card .editor-body { grid-template-columns: 36px 108px 1fr; }
  .card .sidebar { font-size: 10px; padding: 8px 6px; }
  .card .code { font-size: 10.5px; line-height: 1.65; padding: 8px 0; }
  .card .ln { width: 32px; padding-right: 10px; }
  ${editorStyles()}
</style>
</head>
<body>
  <div class="gallery">
    ${flavors.map(galleryCard).join('\n')}
  </div>
</body>
</html>`;
}
