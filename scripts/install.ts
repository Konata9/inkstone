#!/usr/bin/env tsx
/**
 * Install the built Inkstone themes for one target.
 *
 * POSIX keeps the existing `scripts/install-*.sh` scripts: this entry delegates
 * to them, so their output, defaults and exit codes stay the ones users already
 * had. Windows has no guaranteed `bash` — pnpm runs scripts through `cmd.exe`,
 * and `bash` resolves to whatever is on PATH (often WSL's, which writes into a
 * Linux home, or Git Bash's, which writes into `~/.config` of the Windows user),
 * so the Windows branches below are native and name each app's real directory.
 *
 * Usage: tsx scripts/install.ts <target> [variant] [--profile <name>] [--dry-run]
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir, platform as hostPlatform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createFail, parseArgs } from './args.ts';

export type Target = 'dsh' | 'ghostty' | 'kero' | 'kaku' | 'opencode' | 'zed';

export const TARGETS: readonly Target[] = ['dsh', 'ghostty', 'kero', 'kaku', 'opencode', 'zed'];

/** The repository root, with a trailing separator. */
export const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Everything the installers read from the host; explicit so tests can vary it. */
export interface Environment {
  platform: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
  home: string;
}

export function hostEnvironment(): Environment {
  return { platform: hostPlatform(), env: process.env, home: homedir() };
}

/** `$XDG_CONFIG_HOME`, else `~/.config` — the layout the POSIX scripts use. */
export function configHome(environment: Environment): string {
  const xdg = environment.env.XDG_CONFIG_HOME;
  return xdg ? xdg : join(environment.home, '.config');
}

/**
 * Zed's user theme directory: `~/.config/zed/themes` on macOS and Linux,
 * `%APPDATA%\Zed\themes` on Windows (Zed ignores the XDG variables there).
 */
export function zedThemesDir(environment: Environment): string {
  if (environment.platform === 'win32') {
    const appData = environment.env.APPDATA;
    if (!appData) throw new Error('APPDATA is not set; cannot locate Zed\'s theme directory');
    return join(appData, 'Zed', 'themes');
  }
  return join(configHome(environment), 'zed', 'themes');
}

/** Ghostty's own theme directory: `$XDG_CONFIG_HOME/ghostty/themes`, else `~/.config/ghostty/themes`. */
export function ghosttyThemesDir(environment: Environment): string {
  return join(configHome(environment), 'ghostty', 'themes');
}

/**
 * Kero's theme directory. Kero reads Ghostty themes and resolves them as
 * `$XDG_CONFIG_HOME`, then `%LOCALAPPDATA%` on Windows, then `~/.config`
 * (mygo `terminal.ghosttyThemesDir`), so this is not Ghostty's path on Windows.
 */
export function keroThemesDir(environment: Environment): string {
  const xdg = environment.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, 'ghostty', 'themes');
  if (environment.platform === 'win32') {
    const localAppData = environment.env.LOCALAPPDATA;
    if (localAppData) return join(localAppData, 'ghostty', 'themes');
  }
  return join(environment.home, '.config', 'ghostty', 'themes');
}

/** OpenCode's global theme directory, the same on every platform. */
export function opencodeThemesDir(environment: Environment): string {
  return join(configHome(environment), 'opencode', 'themes');
}

export type DshVariant = 'menu' | 'ink' | 'ink-dimmed' | 'sea';

const DSH_VARIANTS: readonly DshVariant[] = ['menu', 'ink', 'ink-dimmed', 'sea'];

export function dshPackageName(variant: DshVariant): string {
  return variant === 'menu' ? 'inkstone-dsh' : `inkstone-dsh-${variant}`;
}

const THEME_NAMES = [
  'Inkstone Xuanzhi',
  'Inkstone Xuanzhi Dimmed',
  'Inkstone Xuanmo',
  'Inkstone Xuanmo Dimmed',
  'Inkstone Canghai',
  'Inkstone Qingci',
] as const;

export interface InstallOptions {
  environment: Environment;
  root: string;
  dryRun: boolean;
  profile: string;
}

/** The part of `spawnSync` the installers use, so tests can stand in for it. */
export interface SpawnOutcome {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
}

export type Spawn = (
  command: string,
  args: readonly string[],
  options: { cwd: string; stdio: 'inherit' },
) => SpawnOutcome;

const defaultSpawn: Spawn = (command, args, options) =>
  spawnSync(command, [...args], { cwd: options.cwd, stdio: options.stdio });

type Fail = (message: string) => never;

/** Copy the files a target's build wrote; returns how many. */
function copyThemes(
  sourceDir: string,
  targetDir: string,
  matches: (name: string) => boolean,
  options: InstallOptions,
  fail: Fail,
): number {
  if (!existsSync(sourceDir)) {
    fail(`nothing built in ${sourceDir} — run pnpm build first`);
  }
  const files = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matches(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (files.length === 0) {
    fail(`no theme files in ${sourceDir} — run pnpm build first`);
  }
  if (options.dryRun) {
    console.log(`[dry-run] copy ${files.length} file(s) from ${sourceDir} to ${targetDir}`);
    return files.length;
  }
  mkdirSync(targetDir, { recursive: true });
  for (const file of files) {
    copyFileSync(join(sourceDir, file), join(targetDir, file));
  }
  console.log(`Installed ${files.length} file(s) to ${targetDir}`);
  return files.length;
}

function printKeroHint(): void {
  console.log('');
  console.log('Reload Kero (quit it from the notification area, or reopen the app) and pick one');
  console.log('under Settings → Appearance → Colors, for Light and for Dark:');
  console.log('');
  for (const name of THEME_NAMES) console.log(`  ${name}`);
}

/** Exit code for a child killed by a signal; shells report 128 + the signal. */
const SIGNAL_EXIT: Record<string, number> = { SIGINT: 130, SIGTERM: 143 };

/** Run the POSIX reference script, keeping its output, exit code and signals. */
function runPosixScript(
  target: Target,
  args: readonly string[],
  options: InstallOptions,
  fail: Fail,
  spawn: Spawn,
): number {
  const script = join(options.root, 'scripts', `install-${target}.sh`);
  if (!existsSync(script)) {
    fail(`missing ${script}`);
  }
  if (options.dryRun) {
    console.log(`[dry-run] bash ${script} ${args.join(' ')}`.trimEnd());
    return 0;
  }
  const result = spawn('bash', [script, ...args], { cwd: options.root, stdio: 'inherit' });
  if (result.error) {
    fail(`could not run bash: ${result.error.message}`);
  }
  if (result.signal) {
    return SIGNAL_EXIT[result.signal] ?? 1;
  }
  return result.status ?? 1;
}

function installDsh(args: readonly string[], options: InstallOptions, fail: Fail, spawn: Spawn): number {
  const variant = (args[0] ?? 'menu') as DshVariant;
  if (!DSH_VARIANTS.includes(variant)) {
    fail(`unknown DSH variant "${variant}"; use ${DSH_VARIANTS.join(' | ')}`);
  }
  if (args.length > 1) {
    fail(`unexpected argument "${args[1]}"; dsh takes one variant`);
  }
  const dir = join(options.root, 'dist', 'dsh', dshPackageName(variant));
  if (!existsSync(dir)) {
    fail(`nothing built in ${dir} — run pnpm build first`);
  }
  const command = ['plugin', '--profile', options.profile, 'add', dir];
  if (options.dryRun) {
    console.log(`[dry-run] dsh ${command.join(' ')}`);
    return 0;
  }
  const result = spawn('dsh', command, { cwd: options.root, stdio: 'inherit' });
  if (result.error) {
    // A `.cmd`-only shim (npm global install) cannot be started by CreateProcess,
    // and quoting a path through `cmd.exe /c` is not reliable, so point at the
    // command instead of guessing.
    fail(
      [
        `could not run dsh: ${result.error.message}`,
        '',
        'Run the plugin install yourself:',
        `  dsh plugin --profile ${options.profile} add "${dir}"`,
      ].join('\n'),
    );
  }
  const status = result.signal ? (SIGNAL_EXIT[result.signal] ?? 1) : result.status ?? 1;
  if (status === 0) {
    console.log('');
    console.log(`Installed ${dshPackageName(variant)}. Restart \`dsh web\` to apply.`);
    console.log(`Remove it with: dsh plugin --profile ${options.profile} remove ${dshPackageName(variant)}`);
  }
  return status;
}

/**
 * Install one target. Returns the process exit code; throws nothing, so the CLI
 * has a single exit path.
 */
export function install(
  target: Target,
  args: readonly string[],
  options: InstallOptions,
  fail: Fail,
  spawn: Spawn = defaultSpawn,
): number {
  const { environment } = options;
  const windows = environment.platform === 'win32';

  switch (target) {
    case 'dsh':
      return installDsh(args, options, fail, spawn);

    case 'ghostty':
      if (windows) {
        fail(
          [
            'Ghostty has no Windows build, so there is no Ghostty theme directory to install into.',
            '',
            'If you use Kero (it reads Ghostty themes), run:',
            '  pnpm install:kero',
          ].join('\n'),
        );
      }
      return runPosixScript(target, args, options, fail, spawn);

    case 'kero':
      copyThemes(join(options.root, 'dist', 'ghostty'), keroThemesDir(environment), () => true, options, fail);
      printKeroHint();
      return 0;

    case 'kaku':
      if (windows) {
        fail('Kaku is a macOS app; there is nothing to install on Windows.');
      }
      return runPosixScript(target, args, options, fail, spawn);

    case 'opencode':
      if (windows) {
        copyThemes(
          join(options.root, 'dist', 'opencode'),
          opencodeThemesDir(environment),
          (name) => name.startsWith('inkstone-') && name.endsWith('.json'),
          options,
          fail,
        );
        console.log('');
        console.log('Pick one under /themes, or pin it in ~/.config/opencode/cli.json:');
        console.log('  { "theme": { "name": "inkstone-xuanmo-dimmed", "mode": "dark" } }');
        return 0;
      }
      return runPosixScript(target, args, options, fail, spawn);

    case 'zed':
      if (windows) {
        copyThemes(
          join(options.root, 'dist', 'zed'),
          zedThemesDir(environment),
          (name) => name === 'inkstone.json',
          options,
          fail,
        );
        console.log('');
        const shortcut = environment.platform === 'darwin' ? 'Cmd+K Cmd+T' : 'Ctrl+K Ctrl+T';
        console.log(`Restart Zed, then pick a theme from the theme selector (${shortcut}).`);
        return 0;
      }
      return runPosixScript(target, args, options, fail, spawn);
  }
}

const USAGE = `Usage: tsx scripts/install.ts <target> [variant] [--profile <name>] [--dry-run]

Targets:
  dsh        install an Inkstone plugin into the DSH web profile
             optional variant: menu (default) | ink | ink-dimmed | sea
  ghostty    copy the themes into Ghostty's theme directory (macOS and Linux)
  kero       copy the themes where Kero reads them (Settings → Appearance → Colors)
  kaku       copy the TOML schemes into Kaku's colour directory (macOS)
  opencode   copy the themes into OpenCode's global theme directory
  zed        copy the theme into Zed's user theme directory

Options:
  --profile <name>  DSH profile to install into (default: web)
  --dry-run         print what would be copied or run, and change nothing`;

function main(argv: readonly string[]): number {
  const fail = createFail('inkstone install');
  const parsed = parseArgs(
    argv,
    { valueFlags: ['--profile'], knownFlags: ['--dry-run', '--help'], allowPositional: true },
    fail,
  );
  if (parsed.flags.has('--help')) {
    console.log(USAGE);
    return 0;
  }

  const target = parsed.positional[0];
  if (!target) {
    console.error(`\ninkstone install: missing target\n\n${USAGE}\n`);
    return 1;
  }
  if (!TARGETS.includes(target as Target)) {
    fail(`unknown target "${target}"; use ${TARGETS.join(' | ')}`);
  }

  const environment = hostEnvironment();
  const options: InstallOptions = {
    environment,
    root: ROOT,
    dryRun: parsed.flags.has('--dry-run'),
    profile: parsed.values.get('--profile') ?? 'web',
  };
  return install(target as Target, parsed.positional.slice(1), options, fail);
}

/** Run only when invoked as a script; the tests import the helpers above. */
const invoked = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invoked === import.meta.url) {
  process.exitCode = main(process.argv.slice(2));
}
