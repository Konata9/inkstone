/**
 * Palette audit.
 *
 * Fails the build when a token drops below its readability floor, when a
 * surface loses its place in the elevation ramp, or when the vendored
 * traditional-color dataset changes shape.
 */

import { chromaOf, contrast, formatRatio, isValidHex, luminance, normalizeHex } from './color.ts';
import { findByName, nameOf, softenedSource, traditionalColors } from './palette/data.ts';
import { flavors, flavorName } from './palette/index.ts';
import type { Flavor } from './palette/types.ts';

type RuleKind = 'contrast' | 'chroma' | 'elevation';

interface Rule {
  label: string;
  fg: string;
  bg: string;
  min: number;
  /** Comfort ceiling: a token can be too loud as well as too faint. */
  max?: number;
  /** Roles that are allowed to sit in the "dim but present" range. */
  warnOnly?: boolean;
  kind?: RuleKind;
}

interface Result extends Rule {
  flavor: string;
  /** Contrast ratio, chroma value, or elevation ratio, depending on `kind`. */
  ratio: number;
  ok: boolean;
}

/** Contrast bands. Floors keep text legible; ceilings keep it from glaring. */
const BAND = {
  primary: { min: 7, max: 12.5 },
  secondary: { min: 4.5, max: 8 },
  muted: { min: 4.5, max: 6 },
  faint: { min: 3, max: 4 },
  syntax: { min: 4.5, max: 9 },
  syntaxDim: { min: 4, max: 7 },
  status: { min: 4.5, max: 9 },
  cursor: { min: 4.5, max: 7 },
  selection: { min: 1.25, max: 1.5 },
} as const;

/** Perceptual chroma limits, in OKLCH. */
const CHROMA = {
  cursor: 0.105,
  red: 0.175,
  signal: 0.19,
  ansi: 0.2,
  dimmedFloor: 0.045,
  dimmedCommentFloor: 0.03,
} as const;

/** Roles that carry an actual hue; neutrals are exempt from the Dimmed floor. */
const pigmentRoles = new Set([
  'comment',
  'keyword',
  'storage',
  'function',
  'method',
  'string',
  'number',
  'boolean',
  'type',
  'constant',
  'parameter',
  'decorator',
  'tag',
  'attribute',
  'regexp',
  'escape',
  'invalid',
  'error',
  'warning',
  'info',
  'success',
  'added',
  'deleted',
  'renamed',
  'modified',
]);

/** Ink roles follow body-text rules, not pigment rules. */
const inkRoles = new Set(['variable', 'property']);

export interface AuditReport {
  ok: boolean;
  checks: number;
  failures: Result[];
  warnings: string[];
  datasetIssues: string[];
}

export function audit(): AuditReport {
  const results: Result[] = [];
  const warnings: string[] = [];

  function expect(
    flavor: Flavor,
    label: string,
    fg: string,
    bg: string,
    min: number,
    warnOnly = false,
    max?: number,
  ) {
    const ratio = contrast(fg, bg);
    const aboveFloor = ratio >= min;
    const belowCeiling = max === undefined || ratio <= max;
    results.push({
      flavor: flavor.meta.id,
      label,
      fg,
      bg,
      min,
      max,
      ratio,
      kind: 'contrast',
      ok: aboveFloor && belowCeiling,
      warnOnly,
    });
  }

  function expectChroma(
    flavor: Flavor,
    label: string,
    hex: string,
    min: number,
    max: number,
    warnOnly = false,
  ) {
    const value = chromaOf(hex);
    results.push({
      flavor: flavor.meta.id,
      label,
      fg: hex,
      bg: hex,
      min,
      max,
      ratio: value,
      kind: 'chroma',
      ok: value >= min && value <= max,
      warnOnly,
    });
  }

  for (const flavor of flavors) {
    const { surface, text, syntax, border, status, ansi } = flavor;

    // --- Text ------------------------------------------------------------
    // Comfort ceilings matter as much as legibility floors: a 14:1 body text
    // on a near-black canvas is technically accessible and physically tiring.
    expect(flavor, 'text.primary / canvas', text.primary, surface.base, BAND.primary.min, false, BAND.primary.max);
    expect(flavor, 'text.primary / panel', text.primary, surface.alt, BAND.primary.min, false, BAND.primary.max);
    expect(flavor, 'text.primary / raised', text.primary, surface.raised, BAND.primary.min, false, BAND.primary.max);
    expect(flavor, 'text.secondary / canvas', text.secondary, surface.base, BAND.secondary.min, false, BAND.secondary.max);
    expect(flavor, 'text.muted / canvas', text.muted, surface.base, BAND.muted.min, false, BAND.muted.max);
    expect(flavor, 'text.faint / canvas', text.faint, surface.base, BAND.faint.min, true, BAND.faint.max);
    expect(flavor, 'text.primary / input', text.primary, surface.input, BAND.primary.min);
    expect(flavor, 'text.primary / selection', text.primary, surface.selection, 4.5);
    expect(flavor, 'text.primary / overlay', text.primary, surface.overlay, 4.5);
    expect(flavor, 'text.secondary / panel', text.secondary, surface.alt, BAND.secondary.min, false, BAND.secondary.max);
    expect(flavor, 'text.secondary / raised', text.secondary, surface.raised, BAND.secondary.min, false, BAND.secondary.max);
    expect(flavor, 'text.secondary / status bar', text.secondary, surface.sunken, BAND.secondary.min);
    expect(flavor, 'text.inverse / function', text.inverse, syntax.function, 3, true);
    expect(flavor, 'text.inverse / tag', text.inverse, syntax.tag, 3, true);

    // Dimmed must dim the room, not the ink.
    if (flavor.meta.dimmed) {
      expect(flavor, 'text.primary / canvas (dimmed)', text.primary, surface.base, 10.5, false, BAND.primary.max);
      expect(flavor, 'text.secondary / canvas (dimmed)', text.secondary, surface.base, 6.5, false, BAND.secondary.max);
    }

    expect(flavor, 'text.cursor / canvas', text.cursor, surface.base, BAND.cursor.min, false, BAND.cursor.max);
    expectChroma(flavor, 'text.cursor chroma', text.cursor, 0, CHROMA.cursor);

    // --- Syntax ----------------------------------------------------------
    const dim = new Set(['operator', 'punctuation', 'deprecated']);
    for (const [role, hex] of Object.entries(syntax)) {
      if (inkRoles.has(role)) {
        expect(flavor, `syntax.${role}`, hex, surface.base, 4.5, false, BAND.primary.max);
        continue;
      }
      const band = role === 'deprecated'
        ? { min: 3, max: BAND.syntaxDim.max }
        : dim.has(role)
          ? BAND.syntaxDim
          : BAND.syntax;
      expect(flavor, `syntax.${role}`, hex, surface.base, band.min, role === 'deprecated', band.max);
      if (role !== 'comment' && role !== 'deprecated' && role !== 'punctuation') {
        expect(flavor, `syntax.${role} / panel`, hex, surface.alt, 4);
      }
      const ceiling = role === 'invalid' ? CHROMA.signal : CHROMA.red;
      expectChroma(flavor, `syntax.${role} chroma`, hex, 0, ceiling);
      if (flavor.meta.dimmed && pigmentRoles.has(role)) {
        expectChroma(
          flavor,
          `syntax.${role} chroma (dimmed floor)`,
          hex,
          role === 'comment' ? CHROMA.dimmedCommentFloor : CHROMA.dimmedFloor,
          ceiling,
          true,
        );
      }
    }

    // --- Status ----------------------------------------------------------
    for (const [role, hex] of Object.entries(status)) {
      expect(flavor, `status.${role}`, hex, surface.base, BAND.status.min, false, BAND.status.max);
      const ceiling = role === 'error' ? CHROMA.signal : CHROMA.red;
      expectChroma(flavor, `status.${role} chroma`, hex, 0, ceiling);
      if (flavor.meta.dimmed) {
        expectChroma(flavor, `status.${role} chroma (dimmed floor)`, hex, CHROMA.dimmedFloor, ceiling, true);
      }
    }

    // --- UI --------------------------------------------------------------
    expect(flavor, 'border.normal / canvas', border.normal, surface.base, 1.15);
    expect(flavor, 'border.strong / canvas', border.strong, surface.base, 1.4);
    expect(flavor, 'border.focus / canvas', border.focus, surface.base, 3);
    expect(
      flavor,
      'selection / canvas',
      surface.selection,
      surface.base,
      BAND.selection.min,
      false,
      BAND.selection.max,
    );
    expect(flavor, 'text.inverse / status.error', text.inverse, status.error, 3, true);
    expect(flavor, 'text.inverse / keyword', text.inverse, syntax.keyword, 3, true);

    // Elevation ramp: each step must be visibly distinct and ordered.
    const ramp = [
      ['base', surface.base],
      ['alt', surface.alt],
      ['raised', surface.raised],
      ['overlay', surface.overlay],
    ] as const;
    for (let i = 1; i < ramp.length; i += 1) {
      const [prevName, prev] = ramp[i - 1]!;
      const [name, hex] = ramp[i]!;
      const ratio = contrast(hex, prev);
      results.push({
        flavor: flavor.meta.id,
        label: `elevation ${prevName} → ${name}`,
        fg: hex,
        bg: prev,
        min: 1.05,
        ratio,
        kind: 'elevation',
        ok: ratio >= 1.05,
      });
      const ordered = flavor.meta.appearance === 'dark'
        ? luminance(hex) >= luminance(prev)
        : luminance(hex) <= luminance(prev);
      if (!ordered) {
        warnings.push(`${flavor.meta.id}: elevation ramp is not monotonic at ${prevName} → ${name}`);
      }
    }

    // --- ANSI ------------------------------------------------------------
    ansi.forEach((hex, index) => {
      if (!isValidHex(hex)) {
        results.push({
          flavor: flavor.meta.id,
          label: `ansi[${index}] valid hex`,
          fg: hex,
          bg: surface.base,
          min: 0,
          ratio: 0,
          ok: false,
        });
        return;
      }
      // Terminals need a lower floor than editor text: slot 0/8 are backgrounds,
      // yellow and white are structurally low-contrast on paper.
      const floors: Record<number, { min: number; warnOnly?: boolean }> = {
        0: { min: 1.2 },
        3: { min: 2.5 },
        7: { min: 2.5 },
        8: { min: 1.2 },
        11: { min: 2.5, warnOnly: true },
        15: { min: 2.0, warnOnly: true },
      };
      const floor = floors[index] ?? { min: 3 };
      expect(flavor, `ansi[${index}]`, hex, surface.base, floor.min, floor.warnOnly);
      expectChroma(flavor, `ansi[${index}] chroma`, hex, 0, CHROMA.ansi, true);
    });

    // --- Provenance ------------------------------------------------------
    const derived: string[] = [];
    for (const [role, hex] of Object.entries({ ...syntax, ...status })) {
      if (!nameOf(hex)) derived.push(`${role}=${hex}`);
    }
    const allowedDerived = new Set([
      'variable',
      'property',
      'comment',
      'operator',
      'punctuation',
      'deprecated',
      'added',
      'deleted',
      'renamed',
      'error',
      'warning',
      'info',
      'success',
      'modified',
    ]);
    for (const entry of derived) {
      const [role, hex] = entry.split('=') as [string, string];
      // A chroma-compressed pigment keeps its hue and lightness, so it still
      // has a traceable traditional source. Anything else is a warning.
      if (!allowedDerived.has(role) && !softenedSource(hex)) {
        warnings.push(`${flavor.meta.id}: syntax.${role} is not an exact traditional color (${entry})`);
      }
    }
    if (flavor.meta.id === 'xuanzhi') {
      if (findByName('鱼肚白')?.hex !== normalizeHex(surface.base)) {
        warnings.push('xuanzhi: canvas should stay at 鱼肚白');
      }
    }
  }

  // --- Dataset integrity ------------------------------------------------
  const datasetIssues: string[] = [];
  if (traditionalColors.length !== 526) {
    datasetIssues.push(`expected 526 traditional colors, found ${traditionalColors.length}`);
  }
  const names = new Set<string>();
  const hexes = new Set<string>();
  for (const color of traditionalColors) {
    if (!isValidHex(color.hex)) datasetIssues.push(`invalid hex for ${color.name}: ${color.hex}`);
    if (names.has(color.name)) datasetIssues.push(`duplicate name: ${color.name}`);
    names.add(color.name);
    hexes.add(color.hex);
  }
  if (hexes.size !== traditionalColors.length) {
    datasetIssues.push(`duplicate hex values: ${traditionalColors.length - hexes.size}`);
  }

  // --- Report -----------------------------------------------------------
  const failures = results.filter((result) => !result.ok && !result.warnOnly);
  const softFailures = results.filter((result) => !result.ok && result.warnOnly);
  const showValue = (result: Result) => (result.kind === 'chroma'
    ? `C ${result.ratio.toFixed(3)}`
    : formatRatio(result.ratio));
  const showRule = (result: Result) => (result.kind === 'chroma'
    ? `C ${result.min.toFixed(2)}–${result.max?.toFixed(2) ?? '∞'}`
    : `${result.min}:1${result.max ? `–${result.max}:1` : '+'}`);
  for (const soft of softFailures) {
    warnings.push(`${soft.flavor}: ${soft.label} is ${showValue(soft)} (soft band ${showRule(soft)})`);
  }
  const ok = failures.length === 0 && datasetIssues.length === 0;

  const useColor = process.stdout.isTTY;
  const paint = (code: string, text: string) => (useColor ? `\u001B[${code}m${text}\u001B[0m` : text);
  const green = (text: string) => paint('32', text);
  const red = (text: string) => paint('31', text);
  const yellow = (text: string) => paint('33', text);
  const gray = (text: string) => paint('90', text);
  const bold = (text: string) => paint('1', text);

  console.log(bold('\n墨观 Inkstone · palette audit\n'));

  for (const flavor of flavors) {
    const rows = results.filter((result) => result.flavor === flavor.meta.id);
    const textRows = rows.filter(
      (row) =>
        row.kind === 'contrast' &&
        !row.label.startsWith('ansi') &&
        !row.label.startsWith('border') &&
        !row.label.startsWith('selection') &&
        !row.label.endsWith('(dimmed floor)'),
    );
    const worst = [...textRows].sort((a, b) => a.ratio - b.ratio)[0];
    console.log(
      `${bold(flavorName(flavor, 'zh'))} ${gray(flavorName(flavor, 'en'))}  ${gray(`${rows.length} checks`)}  ` +
        (failures.some((failure) => failure.flavor === flavor.meta.id) ? red('FAIL') : green('PASS')) +
        (worst ? gray(`  lowest text ${formatRatio(worst.ratio)} (${worst.label})`) : ''),
    );
  }

  if (failures.length > 0) {
    console.log(`\n${red('Comfort failures')}`);
    for (const failure of failures) {
      console.log(
        `  ${red('✗')} ${failure.flavor} ${failure.label}: ${showValue(failure)} ` +
          gray(`(band ${showRule(failure)}, ${failure.fg}${failure.kind === 'chroma' ? '' : ` on ${failure.bg}`})`),
      );
    }
  }

  if (warnings.length > 0) {
    console.log(`\n${yellow('Warnings')}`);
    for (const warning of warnings) console.log(`  ${yellow('!')} ${warning}`);
  }

  if (datasetIssues.length > 0) {
    console.log(`\n${red('Dataset')}`);
    for (const issue of datasetIssues) console.log(`  ${red('✗')} ${issue}`);
  }

  console.log(
    `${gray(`\ndataset: ${traditionalColors.length} colors, ${names.size} names, ${hexes.size} unique hex values`)}`,
  );
  console.log(ok ? green('\nAudit passed.\n') : red('\nAudit failed.\n'));

  return { ok, checks: results.length, failures, warnings, datasetIssues };
}
