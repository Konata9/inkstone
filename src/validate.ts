#!/usr/bin/env tsx
/**
 * Validate the palettes and every generated target without writing files.
 * `pnpm test` runs this, so it must cover exactly what the build gates on.
 */
import { reportFailures, runChecks } from './checks.ts';

const checks = runChecks();
if (!checks.ok) {
  reportFailures(checks, 'Validation stopped');
  process.exitCode = 1;
}
