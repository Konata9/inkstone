/**
 * Theme specimen rendering.
 *
 * HTML/CSS fragments that present one flavor: CSS variables, swatches, and the
 * editor mock. Shared by the product site and the README screenshot pipeline so
 * both stay on one palette contract.
 */

import { alpha, contrast, formatRatio, luminance } from '../src/color.ts';
import { colorLabel } from '../src/palette/data.ts';
import { actionHover } from '../src/palette/index.ts';
import { syntaxLabels } from '../src/palette/labels.ts';
import type { Flavor } from '../src/palette/types.ts';

export const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

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
  .title { font-size: 12px; color: var(--fg-2); letter-spacing: .02em; }
  .editor-body { display: grid; grid-template-columns: 42px 132px 1fr; min-height: 0; }
  .activity { background: var(--activity); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 12px 0; }
  .glyph { color: var(--fg-3); font-size: 14px; opacity: .8; }
  .sidebar { background: var(--bg-alt); border-right: 1px solid var(--border-subtle); padding: 10px 8px; font-size: 12px; color: var(--fg-2); }
  .side-title { font-size: 12px; letter-spacing: 0; color: var(--fg-2); padding: 4px 8px 8px; }
  .side-row { padding: 3px 6px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .side-row.file { padding-left: 20px; color: var(--fg-2); }
  .side-active { background: var(--active); color: var(--fg); }
  .side-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--kw); margin-left: 6px; vertical-align: middle; }
  .side-muted { color: var(--fg-3); padding-left: 20px; }

  .editor-main { min-width: 0; display: flex; flex-direction: column; }
  .tabs { display: flex; background: var(--bg-alt); border-bottom: 1px solid var(--border-subtle); }
  .tab { font-size: 12px; color: var(--fg-2); padding: 7px 14px; border-right: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 8px; }
  .tab.active { background: var(--bg); color: var(--fg); box-shadow: inset 0 1px 0 var(--action); }
  .close { opacity: .5; font-size: 12px; }
  .breadcrumb { display: flex; gap: 6px; align-items: center; padding: 6px 14px; font-size: 12px; color: var(--fg-2); border-bottom: 1px solid var(--border-subtle); }
  .breadcrumb i { font-style: normal; opacity: .5; }

  .code { font-family: var(--mono); font-size: 14px; line-height: 1.62; padding: 10px 0; overflow-x: auto; }
  .line { display: flex; white-space: pre; min-width: max-content; }
  .ln { width: 40px; text-align: right; padding-right: 12px; color: var(--fg-3); flex: 0 0 auto; user-select: none; }
  .lc { padding-right: 16px; }
  .line-active { background: var(--lens); }
  .line-selected { background: var(--sel); }
  .line-selected .ln { color: var(--fg-2); }

  .kw { color: var(--kw); }
  .fn { color: var(--fn); }
  .str { color: var(--str); }
  .num { color: var(--num); }
  .type { color: var(--type); }
  .cm { color: var(--cm); }
  .dec { color: var(--dec); }
  .var { color: var(--var); }
  .param { color: var(--param); font-style: italic; }
  .prop { color: var(--prop); }

  .statusbar { display: flex; justify-content: space-between; gap: 8px; background: var(--active); color: var(--fg); font-size: 12px; padding: 5px 12px; border-top: 1px solid var(--border-subtle); }
  .sb-left b { color: var(--kw); font-weight: 500; }
  .sb-sep { opacity: .35; margin: 0 6px; }`;
}
