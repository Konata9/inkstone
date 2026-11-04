/** Shared CLI argument helpers for the release scripts. */

export type Fail = (message: string) => never;

export interface ParsedArgs {
  /** Values for `--flag value` and `--flag=value`, keyed by flag name. */
  values: Map<string, string>;
  /** Boolean flags that were present. */
  flags: Set<string>;
  /** Arguments that are not flags. */
  positional: string[];
}

export interface ParseOptions {
  /** Flags that take a value, e.g. `--target`. */
  valueFlags?: readonly string[];
  /** Boolean flags that must not carry a value. */
  knownFlags?: readonly string[];
  /** When false (the default), positional arguments fail. */
  allowPositional?: boolean;
}

/**
 * Parse `process.argv.slice(2)`.
 *
 * Both `--flag value` and `--flag=value` are accepted. Duplicate value flags,
 * unknown flags, missing values and unexpected positionals all call `fail`
 * instead of being ignored, so a typo cannot silently fall back to a default.
 */
export function parseArgs(
  argv: readonly string[],
  options: ParseOptions,
  fail: Fail,
): ParsedArgs {
  const valueFlags = new Set(options.valueFlags ?? []);
  const knownFlags = new Set([...valueFlags, ...(options.knownFlags ?? [])]);
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;

    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const equals = arg.indexOf('=');
    const name = equals === -1 ? arg : arg.slice(0, equals);
    const inline = equals === -1 ? undefined : arg.slice(equals + 1);

    if (!knownFlags.has(name)) fail(`unknown option ${name}`);

    if (valueFlags.has(name)) {
      if (values.has(name)) fail(`${name} was given more than once`);
      const value = inline ?? argv[index + 1];
      if (inline === undefined) index += 1;
      if (!value || value.startsWith('--')) fail(`${name} requires a value`);
      values.set(name, value);
      continue;
    }

    if (inline !== undefined) fail(`${name} does not take a value`);
    if (flags.has(name)) fail(`${name} was given more than once`);
    flags.add(name);
  }

  if (!options.allowPositional && positional.length > 0) {
    fail(`unexpected argument "${positional[0]}"`);
  }

  return { values, flags, positional };
}

/** A `fail` implementation that prints a labelled message and exits. */
export function createFail(prefix: string): Fail {
  return (message: string): never => {
    console.error(`\n${prefix}: ${message}\n`);
    process.exit(1);
  };
}
