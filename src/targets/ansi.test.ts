import assert from 'node:assert/strict';
import test from 'node:test';

import { ansiSlotName, vscodeAnsiKey, zedAnsiKey, zedDimAnsiKey } from './ansi.ts';

const VSCODE_KEYS = [
  'terminal.ansiBlack',
  'terminal.ansiRed',
  'terminal.ansiGreen',
  'terminal.ansiYellow',
  'terminal.ansiBlue',
  'terminal.ansiMagenta',
  'terminal.ansiCyan',
  'terminal.ansiWhite',
  'terminal.ansiBrightBlack',
  'terminal.ansiBrightRed',
  'terminal.ansiBrightGreen',
  'terminal.ansiBrightYellow',
  'terminal.ansiBrightBlue',
  'terminal.ansiBrightMagenta',
  'terminal.ansiBrightCyan',
  'terminal.ansiBrightWhite',
];

const ZED_KEYS = [
  'terminal.ansi.black',
  'terminal.ansi.red',
  'terminal.ansi.green',
  'terminal.ansi.yellow',
  'terminal.ansi.blue',
  'terminal.ansi.magenta',
  'terminal.ansi.cyan',
  'terminal.ansi.white',
  'terminal.ansi.bright_black',
  'terminal.ansi.bright_red',
  'terminal.ansi.bright_green',
  'terminal.ansi.bright_yellow',
  'terminal.ansi.bright_blue',
  'terminal.ansi.bright_magenta',
  'terminal.ansi.bright_cyan',
  'terminal.ansi.bright_white',
];

test('VS Code ANSI keys keep their existing spelling', () => {
  assert.deepEqual(
    Array.from({ length: 16 }, (_, slot) => vscodeAnsiKey(slot)),
    VSCODE_KEYS,
  );
});

test('Zed ANSI keys keep their existing spelling', () => {
  assert.deepEqual(
    Array.from({ length: 16 }, (_, slot) => zedAnsiKey(slot)),
    ZED_KEYS,
  );
});

test('Zed dim keys cover the first eight slots', () => {
  assert.deepEqual(
    Array.from({ length: 8 }, (_, slot) => zedDimAnsiKey(slot)),
    ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].map(
      (name) => `terminal.ansi.dim_${name}`,
    ),
  );
});

test('slot names are snake_case', () => {
  assert.equal(ansiSlotName(0), 'black');
  assert.equal(ansiSlotName(15), 'bright_white');
});

test('out-of-range slots fail', () => {
  assert.throws(() => vscodeAnsiKey(16), /out of range/);
  assert.throws(() => zedAnsiKey(-1), /out of range/);
  assert.throws(() => zedDimAnsiKey(8), /out of range/);
});
