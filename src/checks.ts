/**
 * The checks every build and validation run shares.
 *
 * `pnpm build` refuses to write files when they fail; `pnpm validate` runs the
 * same stages so a local "test" can never be weaker than the build.
 */

import { audit } from './audit.ts';
import type { AuditReport } from './audit.ts';
import { checkThemes } from './check.ts';
import { validateFlavorRegistry } from './palette/index.ts';

export interface CheckReport {
  ok: boolean;
  audit: AuditReport;
  /** Problems with the flavor registry itself, before any target is generated. */
  registryIssues: string[];
  /** Failures from the generated-target checks. */
  themeIssues: string[];
}

export function runChecks(): CheckReport {
  const report = audit();
  const registryIssues = report.ok ? validateFlavorRegistry() : [];
  const themeIssues = report.ok && registryIssues.length === 0 ? checkThemes() : [];
  return {
    ok: report.ok && registryIssues.length === 0 && themeIssues.length === 0,
    audit: report,
    registryIssues,
    themeIssues,
  };
}

/** Print why a run stopped, labelled with the command that hit the failure. */
export function reportFailures(report: CheckReport, stopped: string): void {
  if (!report.audit.ok) {
    console.error(`${stopped}: fix the palette audit first.`);
  }
  if (report.registryIssues.length > 0) {
    console.error('\nFlavor registry checks failed:');
    for (const issue of report.registryIssues) console.error(`  ✗ ${issue}`);
  }
  if (report.themeIssues.length > 0) {
    console.error('\nTheme checks failed:');
    for (const issue of report.themeIssues) console.error(`  ✗ ${issue}`);
  }
}
