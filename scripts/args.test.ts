import assert from 'node:assert/strict';
import test from 'node:test';

import { parseArgs } from './args.ts';
import type { Fail } from './args.ts';

/** Same contract as the CLI's `fail`, but throws so the test can assert on it. */
const fail: Fail = (message) => {
  throw new Error(message);
};

test('reads --flag value', () => {
  const parsed = parseArgs(['--target', 'vscode'], { valueFlags: ['--target'] }, fail);
  assert.equal(parsed.values.get('--target'), 'vscode');
  assert.equal(parsed.positional.length, 0);
});

test('reads --flag=value', () => {
  const parsed = parseArgs(['--target=vscode'], { valueFlags: ['--target'] }, fail);
  assert.equal(parsed.values.get('--target'), 'vscode');
});

test('rejects a missing value', () => {
  assert.throws(() => parseArgs(['--target'], { valueFlags: ['--target'] }, fail), /requires a value/);
  assert.throws(
    () => parseArgs(['--target', '--force'], { valueFlags: ['--target'], knownFlags: ['--force'] }, fail),
    /requires a value/,
  );
  assert.throws(() => parseArgs(['--target='], { valueFlags: ['--target'] }, fail), /requires a value/);
});

test('rejects a repeated value flag', () => {
  assert.throws(
    () => parseArgs(['--target=a', '--target', 'b'], { valueFlags: ['--target'] }, fail),
    /more than once/,
  );
});

test('rejects unknown flags', () => {
  assert.throws(
    () => parseArgs(['--tga=v0.4.0'], { valueFlags: ['--tag'] }, fail),
    /unknown option --tga/,
  );
});

test('rejects a value on a boolean flag', () => {
  assert.throws(
    () => parseArgs(['--dry-run=yes'], { knownFlags: ['--dry-run'] }, fail),
    /does not take a value/,
  );
});

test('rejects positionals unless allowed', () => {
  assert.throws(() => parseArgs(['stray'], {}, fail), /unexpected argument "stray"/);
  const parsed = parseArgs(['patch'], { allowPositional: true }, fail);
  assert.deepEqual(parsed.positional, ['patch']);
});

test('collects boolean flags and positionals together', () => {
  const parsed = parseArgs(
    ['patch', '--dry-run', '--target=vscode'],
    { valueFlags: ['--target'], knownFlags: ['--dry-run'], allowPositional: true },
    fail,
  );
  assert.deepEqual(parsed.positional, ['patch']);
  assert.equal(parsed.flags.has('--dry-run'), true);
  assert.equal(parsed.values.get('--target'), 'vscode');
});
