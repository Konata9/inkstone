/** Shared CLI argument helpers for the release scripts. */

export type Fail = (message: string) => never;

/** Read `--flag value` from process.argv; `fail` handles a missing value. */
export function argValue(flag: string, fail: Fail): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;

  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    fail(`${flag} requires a value`);
  }

  return value;
}
