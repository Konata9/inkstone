/**
 * The checks every build and validation run shares.
 *
 * `pnpm build` refuses to write files when they fail; `pnpm validate` runs the
 * same two stages so a local "test" can never be weaker than the build.
 */

import { audit } from './audit.ts';
import type { AuditReport } from './audit.ts';
import { checkThemes } from './check.ts';

export interface CheckReport {
  ok: boolean;
  audit: AuditReport;
  /** Failures from the generated-target checks; empty when the audit failed. */
  themeIssues: string[];
}

export function runChecks(): CheckReport {
  const report = audit();
  const themeIssues = report.ok ? checkThemes() : [];
  return {
    ok: report.ok && themeIssues.length === 0,
    audit: report,
    themeIssues,
  };
}

/** Print why a run stopped, labelled with the command that hit the failure. */
export function reportFailures(report: CheckReport, stopped: string): void {
  if (!report.audit.ok) {
    console.error(`${stopped}: fix the palette audit first.`);
  }
  if (report.themeIssues.length > 0) {
    console.error('\nTheme checks failed:');
    for (const issue of report.themeIssues) console.error(`  ✗ ${issue}`);
  }
}
