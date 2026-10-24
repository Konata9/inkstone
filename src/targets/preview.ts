/**
 * Static preview pages.
 *
 * Everything is inlined: no fonts, no scripts from the network, no build step
 * in the browser.
 *
 * - `preview/index.html` — full compare page (surfaces, pigments, editor,
 *   terminal, diff, Markdown).
 * - `preview/gallery.html` — editor-only 3×2 grid for README / Marketplace
 *   screenshots (`docs/preview.png`).
 */

import { alpha, contrast, formatRatio, luminance } from '../color.ts';
import { colorLabel, nameOf } from '../palette/data.ts';
import { actionHover, flavorFamilies, flavors, flavorName } from '../palette/index.ts';
import { syntaxLabels } from '../palette/labels.ts';
import type { Flavor } from '../palette/types.ts';
import { ANSI_NAMES } from '../palette/types.ts';

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function cssVars(f: Flavor): string {
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  const y = f.syntax;
  const dark = f.meta.appearance === 'dark';
  return [
    `--bg:${s.base}`,
    `--bg-alt:${s.alt}`,
    `--activity:${dark ? s.sunken : s.raised}`,
    `--bg-sunken:${s.sunken}`,
    `--sel:${s.selection}`,
    `--active:${s.active}`,
    `--border:${b.normal}`,
    `--border-subtle:${b.subtle}`,
    `--border-strong:${b.strong}`,
    `--fg:${t.primary}`,
    `--fg-2:${t.secondary}`,
    `--fg-3:${t.muted}`,
    `--fg-4:${t.faint}`,
    `--cursor:${t.cursor}`,
    `--action:${f.action}`,
    `--action-hover:${actionHover(f)}`,
    `--kw:${y.keyword}`,
    `--fn:${y.function}`,
    `--str:${y.string}`,
    `--num:${y.number}`,
    `--type:${y.type}`,
    `--cm:${y.comment}`,
    `--dec:${y.decorator}`,
    `--var:${y.variable}`,
    `--param:${y.parameter}`,
    `--prop:${y.property}`,
    // Only the ANSI slots the terminal mock styles reference.
    ...[1, 2, 3, 4, 5, 6].map((index) => `--ansi-${index}:${f.ansi[index]}`),
    `--diff-add:${alpha(y.string, dark ? 0.15 : 0.13)}`,
    `--diff-del:${alpha(y.invalid, dark ? 0.15 : 0.12)}`,
    `--lens:${dark ? 'rgba(255,255,255,0.06)' : 'rgba(43,39,35,0.05)'}`,
  ].join(';');
}

/* ------------------------------------------------------------------ */
/* Code samples                                                        */
/* ------------------------------------------------------------------ */

const tsLines = (f: Flavor) => [
  '<span class="cm">// 墨观 Inkstone · 把传统色写进代码</span>',
  '<span class="kw">import</span> { <span class="fn">named</span> } <span class="kw">from</span> <span class="str">"./palette"</span>;',
  '',
  '<span class="kw">interface</span> <span class="type">Ink</span> {',
  '  <span class="prop">name</span>: <span class="type">string</span>;',
  '  <span class="prop">hex</span>: <span class="str">`#${string}`</span>;',
  '}',
  '',
  '<span class="kw">const</span> <span class="var">墨色</span>: <span class="type">Ink</span> = {',
  `  <span class="prop">name</span>: <span class="str">"${f.meta.zh}"</span>, <span class="prop">hex</span>: <span class="str">"${f.surface.base}"</span>,`,
  '};',
  '',
  '<span class="cm">/** 计算 WCAG 对比度 */</span>',
  '<span class="kw">export function</span> <span class="fn">contrast</span>(<span class="param">a</span>: <span class="type">Ink</span>, <span class="param">b</span>: <span class="type">Ink</span>): <span class="type">number</span> {',
  '  <span class="kw">const</span> <span class="fn">lum</span> = (<span class="param">c</span>: <span class="type">Ink</span>) =&gt; {',
  '    <span class="kw">const</span> [<span class="var">r</span>, <span class="var">g</span>, <span class="var">b</span>] = [<span class="num">0</span>, <span class="num">1</span>, <span class="num">2</span>].<span class="fn">map</span>((<span class="param">i</span>) =&gt; <span class="fn">channel</span>(c.hex, i));',
  '    <span class="kw">return</span> <span class="num">0.2126</span> * r + <span class="num">0.7152</span> * g + <span class="num">0.0722</span> * b;',
  '  };',
  '  <span class="kw">const</span> [<span class="var">hi</span>, <span class="var">lo</span>] = [<span class="fn">lum</span>(a), <span class="fn">lum</span>(b)].<span class="fn">sort</span>((<span class="param">x</span>, <span class="param">y</span>) =&gt; y - x);',
  '  <span class="kw">return</span> (hi + <span class="num">0.05</span>) / (lo + <span class="num">0.05</span>);',
  '}',
  '',
  '<span class="kw">export class</span> <span class="type">Palette</span> {',
  '  <span class="dec">@readonly</span> <span class="var">#inks</span> = <span class="kw">new</span> <span class="type">Map</span>&lt;<span class="type">string</span>, <span class="type">Ink</span>&gt;();',
  '  <span class="kw">constructor</span>(<span class="kw">readonly</span> <span class="prop">name</span> = <span class="str">"墨观"</span>) {}',
  '',
  '  <span class="kw">get</span> <span class="fn">count</span>(): <span class="type">number</span> {',
  '    <span class="kw">return</span> <span class="kw">this</span>.#inks.<span class="prop">size</span>;',
  '  }',
  '}',
];

const terminalLines = (f: Flavor) => [
  '<span class="t-dim">~/projects/inkstone</span> <span class="t-branch">main</span>',
  '<span class="t-prompt">❯</span> pnpm build',
  '  <span class="t-gold">526</span> colors → <span class="t-gold">14</span> files',
  '<span class="t-prompt">❯</span> git status --short',
  ` <span class="t-red">M</span> packages/vscode/themes/${f.meta.id}.json`,
  ' <span class="t-green">A</span> preview/index.html',
  '<span class="t-prompt">❯</span> echo <span class="t-str">"青山横北郭，白水绕东城"</span>',
  '<span class="t-blue">青山横北郭，白水绕东城</span>',
  '<span class="cursor"></span>',
];

function diffLines(f: Flavor) {
  const keywordName = colorLabel(f.syntax.keyword) ?? '传统色';
  return [
    { kind: 'del', html: '<span class="sign">-</span> <span class="kw">const</span> <span class="var">canvas</span> = <span class="str">"#ffffff"</span>;' },
    { kind: 'add', html: `<span class="sign">+</span> <span class="kw">const</span> <span class="var">canvas</span> = <span class="str">"${f.surface.base}"</span>;` },
    { kind: 'add', html: `<span class="sign">+</span> <span class="kw">const</span> <span class="var">keyword</span> = <span class="fn">named</span>(<span class="str">"${keywordName}"</span>);` },
    { kind: 'ctx', html: `<span class="sign"> </span> <span class="kw">const</span> <span class="var">comment</span> = <span class="str">"${f.syntax.comment}"</span>;` },
  ];
}

function codeBlock(lines: string[], options: { active?: number; selected?: number; start?: number } = {}) {
  const start = options.start ?? 1;
  return lines
    .map((line, index) => {
      const lineNo = start + index;
      const classes = ['line'];
      if (options.active === lineNo) classes.push('line-active');
      if (options.selected === lineNo) classes.push('line-selected');
      return (
        `<div class="${classes.join(' ')}">` +
        `<span class="ln">${lineNo}</span>` +
        `<span class="lc">${line || ' '}</span>` +
        `</div>`
      );
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const accentRoles: Array<keyof Flavor['syntax']> = [
  'keyword',
  'function',
  'string',
  'number',
  'type',
  'constant',
  'comment',
  'decorator',
  'tag',
  'invalid',
];

function swatch(hex: string, label: string, sub: string) {
  const name = colorLabel(hex) ?? '派生色';
  const ink = luminance(hex) > 0.42 ? '#2a2723' : '#f7f4ed';
  return (
    `<div class="chip">` +
    `<div class="chip-color" style="background:${hex};color:${ink}">` +
    `<span class="chip-sample">Aa</span>` +
    `</div>` +
    `<div class="chip-body">` +
    `<div class="chip-name">${esc(label)}<span class="chip-cn">${esc(name)}</span></div>` +
    `<div class="chip-meta"><code>${hex}</code><span>${esc(sub)}</span></div>` +
    `</div></div>`
  );
}

export function surfaces(f: Flavor) {
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  return `
    <div class="swatches">
      ${swatch(s.base, '画布', 'canvas')}
      ${swatch(s.alt, '面板', 'panel')}
      ${swatch(s.raised, '浮起', 'raised')}
      ${swatch(s.overlay, '浮层', 'overlay')}
      ${swatch(b.normal, '边框', 'border')}
      ${swatch(t.primary, '正文', `${formatRatio(contrast(t.primary, s.base))}`)}
      ${swatch(t.secondary, '次要文字', `${formatRatio(contrast(t.secondary, s.base))}`)}
      ${swatch(t.muted, '弱化文字', `${formatRatio(contrast(t.muted, s.base))}`)}
      ${swatch(t.cursor, '光标', `${formatRatio(contrast(t.cursor, s.base))}`)}
    </div>`;
}

export function accents(f: Flavor) {
  return `
    <div class="swatches">
      ${accentRoles
        .map((role) => {
          const hex = f.syntax[role];
          return swatch(hex, syntaxLabels[role], formatRatio(contrast(hex, f.surface.base)));
        })
        .join('')}
    </div>`;
}

function ansiStrip(f: Flavor) {
  return `
    <div class="ansi">
      ${f.ansi
        .map(
          (hex, index) =>
            `<div class="ansi-cell" title="${ANSI_NAMES[index]} ${hex}">` +
            `<span class="ansi-block" style="background:${hex}"></span>` +
            `<span class="ansi-label">${index}</span>` +
            `<code>${hex.replace('#', '')}</code>` +
            `</div>`,
        )
        .join('')}
    </div>`;
}

/** Drop the trailing Palette class so the gallery editors stay short. */
export function galleryTsLines(f: Flavor): string[] {
  return tsLines(f).slice(0, 22);
}

export function editorMock(f: Flavor, options: { lines?: string[] } = {}) {
  const lines = options.lines ?? tsLines(f);
  const files = [
    ['theme.ts', true],
    ['palette.ts', false],
    ['ghostty', false],
    ['kaku.lua', false],
    ['README.md', false],
  ] as const;
  return `
  <div class="editor">
    <div class="titlebar">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="title">inkstone · theme.ts</span>
    </div>
    <div class="editor-body">
      <div class="activity">
        <span class="glyph">◫</span>
        <span class="glyph">⌕</span>
        <span class="glyph">⑂</span>
        <span class="glyph">▷</span>
        <span class="glyph">◈</span>
      </div>
      <div class="sidebar">
        <div class="side-title">Inkstone</div>
        <div class="side-row side-active"><span class="chev">▾</span> src</div>
        ${files
          .map(
            ([file, active]) =>
              `<div class="side-row file ${active ? 'side-active' : ''}">${file}${
                active ? '<span class="side-dot"></span>' : ''
              }</div>`,
          )
          .join('')}
        <div class="side-row side-muted">node_modules</div>
      </div>
      <div class="editor-main">
        <div class="tabs">
          <div class="tab active">theme.ts <span class="close">×</span></div>
          <div class="tab">palette.ts</div>
          <div class="tab">kaku.lua</div>
        </div>
        <div class="breadcrumb"><span>src</span><i>›</i><span>theme.ts</span><i>›</i><span>contrast</span></div>
        <div class="code">${codeBlock(lines, { active: 14, selected: 9 })}</div>
        <div class="statusbar">
          <span class="sb-left"><b>main*</b><span class="sb-sep">|</span>0 errors<span class="sb-sep">|</span>1 warning</span>
          <span class="sb-right">TypeScript<span class="sb-sep">|</span>墨观 · ${f.meta.zh}<span class="sb-sep">|</span>UTF-8</span>
        </div>
      </div>
    </div>
  </div>`;
}

/** Shared editor chrome styles used by preview, gallery, and the product site. */
export function editorStyles(): string {
  return `
  .editor { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg); }
  .titlebar { height: 32px; background: var(--bg-alt); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 10px; padding: 0 12px; }
  .dots { display: flex; gap: 5px; }
  .dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--border-strong); display: block; }
  .title { font-size: 10.5px; color: var(--fg-3); letter-spacing: .02em; }
  .editor-body { display: grid; grid-template-columns: 42px 132px 1fr; min-height: 0; }
  .activity { background: var(--activity); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 12px 0; }
  .glyph { color: var(--fg-3); font-size: 14px; opacity: .8; }
  .sidebar { background: var(--bg-alt); border-right: 1px solid var(--border-subtle); padding: 10px 8px; font-size: 10.5px; color: var(--fg-2); }
  .side-title { font-size: 10px; letter-spacing: 0; color: var(--fg-3); padding: 4px 8px 8px; }
  .side-row { padding: 3px 6px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .side-row.file { padding-left: 20px; color: var(--fg-2); }
  .side-active { background: var(--active); color: var(--fg); }
  .side-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--kw); margin-left: 6px; vertical-align: middle; }
  .side-muted { color: var(--fg-4); padding-left: 20px; }

  .editor-main { min-width: 0; display: flex; flex-direction: column; }
  .tabs { display: flex; background: var(--bg-alt); border-bottom: 1px solid var(--border-subtle); }
  .tab { font-size: 10.5px; color: var(--fg-3); padding: 7px 14px; border-right: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 8px; }
  .tab.active { background: var(--bg); color: var(--fg); box-shadow: inset 0 1px 0 var(--action); }
  .close { opacity: .5; font-size: 12px; }
  .breadcrumb { display: flex; gap: 6px; align-items: center; padding: 6px 14px; font-size: 10px; color: var(--fg-3); border-bottom: 1px solid var(--border-subtle); }
  .breadcrumb i { font-style: normal; opacity: .5; }

  .code { font-family: var(--mono); font-size: 11px; line-height: 1.72; padding: 10px 0; overflow-x: auto; }
  .line { display: flex; white-space: pre; min-width: max-content; }
  .ln { width: 38px; text-align: right; padding-right: 12px; color: var(--fg-4); flex: 0 0 auto; user-select: none; }
  .lc { padding-right: 16px; }
  .line-active { background: var(--lens); }
  .line-selected { background: var(--sel); }
  .line-selected .ln { color: var(--fg-2); }

  .kw { color: var(--kw); }
  .fn { color: var(--fn); }
  .str { color: var(--str); }
  .num { color: var(--num); }
  .type { color: var(--type); }
  .cm { color: var(--cm); font-style: italic; }
  .dec { color: var(--dec); }
  .var { color: var(--var); }
  .param { color: var(--param); font-style: italic; }
  .prop { color: var(--prop); }

  .statusbar { display: flex; justify-content: space-between; gap: 8px; background: var(--active); color: var(--fg); font-size: 9.5px; padding: 4px 12px; border-top: 1px solid var(--border-subtle); }
  .sb-left b { color: var(--kw); font-weight: 500; }
  .sb-sep { opacity: .35; margin: 0 6px; }`;
}

function terminalMock(f: Flavor) {
  return `
  <div class="terminal">
    <div class="terminal-bar">
      <span class="terminal-title">zsh — 100×28</span>
      <span class="terminal-badge">${f.meta.zh}</span>
    </div>
    <div class="terminal-body">
      ${terminalLines(f).join('\n')}
    </div>
  </div>`;
}

function diffMock(f: Flavor) {
  return `
  <div class="mini-card diff">
    <div class="mini-title">theme.ts · diff</div>
    <div class="diff-body">
      ${diffLines(f)
        .map((line) => `<div class="diff-line ${line.kind}">${line.html}</div>`)
        .join('\n')}
    </div>
  </div>`;
}

function markdownMock(f: Flavor) {
  const keywordName = colorLabel(f.syntax.keyword) ?? '传统色';
  return `
  <div class="mini-card markdown">
    <div class="mini-title">README.md · preview</div>
    <div class="md-body">
      <h3>${flavorName(f, 'zh')} ${flavorName(f, 'en')}</h3>
      <p>${esc(f.meta.description.zh)}</p>
      <blockquote>「知其白，守其黑，为天下式。」</blockquote>
      <p><code>named("${esc(keywordName)}")</code> → <code>${f.syntax.keyword}</code>，对比度 <strong>${formatRatio(
        contrast(f.syntax.keyword, f.surface.base),
      )}</strong>。</p>
      <ul><li>关键字 · ${esc(keywordName)}</li><li>字符串 · ${esc(nameOf(f.syntax.string) ?? '辅色')}</li><li>注释 · ${esc(nameOf(f.syntax.comment) ?? '弱化')}</li></ul>
    </div>
  </div>`;
}

/** Distinct traditional colors referenced by one flavor or a group of them. */
function namedColorCount(list: Flavor[]): number {
  const names = list.flatMap((f) =>
    [...Object.values(f.syntax), ...Object.values(f.status), ...f.ansi].map((hex) => nameOf(hex)),
  );
  return new Set(names.filter((name): name is string => Boolean(name))).size;
}

function flavorSection(f: Flavor) {
  const namedCount = namedColorCount([f]);
  const tone = f.meta.appearance === 'dark' ? 'DARK' : f.meta.family === 'sea' ? 'COOL LIGHT' : 'WARM LIGHT';
  return `
  <section class="flavor f-${f.meta.id}" style="${cssVars(f)}">
    <header class="flavor-head">
      <div>
        <div class="eyebrow">${tone}${f.meta.dimmed ? ' · DIMMED' : ''} · ${f.meta.en.toUpperCase()}</div>
        <h2>${f.meta.zh}<span>${flavorName(f, 'en')}</span></h2>
        <p class="flavor-desc">${f.meta.description.zh}</p>
      </div>
      <div class="flavor-stat">
        <strong>${namedCount}</strong>
        <span>种传统色</span>
      </div>
    </header>

    <div class="rows">
      <div class="row">
        <div class="row-label">墨与纸 <span>SURFACES</span></div>
        ${surfaces(f)}
      </div>
      <div class="row">
        <div class="row-label">颜料 <span>PIGMENTS</span></div>
        ${accents(f)}
      </div>
      <div class="row">
        <div class="row-label">终端 <span>ANSI 0–15</span></div>
        ${ansiStrip(f)}
      </div>
    </div>

    <div class="showcase">
      ${editorMock(f)}
      <div class="showcase-side">
        ${terminalMock(f)}
        ${diffMock(f)}
        ${markdownMock(f)}
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function renderPreview(): string {
  const totalNamed = namedColorCount(flavors);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>墨观 Inkstone · 中国传统色彩主题</title>
<style>
  :root {
    --page-bg: #0e0d13;
    --page-fg: #e9e3d7;
    --page-dim: #8f8899;
    --page-line: #262430;
    --seal: #b23a2e;
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
    line-height: 1.6;
  }
  .wrap { max-width: 1460px; margin: 0 auto; padding: 64px 36px 120px; }

  .hero { display: flex; gap: 28px; align-items: flex-start; margin-bottom: 56px; }
  .seal {
    flex: 0 0 auto; width: 76px; height: 76px; display: grid; place-items: center;
    background: var(--seal); color: #fff6ea; font-family: var(--serif); font-size: 42px;
    line-height: 1; border-radius: 4px; transform: rotate(-2.5deg);
    box-shadow: inset 0 0 0 2px rgba(255, 246, 234, .22), 0 14px 40px rgba(178, 58, 46, .28);
  }
  .hero-copy h1 { margin: 0 0 6px; font-family: var(--serif); font-size: 44px; font-weight: 600; letter-spacing: .04em; }
  .hero-copy h1 span { font-family: var(--sans); font-size: 20px; font-weight: 400; color: var(--page-dim); letter-spacing: .08em; margin-left: 14px; }
  .hero-copy p { margin: 0; color: var(--page-dim); max-width: 720px; font-size: 14.5px; }
  .hero-meta { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 8px; }
  .pill { border: 1px solid var(--page-line); color: var(--page-dim); border-radius: 999px; padding: 3px 12px; font-size: 12px; letter-spacing: .06em; }
  .pill b { color: var(--page-fg); font-weight: 500; }

  .toolbar { display: flex; align-items: center; gap: 10px; margin: 0 0 30px; flex-wrap: wrap; }
  .toolbar .label { color: var(--page-dim); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; margin-right: 6px; }
  .toolbar button {
    background: transparent; border: 1px solid var(--page-line); color: var(--page-dim);
    padding: 6px 16px; border-radius: 4px; font-size: 12.5px; cursor: pointer; font-family: var(--sans);
  }
  .toolbar button:hover { border-color: #3d3a4b; color: var(--page-fg); }
  .toolbar button.on { background: #22212c; border-color: #3d3a4b; color: var(--page-fg); }

  .flavors { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
  .flavor-group { margin-bottom: 36px; }
  .flavor-group:last-child { margin-bottom: 0; }
  .group-label { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--page-dim); margin: 0 0 14px; }
  .group-label span { color: var(--page-fg); margin-right: 10px; }
  body:not([data-view="all"]) .flavor-group { margin-bottom: 0; }
  body:not([data-view="all"]) .group-label { display: none; }
  ${flavors
    .map(
      (f) => `  body[data-view="${f.meta.id}"] .flavors { grid-template-columns: 1fr; max-width: 900px; margin: 0 auto; }
  body[data-view="${f.meta.id}"] .flavor { display: none; }
  body[data-view="${f.meta.id}"] .f-${f.meta.id} { display: block; }`,
    )
    .join('\n')}

  .flavor {
    background: var(--bg); color: var(--fg);
    border: 1px solid #262430; border-radius: 14px; overflow: hidden;
    box-shadow: 0 30px 80px rgba(0, 0, 0, .35);
  }
  .flavor-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 28px 28px 22px; border-bottom: 1px solid var(--border-subtle); }
  .eyebrow { font-size: 10.5px; letter-spacing: .22em; color: var(--fg-3); margin-bottom: 8px; }
  .flavor-head h2 { margin: 0; font-family: var(--serif); font-size: 30px; font-weight: 600; letter-spacing: .04em; color: var(--fg); }
  .flavor-head h2 span { font-family: var(--sans); font-size: 14px; font-weight: 400; color: var(--fg-3); letter-spacing: .06em; margin-left: 10px; }
  .flavor-desc { margin: 8px 0 0; font-size: 13px; color: var(--fg-2); max-width: 340px; }
  .flavor-stat { text-align: right; white-space: nowrap; }
  .flavor-stat strong { display: block; font-family: var(--serif); font-size: 30px; font-weight: 500; color: var(--kw); line-height: 1; }
  .flavor-stat span { font-size: 11px; color: var(--fg-3); letter-spacing: .08em; }

  .rows { padding: 6px 28px 10px; }
  .row { padding: 16px 0 20px; border-bottom: 1px solid var(--border-subtle); }
  .row:last-child { border-bottom: 0; }
  .row-label { font-size: 11px; letter-spacing: .2em; color: var(--fg-3); margin-bottom: 12px; text-transform: uppercase; }
  .row-label span { opacity: .55; margin-left: 6px; }

  .swatches { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  .chip { border: 1px solid var(--border-subtle); border-radius: 5px; overflow: hidden; background: var(--bg-alt); }
  .chip-color { height: 46px; display: flex; align-items: flex-end; justify-content: flex-end; padding: 4px 6px; }
  .chip-sample { font-family: var(--serif); font-size: 12px; opacity: .5; }
  .chip-body { padding: 7px 8px 8px; }
  .chip-name { font-size: 11.5px; color: var(--fg); display: flex; justify-content: space-between; gap: 4px; }
  .chip-cn { color: var(--fg-3); font-size: 10.5px; white-space: nowrap; }
  .chip-meta { display: flex; justify-content: space-between; gap: 6px; margin-top: 3px; font-size: 10px; color: var(--fg-3); }
  .chip-meta code { font-family: var(--mono); font-size: 9.5px; color: var(--fg-2); }

  .ansi { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; }
  .ansi-cell { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: var(--fg-3); }
  .ansi-block { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(128,128,128,.18); flex: 0 0 auto; }
  .ansi-label { color: var(--fg-4); width: 10px; text-align: right; font-family: var(--mono); }
  .ansi-cell code { font-family: var(--mono); font-size: 9px; color: var(--fg-2); }

  .showcase { padding: 10px 28px 28px; display: flex; flex-direction: column; gap: 12px; }
  .showcase-side { display: grid; grid-template-columns: 1fr; gap: 12px; }

  ${editorStyles()}

  .terminal { background: var(--bg-sunken); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .terminal-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: var(--bg-alt); border-bottom: 1px solid var(--border-subtle); }
  .terminal-title { font-size: 10px; color: var(--fg-3); }
  .terminal-badge { font-size: 9.5px; color: var(--fg-3); border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; }
  .terminal-body { font-family: var(--mono); font-size: 11px; line-height: 1.85; padding: 12px 14px; color: var(--fg); white-space: pre-wrap; }
  .t-dim { color: var(--fg-3); }
  .t-branch { color: var(--ansi-5); }
  .t-prompt { color: var(--ansi-2); }
  .t-gold { color: var(--ansi-3); }
  .t-red { color: var(--ansi-1); }
  .t-green { color: var(--ansi-2); }
  .t-blue { color: var(--ansi-4); }
  .t-str { color: var(--ansi-6); }
  .cursor { display: inline-block; width: 7px; height: 13px; background: var(--cursor); vertical-align: -2px; animation: blink 1.2s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .mini-card { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg); }
  .mini-title { font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg-3); padding: 7px 12px; background: var(--bg-alt); border-bottom: 1px solid var(--border-subtle); }
  .diff-body, .md-body { padding: 10px 12px; }
  .diff-body { font-family: var(--mono); font-size: 10.5px; line-height: 1.9; }
  .diff-line { padding: 0 6px; border-radius: 2px; }
  .diff-line .sign { display: inline-block; width: 12px; color: var(--fg-3); }
  .diff-line.add { background: var(--diff-add); }
  .diff-line.del { background: var(--diff-del); }
  .md-body { font-family: var(--serif); font-size: 12px; color: var(--fg-2); }
  .md-body h3 { margin: 2px 0 8px; font-size: 16px; font-weight: 600; color: var(--kw); }
  .md-body p { margin: 6px 0; }
  .md-body strong { color: var(--fg); font-weight: 600; }
  .md-body em { color: var(--str); }
  .md-body blockquote { margin: 8px 0; padding: 2px 0 2px 10px; border-left: 2px solid var(--border-strong); color: var(--fg-3); }
  .md-body code { font-family: var(--mono); font-size: 10.5px; color: var(--num); background: var(--bg-alt); padding: 1px 4px; border-radius: 3px; }
  .md-body ul { margin: 6px 0 0; padding-left: 18px; }
  .md-body li { margin: 2px 0; }
  .md-body li::marker { color: var(--kw); }

  .foot { margin-top: 64px; border-top: 1px solid var(--page-line); padding-top: 24px; color: var(--page-dim); font-size: 12px; display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .foot code { font-family: var(--mono); color: #b9b1a3; }

  @media (max-width: 1180px) {
    .flavors { grid-template-columns: 1fr; }
    .hero-copy h1 { font-size: 34px; }
  }
  @media (max-width: 720px) {
    .wrap { padding: 36px 18px 80px; }
    .seal { width: 54px; height: 54px; font-size: 30px; }
    .hero-copy h1 span { display: block; margin: 6px 0 0; }
    .swatches { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .editor-body { grid-template-columns: 34px 1fr; }
    .sidebar { display: none; }
    .flavor-head { flex-direction: column; align-items: flex-start; }
    .flavor-stat { text-align: left; }
  }
</style>
</head>
<body data-view="all">
<div class="wrap">
  <header class="hero">
    <div class="seal">墨</div>
    <div class="hero-copy">
      <h1>墨观 Inkstone<span>中国传统色彩主题</span></h1>
      <p>从 526 个中国传统颜色中取色。墨纸组有玄墨 / 宣纸与各自的 Dimmed；海瓷组有沧海 / 青瓷。六个变体共用同一套色相骨架，切换时像同一幅画换了光线。</p>
      <div class="hero-meta">
        <span class="pill"><b>6</b> 个变体</span>
        <span class="pill"><b>${totalNamed}</b> 种传统色</span>
        <span class="pill"><b>526</b> 色原始色板</span>
        <span class="pill">VS Code / Cursor</span>
        <span class="pill">Ghostty</span>
        <span class="pill">Kaku / WezTerm</span>
        <span class="pill">对比度已审计</span>
      </div>
    </div>
  </header>

  <div class="toolbar">
    <span class="label">Compare</span>
    <button data-filter="all" class="on">并排</button>
    ${flavors
      .map((f) => `<button data-filter="${f.meta.id}">${flavorName(f, 'zh')}</button>`)
      .join('\n    ')}
  </div>

  ${flavorFamilies
    .map(
      (family) => `<div class="flavor-group">
    <div class="group-label"><span>${family.zh}</span>${family.en.toUpperCase()}</div>
    <div class="flavors">
      ${family.flavors.map(flavorSection).join('\n')}
    </div>
  </div>`,
    )
    .join('\n')}

  <footer class="foot">
    <span>色值来源：zhongguose.com · 526 个中国传统颜色（作者 Perchouli）／同名 Figma 社区色谱</span>
    <span>生成命令 <code>pnpm preview</code> · 本页无外部依赖</span>
  </footer>
</div>
<script>
  const buttons = document.querySelectorAll('.toolbar button');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      document.body.dataset.view = button.dataset.filter;
      buttons.forEach((b) => b.classList.toggle('on', b === button));
    });
  }
</script>
</body>
</html>`;
}

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

/**
 * Compact 3×2 editor gallery used for README and Marketplace screenshots.
 * Capture with `pnpm capture:preview`.
 */
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
