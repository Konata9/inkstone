import assert from 'node:assert/strict';
import test from 'node:test';

import { flavorFamilies, validateFlavorRegistry } from './index.ts';
import type { FlavorFamilyGroup } from './index.ts';

function clone(): FlavorFamilyGroup[] {
  return structuredClone(flavorFamilies);
}

test('the shipped registry is consistent', () => {
  assert.deepEqual(validateFlavorRegistry(), []);
});

test('allows a family to contain fewer flavors', () => {
  const families = clone();
  families[0]!.flavors.pop();
  assert.deepEqual(validateFlavorRegistry(families), []);
});

test('rejects a flavor grouped under the wrong family', () => {
  const families = clone();
  const flavor = families[1]!.flavors[0]!;
  flavor.meta.family = 'ink';
  const issues = validateFlavorRegistry(families);
  assert.equal(issues.length, 1);
  assert.match(issues[0]!, /declares family "ink"/);
});

test('rejects a flavor id listed twice', () => {
  const families = clone();
  families[1]!.flavors.push(families[0]!.flavors[0]!);
  const issues = validateFlavorRegistry(families);
  assert.ok(issues.some((issue) => /flavor id "xuanmo" is listed more than once/.test(issue)));
  assert.ok(issues.some((issue) => /display name "Xuanmo" is listed more than once/.test(issue)));
});

test('rejects an empty family', () => {
  const families = clone();
  families[0]!.flavors = [];
  const issues = validateFlavorRegistry(families);
  assert.equal(issues.length, 1);
  assert.match(issues[0]!, /family "ink" has no flavors/);
});

test('rejects a duplicated family id', () => {
  const families = clone();
  families.push({ ...families[0]!, flavors: [] });
  const issues = validateFlavorRegistry(families);
  assert.ok(issues.some((issue) => /family "ink" is listed more than once/.test(issue)));
});
