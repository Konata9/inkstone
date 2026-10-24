/**
 * Product site generator.
 *
 * Renders `templates/site/page.liquid` (LiquidJS) into static HTML under site/
 * for GitHub Pages. The template owns structure, CSS and client script; this
 * module only supplies locale copy, version, support lists, flavor
 * tokens/panels and SEO companions so the site cannot drift from the six
 * flavor palettes.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { Liquid } from 'liquidjs';

import { flavors, flavorName } from '../palette/index.ts';
import {
  accents,
  cssVars,
  editorMock,
  editorStyles,
  galleryTsLines,
  surfaces,
} from './preview.ts';
import { siteCopy, type SiteLocale } from './site-copy.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const templateRoot = join(root, 'templates', 'site');

/** Public origin for canonical / hreflang / sitemap. Change when a custom domain is attached. */
export const SITE_ORIGIN = 'https://konata9.github.io/inkstone';

/** Favicon source copied into `site/` by the build step. */
export const SITE_FAVICON_SOURCE = join(root, 'packages', 'vscode', 'icon.png');

const RELEASES_URL = 'https://github.com/Konata9/inkstone/releases';
const REPO_URL = 'https://github.com/Konata9/inkstone';
const STORAGE_KEY = 'inkstone.site.flavor';

const EDITORS = [
  { id: 'vscode', label: 'VS Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'vscodium', label: 'VSCodium' },
] as const;

const TERMINALS = [
  { id: 'ghostty', label: 'Ghostty' },
  { id: 'wezterm', label: 'Kaku / WezTerm' },
  { id: 'opencode', label: 'OpenCode' },
] as const;

const CHIPS = ['526 zhongguose', '6 variants', '872 contrast checks', 'Konata9.inkstone'];

const engine = new Liquid({
  root: templateRoot,
  partials: join(templateRoot, 'snippets'),
  extname: '.liquid',
  cache: false,
  strictVariables: true,
  strictFilters: true,
});

/** Template assets are stable for the life of one `pnpm build` process. */
const stylesCss = readFileSync(join(templateRoot, 'styles.css'), 'utf8');
const appJs = readFileSync(join(templateRoot, 'app.js'), 'utf8');
const sharedEditorStyles = editorStyles();
const flavorTokens = flavors.map((f) => `html[data-flavor="${f.meta.id}"]{${cssVars(f)}}`).join('\n');

export interface GeneratedSiteFile {
  path: string;
  content: string;
}

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };
  return pkg.version;
}

/** One flavor row shared by the rail, hero stage, and specimen panels. */
function buildFlavors(locale: SiteLocale) {
  return flavors.map((f) => {
    const zh = flavorName(f, 'zh');
    const en = flavorName(f, 'en');
    const primary = locale === 'zh' ? zh : en;
    const secondary = locale === 'zh' ? en : zh;
    return {
      id: f.meta.id,
      label: primary,
      sub: secondary,
      name: primary,
      description: f.meta.description[locale],
      // Locked chip colors: stay on this flavor even when the page chrome switches.
      chipBg: f.surface.base,
      chipAlt: f.surface.alt,
      chipActive: f.surface.active,
      chipFg: f.text.primary,
      chipMuted: f.text.secondary,
      chipBorder: f.border.normal,
      chipBorderStrong: f.border.strong,
      chipAccent: f.syntax.keyword,
      chipAction: f.action,
      surfacesHtml: surfaces(f),
      accentsHtml: accents(f),
      editorHtml: editorMock(f, { lines: galleryTsLines(f) }),
    };
  });
}

function pageContext(locale: SiteLocale, version: string) {
  const copy = siteCopy[locale];
  const isEn = locale === 'en';
  const canonical = isEn ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/zh/`;
  const pageFlavors = buildFlavors(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Inkstone',
    alternateName: '墨观',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'VS Code 1.85+, Cursor, Windsurf, VSCodium, Ghostty, WezTerm, OpenCode',
    description: copy.description,
    url: canonical,
    downloadUrl: RELEASES_URL,
    softwareVersion: version,
    license: 'https://opensource.org/licenses/MIT',
    author: {
      '@type': 'Person',
      name: 'Konata9',
      url: 'https://github.com/Konata9',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  const siteConfig = {
    storageKey: STORAGE_KEY,
    flavorIds: flavors.map((f) => f.meta.id),
    appearance: Object.fromEntries(flavors.map((f) => [f.meta.id, f.meta.appearance])),
    defaultDark: 'xuanmo',
    defaultLight: 'xuanzhi',
    softRedirectZh: isEn ? './zh/' : null,
  };

  return {
    locale,
    copy,
    version,
    origin: SITE_ORIGIN,
    canonical,
    home: isEn ? './' : '../',
    ogImage: `${SITE_ORIGIN}/og.jpg`,
    ogLocaleAlternate: isEn ? 'zh_CN' : 'en_US',
    langHrefEn: isEn ? './' : '../',
    langHrefZh: isEn ? './zh/' : './',
    releasesUrl: RELEASES_URL,
    repoUrl: REPO_URL,
    paletteUrl: `${REPO_URL}/blob/main/docs/palette.md`,
    editors: [...EDITORS],
    terminals: [...TERMINALS],
    chips: CHIPS,
    flavors: pageFlavors,
    flavorTokens,
    stylesCss,
    editorStyles: sharedEditorStyles,
    appJs,
    jsonLdJson: JSON.stringify(jsonLd),
    siteConfigJson: JSON.stringify(siteConfig),
  };
}

function renderPage(locale: SiteLocale, version: string): string {
  const html = engine.renderFileSync('page', pageContext(locale, version));
  if (typeof html !== 'string' || !html) {
    throw new Error(`Liquid failed to render site page for locale "${locale}"`);
  }
  return html;
}

function robotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

function sitemapAlternates(): string {
  return `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/"/>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${SITE_ORIGIN}/zh/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/"/>`;
}

function sitemapXml(): string {
  const today = new Date().toISOString().slice(0, 10);
  const alternates = sitemapAlternates();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${SITE_ORIGIN}/</loc>
    <lastmod>${today}</lastmod>
${alternates}
  </url>
  <url>
    <loc>${SITE_ORIGIN}/zh/</loc>
    <lastmod>${today}</lastmod>
${alternates}
  </url>
</urlset>
`;
}

function llmsTxt(version: string): string {
  return `# Inkstone (墨观)

> Traditional Chinese color themes for editors and terminals, built from the 526-color zhongguose palette.

- Version: ${version}
- Extension ID: Konata9.inkstone
- License: MIT
- Site: ${SITE_ORIGIN}/
- Chinese: ${SITE_ORIGIN}/zh/
- Source: ${REPO_URL}
- Releases: ${RELEASES_URL}
- Full summary: ${SITE_ORIGIN}/llms-full.txt

## Variants

| Id | Chinese | English | Appearance |
| --- | --- | --- | --- |
${flavors
  .map(
    (f) =>
      `| ${f.meta.id} | ${flavorName(f, 'zh')} | ${flavorName(f, 'en')} | ${f.meta.appearance} |`,
  )
  .join('\n')}

## Platforms

- Editors: VS Code, Cursor, Windsurf, VSCodium
- Terminals: Ghostty, Kaku / WezTerm
- Also: OpenCode V2 themes

## Install

Download \`Konata9.inkstone-<version>.vsix\` (and terminal archives) from GitHub Releases.
`;
}

function llmsFullTxt(version: string): string {
  return `# Inkstone (墨观) — full summary for assistants

Version ${version}. MIT. Publisher Konata9. Extension ID \`Konata9.inkstone\`.

## Overview

Inkstone is a traditional Chinese color theme family. Colours are taken from the
526-entry zhongguose chart (and the matching Figma community chart). Six
variants share one hue skeleton (cinnabar → blue → green → ochre → violet →
cyan → crimson). Switching variants changes light and saturation, not the hue
order.

Families:

- **Ink & paper** — 玄墨 Xuanmo, 玄墨 Dimmed, 宣纸 Xuanzhi, 宣纸 Dimmed
- **Sea & celadon** — 沧海 Canghai, 青瓷 Qingci

Dimmed variants lower ambient light while keeping body text ≥ 10.5:1 and
pigments recognisable. The build runs 872 contrast and chroma checks.

## Features

- Full VS Code / Cursor workbench colors, TextMate scopes, semantic tokens
- Matching terminal ANSI palettes (Ghostty, Kaku / WezTerm)
- OpenCode V2 theme JSON for all six flavors
- Cursor-specific: \`contrastActiveBorder\` is transparent so editor tabs are not outlined

## Install

1. Open ${RELEASES_URL}
2. Download \`Konata9.inkstone-<version>.vsix\`
3. \`code --install-extension Konata9.inkstone-<version>.vsix\` (or Cursor / VSCodium equivalent)
4. Preferences: Color Theme → pick a 墨观 / Inkstone variant

Terminal themes: use the Ghostty / Kaku zip assets from the same release, or
\`pnpm install:ghostty\` / \`pnpm install:kaku\` / \`pnpm install:opencode\` from source.

## Comparison notes

- Not a generic dark/light pair: six curated rooms on one skeleton
- Keywords use annotation reds (朱批) on ink/paper; sea/celadon uses seal-like reds on glaze
- Cursor color is a cool interaction blue, not the keyword red

## Links

- Site (EN): ${SITE_ORIGIN}/
- Site (ZH): ${SITE_ORIGIN}/zh/
- Palette reference: ${REPO_URL}/blob/main/docs/palette.md
- Changelog: ${REPO_URL}/blob/main/CHANGELOG.md
- Issues: ${REPO_URL}/issues
`;
}

/** All text files for the static site (HTML + SEO companions). */
export function generateSite(): GeneratedSiteFile[] {
  const version = readVersion();
  return [
    { path: 'site/index.html', content: renderPage('en', version) },
    { path: 'site/zh/index.html', content: renderPage('zh', version) },
    { path: 'site/robots.txt', content: robotsTxt() },
    { path: 'site/sitemap.xml', content: sitemapXml() },
    { path: 'site/llms.txt', content: llmsTxt(version) },
    { path: 'site/llms-full.txt', content: llmsFullTxt(version) },
  ];
}
