/**
 * ANSI slot names and the per-target keys they map to.
 *
 * The palette stores 16 ANSI colors in order (`black`, `red`, `green`, ...,
 * `brightWhite`). VS Code and Zed spell those slots differently, so the
 * spelling lives here instead of being copied into every generator.
 */

import { ANSI_NAMES } from '../palette/types.ts';

function ansiName(slot: number): string {
  const name = ANSI_NAMES[slot];
  if (!name) throw new Error(`ANSI slot ${slot} is out of range`);
  return name;
}

/** snake_case slot name, e.g. `bright_black`. */
export function ansiSlotName(slot: number): string {
  return ansiName(slot).replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/** VS Code workbench key, e.g. `terminal.ansiBrightBlack`. */
export function vscodeAnsiKey(slot: number): string {
  const name = ansiName(slot);
  return `terminal.ansi${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** Zed terminal key, e.g. `terminal.ansi.bright_black`. */
export function zedAnsiKey(slot: number): string {
  return `terminal.ansi.${ansiSlotName(slot)}`;
}

/** Zed dim key for the first eight slots, e.g. `terminal.ansi.dim_black`. */
export function zedDimAnsiKey(slot: number): string {
  if (slot > 7) throw new Error(`ANSI dim slot ${slot} is out of range (0-7)`);
  return `terminal.ansi.dim_${ansiSlotName(slot)}`;
}
