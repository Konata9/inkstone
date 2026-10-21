/**
 * Palette audit.
 *
 * Fails the build when a token drops below its readability floor, when a
 * surface loses its place in the elevation ramp, or when the vendored
 * traditional-color dataset changes shape.
 */

import { contrast, formatRatio, isValidHex, luminance, normalizeHex } from './color.ts';
import { findByName, findByHex, traditionalColors } from './palette/data.ts';
import { flavors } from './palette/index.ts';
import type { Flavor } from './palette/types.ts';

interface Rule {
  label: string;
  fg: string;
  bg: string;
  min: number;
  /** Roles that are allowed to sit in the "dim but present" range. */
  warnOnly?: boolean;
}

interface Result extends Rule {
  flavor: string;
  ratio: number;
  ok: boolean;
}

export interface AuditReport {
  ok: boolean;
  checks: number;
  failures: Result[];
  warnings: string[];
  datasetIssues: string[];
}

export function audit(options: { silent?: boolean } = {}): AuditReport {
  const results: Result[] = [];
  const warnings: string[] = [];

  function expect(flavor: Flavor, label: string, fg: string, bg: string, min: number, warnOnly = false) {
    const ratio = contrast(fg, bg);
    results.push({ flavor: flavor.meta.id, label, fg, bg, min, ratio, ok: ratio >= min, warnOnly });
  }

  for (const flavor of flavors) {
    const { surface, text, syntax, border, status, ansi } = flavor;

    // --- Text ------------------------------------------------------------
    expect(flavor, 'text.primary / canvas', text.primary, surface.base, 7);
    expect(flavor, 'text.primary / panel', text.primary, surface.alt, 7);
    expect(flavor, 'text.primary / raised', text.primary, surface.raised, 7);
    expect(flavor, 'text.secondary / canvas', text.secondary, surface.base, 4.5);
    expect(flavor, 'text.muted / canvas', text.muted, surface.base, 4.5);
    expect(flavor, 'text.faint / canvas', text.faint, surface.base, 3, true);
    expect(flavor, 'text.primary / input', text.primary, surface.input, 7);
    expect(flavor, 'text.primary / selection', text.primary, surface.selection, 4.5);
    expect(flavor, 'text.primary / overlay', text.primary, surface.overlay, 4.5);
    expect(flavor, 'text.secondary / panel', text.secondary, surface.alt, 4.5);
    expect(flavor, 'text.secondary / raised', text.secondary, surface.raised, 4.5);
    expect(flavor, 'text.secondary / status bar', text.secondary, surface.sunken, 4.5);
    expect(flavor, 'text.inverse / function', text.inverse, syntax.function, 3, true);
    expect(flavor, 'text.inverse / tag', text.inverse, syntax.tag, 3, true);

    // --- Syntax ----------------------------------------------------------
    const dim = new Set(['operator', 'punctuation', 'deprecated']);
    for (const [role, hex] of Object.entries(syntax)) {
      expect(flavor, `syntax.${role}`, hex, surface.base, dim.has(role) ? 3 : 4.5, dim.has(role));
      if (role !== 'comment' && role !== 'deprecated' && role !== 'punctuation') {
        expect(flavor, `syntax.${role} / panel`, hex, surface.alt, 4);
      }
    }

    // --- UI --------------------------------------------------------------
    expect(flavor, 'border.normal / canvas', border.normal, surface.base, 1.15);
    expect(flavor, 'border.strong / canvas', border.strong, surface.base, 1.4);
    expect(flavor, 'border.focus / canvas', border.focus, surface.base, 3);
    expect(flavor, 'selection / canvas', surface.selection, surface.base, 1.15);
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
        min: 1.04,
        ratio,
        ok: ratio >= 1.04,
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
    });

    // --- Provenance ------------------------------------------------------
    const derived: string[] = [];
    for (const [role, hex] of Object.entries({ ...syntax, ...status })) {
      if (findByHex(hex).length === 0) derived.push(`${role}=${hex}`);
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
      const role = entry.split('=')[0]!;
      if (!allowedDerived.has(role)) {
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
  for (const soft of softFailures) {
    warnings.push(`${soft.flavor}: ${soft.label} is ${formatRatio(soft.ratio)} (soft floor ${soft.min}:1)`);
  }
  const ok = failures.length === 0 && datasetIssues.length === 0;

  if (!options.silent) {
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
          !row.label.startsWith('elevation') &&
          !row.label.startsWith('ansi') &&
          !row.label.startsWith('border') &&
          !row.label.startsWith('selection'),
      );
      const worst = [...textRows].sort((a, b) => a.ratio - b.ratio)[0];
      console.log(
        `${bold(flavor.meta.zh)} ${gray(flavor.meta.en)}  ${gray(`${rows.length} checks`)}  ` +
          (failures.some((failure) => failure.flavor === flavor.meta.id) ? red('FAIL') : green('PASS')) +
          (worst ? gray(`  lowest text ${formatRatio(worst.ratio)} (${worst.label})`) : ''),
      );
    }

    if (failures.length > 0) {
      console.log(`\n${red('Contrast failures')}`);
      for (const failure of failures) {
        console.log(
          `  ${red('✗')} ${failure.flavor} ${failure.label}: ${formatRatio(failure.ratio)} ` +
            gray(`(min ${failure.min}:1, ${failure.fg} on ${failure.bg})`),
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
  }

  return { ok, checks: results.length, failures, warnings, datasetIssues };
}
