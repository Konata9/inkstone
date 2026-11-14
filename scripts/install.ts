#!/usr/bin/env tsx
/**
 * Install the built Inkstone themes for one target.
 *
 * This is the only install implementation: it runs the same on macOS, Linux and
 * Windows, and it knows where each app actually reads its themes. The previous
 * `scripts/install-*.sh` wrappers are gone because pnpm runs scripts through
 * `cmd.exe` on Windows, where `bash` resolves to whatever happens to be on
 * PATH — WSL's (which writes into a Linux home and has no `dsh`), or Git
 * Bash's (which writes `~/.config`, where Zed, OpenCode and Kero do not all
 * look on Windows).
 *
 * Usage: tsx scripts/install.ts <target> [variant] [--profile <name>] [--dry-run]
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir, platform as hostPlatform } from 'node:os';
import { dirname, join } from 'node:path';
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

/** `$XDG_CONFIG_HOME`, else `~/.config` — the layout the apps share on POSIX. */
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
    if (!appData) throw new Error("APPDATA is not set; cannot locate Zed's theme directory");
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

/** Kaku lists TOML files from its colours directory from this version on. */
export const KAKU_MIN_VERSION = '0.27.1';

const KAKU_APP_PLIST = '/Applications/Kaku.app/Contents/Info.plist';

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
  stdout?: string;
  error?: Error;
}

export type Spawn = (
  command: string,
  args: readonly string[],
  options: { cwd?: string; stdio: 'inherit' | 'pipe' },
) => SpawnOutcome;

const defaultSpawn: Spawn = (command, args, options) => {
  const result = spawnSync(command, [...args], {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.stdio,
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: typeof result.stdout === 'string' ? result.stdout : undefined,
    error: result.error ?? undefined,
  };
};

type Fail = (message: string) => never;

/** Exit code for a child killed by a signal; shells report 128 + the signal. */
const SIGNAL_EXIT: Record<string, number> = { SIGINT: 130, SIGTERM: 143 };

/** Names of the files a build wrote for a target. */
function builtFiles(sourceDir: string, matches: (name: string) => boolean, fail: Fail): string[] {
  if (!existsSync(sourceDir)) {
    fail(`nothing built in ${sourceDir} — run pnpm build first`);
  }
  const files = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => (entry.isFile() || entry.isSymbolicLink()) && matches(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (files.length === 0) {
    fail(`no theme files in ${sourceDir} — run pnpm build first`);
  }
  return files;
}

function copyFiles(
  sourceDir: string,
  targetDir: string,
  files: readonly string[],
  options: InstallOptions,
): void {
  if (options.dryRun) {
    console.log(`[dry-run] copy ${files.length} file(s) from ${sourceDir} to ${targetDir}`);
    return;
  }
  mkdirSync(targetDir, { recursive: true });
  for (const file of files) {
    copyFileSync(join(sourceDir, file), join(targetDir, file));
  }
}

/** Copy one target's built themes into an app directory and report it. */
function installThemes(
  sourceDir: string,
  targetDir: string,
  matches: (name: string) => boolean,
  options: InstallOptions,
  fail: Fail,
  summary: (targetDir: string, count: number) => string = (dir, count) => `Installed ${count} file(s) to ${dir}`,
): number {
  const files = builtFiles(sourceDir, matches, fail);
  if (options.dryRun) {
    copyFiles(sourceDir, targetDir, files, options);
    return files.length;
  }
  copyFiles(sourceDir, targetDir, files, options);
  console.log(summary(targetDir, files.length));
  return files.length;
}

function printKeroHint(): void {
  console.log('');
  console.log('Reload Kero (quit it from the notification area, or reopen the app) and pick one');
  console.log('under Settings → Appearance → Colors, for Light and for Dark:');
  console.log('');
  for (const name of THEME_NAMES) console.log(`  ${name}`);
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

function installGhostty(options: InstallOptions, fail: Fail): number {
  if (options.environment.platform === 'win32') {
    fail(
      [
        'Ghostty has no Windows build, so there is no Ghostty theme directory to install into.',
        '',
        'If you use Kero (it reads Ghostty themes), run:',
        '  pnpm install:kero',
      ].join('\n'),
    );
  }
  const dir = ghosttyThemesDir(options.environment);
  installThemes(join(options.root, 'dist', 'ghostty'), dir, () => true, options, fail, (target) => `Installed to ${target}`);
  console.log('');
  console.log(`Add one of these lines to ${join(configHome(options.environment), 'ghostty', 'config')}:`);
  console.log('');
  console.log('  theme = light:Inkstone Xuanzhi,dark:Inkstone Xuanmo');
  console.log('  theme = light:Inkstone Xuanzhi Dimmed,dark:Inkstone Xuanmo Dimmed');
  console.log('  theme = light:Inkstone Qingci,dark:Inkstone Canghai');
  console.log('');
  console.log('Then reload Ghostty (Cmd+Shift+, on macOS).');
  return 0;
}

function installKero(options: InstallOptions, fail: Fail): number {
  const dir = keroThemesDir(options.environment);
  installThemes(join(options.root, 'dist', 'ghostty'), dir, () => true, options, fail);
  printKeroHint();
  return 0;
}

function parseVersion(text: string): number[] {
  return text
    .split('-')[0]!
    .split('.')
    .map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0);
}

/** True when `version` is at least `minimum`, comparing up to three components. */
export function versionAtLeast(version: string, minimum: string): boolean {
  const candidate = parseVersion(version);
  const floor = parseVersion(minimum);
  for (let index = 0; index < 3; index += 1) {
    const left = candidate[index] ?? 0;
    const right = floor[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

/** The installed Kaku version, from its CLI or its app bundle; "" when unknown. */
export function kakuVersion(spawn: Spawn, plistPath: string = KAKU_APP_PLIST): string {
  const cli = spawn('kaku', ['--version'], { stdio: 'pipe' });
  if (!cli.error) {
    const first = (cli.stdout ?? '').trim().split(/\r?\n/)[0]?.trim() ?? '';
    const version = first.split(/\s+/).pop() ?? '';
    if (version) return version;
  }
  if (!existsSync(plistPath)) return '';
  // plutil reads XML and binary plists alike; the XML parse is the fallback.
  const plutil = spawn(
    'plutil',
    ['-extract', 'CFBundleShortVersionString', 'raw', plistPath],
    { stdio: 'pipe' },
  );
  if (!plutil.error && plutil.status === 0) {
    const version = (plutil.stdout ?? '').trim();
    if (version) return version;
  }
  const plist = readFileSync(plistPath, 'utf8');
  const match = /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/.exec(plist);
  return match?.[1]?.trim() ?? '';
}

function kakuGuidance(version: string, target: string, root: string): string {
  const found = version
    ? `Kaku ${version} is older than ${KAKU_MIN_VERSION}, the first version that lists\ncustom themes from ${target}/colors/.`
    : 'Kaku was not found on this machine.';
  return [
    found,
    `Inkstone needs Kaku ${KAKU_MIN_VERSION} or newer; nothing was installed.`,
    '',
    'Update Kaku first (kaku update, or https://github.com/tw93/Kaku/releases),',
    'then run pnpm install:kaku again.',
    '',
    'To stay on this version, install the Lua tables by hand:',
    '',
    `  mkdir -p ${target}`,
    `  cp ${join(root, 'dist', 'kaku')}/inkstone-*.lua ${target}/`,
    '',
    `Then add these three lines to ${join(target, 'kaku.lua')}:`,
    '',
    '  config.color_schemes = config.color_schemes or {}',
    "  config.color_schemes['Inkstone Xuanmo'] = dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')",
    "  config.color_scheme = 'Inkstone Xuanmo'",
  ].join('\n');
}

function installKaku(options: InstallOptions, fail: Fail, spawn: Spawn): number {
  const environment = options.environment;
  if (environment.platform !== 'darwin') {
    fail(
      [
        'Kaku is a macOS app; there is nothing to install on this platform.',
        '',
        'WezTerm reads the same schemes: copy dist/kaku/inkstone-*.lua into ~/.config/wezterm/',
        'and load them from wezterm.lua (see the Kaku / WezTerm section of the docs).',
      ].join('\n'),
    );
  }
  const target = join(configHome(environment), 'kaku');
  const version = kakuVersion(spawn);
  if (!version || !versionAtLeast(version, KAKU_MIN_VERSION)) {
    fail(kakuGuidance(version, target, options.root));
  }

  const colors = join(target, 'colors');
  const files = builtFiles(join(options.root, 'dist', 'kaku'), (name) => /^inkstone-.*\.toml$/.test(name), fail);

  // Drop the Lua copies older installs left behind, so a stale table cannot
  // shadow the TOML scheme of the same name.
  const stale = existsSync(target)
    ? readdirSync(target, { withFileTypes: true })
        .filter((entry) => (entry.isFile() || entry.isSymbolicLink()) && /^inkstone-.*\.lua$/.test(entry.name))
        .map((entry) => entry.name)
    : [];
  if (!options.dryRun) {
    mkdirSync(colors, { recursive: true });
    for (const file of stale) rmSync(join(target, file));
  }
  copyFiles(join(options.root, 'dist', 'kaku'), colors, files, options);
  if (options.dryRun) return 0;

  console.log('Installed:');
  console.log(`  ${files.length} schemes in ${colors}/  (listed in Kaku Settings → Theme)`);
  if (stale.length > 0) {
    console.log(`Removed ${stale.length} old Lua file(s) from ${target}.`);
  }
  console.log('');
  console.log('Open Settings (Cmd+,) and pick one:');
  console.log('  玄墨 Xuanmo (dark)               Inkstone Xuanmo');
  console.log('  玄墨 Dimmed (muted dark)         Inkstone Xuanmo Dimmed');
  console.log('  宣纸 Xuanzhi (warm light)        Inkstone Xuanzhi');
  console.log('  宣纸 Dimmed (muted warm light)   Inkstone Xuanzhi Dimmed');
  console.log('  沧海 Canghai (deep-sea dark)     Inkstone Canghai');
  console.log('  青瓷 Qingci (celadon light)      Inkstone Qingci');
  console.log('');
  console.log('Kaku writes config.color_scheme for you.');

  // Removing the Lua files breaks any kaku.lua that still loads them.
  const kakuLua = join(target, 'kaku.lua');
  if (existsSync(kakuLua)) {
    const references = readFileSync(kakuLua, 'utf8')
      .split(/\r?\n/)
      .map((line, index) => ({ line: index + 1, text: line }))
      .filter((entry) => /inkstone-.*\.lua/.test(entry.text));
    if (references.length > 0) {
      console.log('');
      console.log(`Warning: ${kakuLua} still loads Inkstone Lua files:`);
      for (const entry of references) console.log(`  ${entry.line}:${entry.text}`);
      console.log('Those dofile() lines will fail now that the Lua files are gone.');
      console.log("Delete or comment them; a plain config.color_scheme = 'Inkstone Xuanmo'");
      console.log('still matches the TOML scheme.');
    }
  }

  console.log('');
  console.log('Kaku reloads the config automatically.');
  return 0;
}

function installOpencode(options: InstallOptions, fail: Fail): number {
  const environment = options.environment;
  const dir = opencodeThemesDir(environment);
  installThemes(
    join(options.root, 'dist', 'opencode'),
    dir,
    (name) => name.startsWith('inkstone-') && name.endsWith('.json'),
    options,
    fail,
    (target) => `Installed to ${target}`,
  );
  console.log('');
  console.log(`Select one with /themes, or pin it in ${join(configHome(environment), 'opencode', 'cli.json')}:`);
  console.log('');
  console.log('{');
  console.log('  "$schema": "https://opencode.ai/v2/cli.json",');
  console.log('  "theme": { "name": "inkstone-xuanmo-dimmed", "mode": "dark" }');
  console.log('}');
  console.log('');
  console.log('Dark:  inkstone-xuanmo, inkstone-xuanmo-dimmed, inkstone-canghai');
  console.log('Light: inkstone-xuanzhi, inkstone-xuanzhi-dimmed, inkstone-qingci');
  console.log('');
  console.log('Restart OpenCode after adding a new theme file.');
  return 0;
}

function installZed(options: InstallOptions, fail: Fail): number {
  const environment = options.environment;
  const dir = zedThemesDir(environment);
  installThemes(join(options.root, 'dist', 'zed'), dir, (name) => name === 'inkstone.json', options, fail, (target) => `Installed to ${join(target, 'inkstone.json')}`);
  console.log('');
  const shortcut = environment.platform === 'darwin' ? 'Cmd+K Cmd+T' : 'Ctrl+K Ctrl+T';
  if (environment.platform === 'win32') {
    console.log(`Restart Zed, then pick a theme from the theme selector (${shortcut}).`);
    console.log('');
  }
  console.log(`Select one with the theme selector (${shortcut}), or configure in`);
  console.log(`${join(dirname(dir), 'settings.json')}:`);
  console.log('');
  console.log('{');
  console.log('  "theme": {');
  console.log('    "mode": "system",');
  console.log('    "light": "墨观 · 宣纸 (Inkstone Xuanzhi)",');
  console.log('    "dark": "墨观 · 玄墨 (Inkstone Xuanmo)"');
  console.log('  }');
  console.log('}');
  console.log('');
  console.log('Available themes:');
  console.log('  Dark:  墨观 · 玄墨 (Inkstone Xuanmo)');
  console.log('         墨观 · 玄墨 Dimmed (Inkstone Xuanmo Dimmed)');
  console.log('         墨观 · 沧海 (Inkstone Canghai)');
  console.log('  Light: 墨观 · 宣纸 (Inkstone Xuanzhi)');
  console.log('         墨观 · 宣纸 Dimmed (Inkstone Xuanzhi Dimmed)');
  console.log('         墨观 · 青瓷 (Inkstone Qingci)');
  return 0;
}

/**
 * Install one target. Returns the process exit code; failures go through
 * `fail`, so the CLI has a single exit path.
 */
export function install(
  target: Target,
  args: readonly string[],
  options: InstallOptions,
  fail: Fail,
  spawn: Spawn = defaultSpawn,
): number {
  switch (target) {
    case 'dsh':
      return installDsh(args, options, fail, spawn);
    case 'ghostty':
      return installGhostty(options, fail);
    case 'kero':
      return installKero(options, fail);
    case 'kaku':
      return installKaku(options, fail, spawn);
    case 'opencode':
      return installOpencode(options, fail);
    case 'zed':
      return installZed(options, fail);
  }
}

const USAGE = `Usage: tsx scripts/install.ts <target> [variant] [--profile <name>] [--dry-run]

Targets:
  dsh        install an Inkstone plugin into the DSH web profile
             optional variant: menu (default) | ink | ink-dimmed | sea
  ghostty    copy the themes into Ghostty's theme directory (macOS and Linux)
  kero       copy the themes where Kero reads them (Settings → Appearance → Colors)
  kaku       copy the TOML schemes into Kaku's colour directory (macOS 0.27.1+)
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

  const args = parsed.positional.slice(1);
  if (target !== 'dsh' && args.length > 0) {
    fail(`unexpected argument "${args[0]}"; only dsh takes a variant`);
  }

  const options: InstallOptions = {
    environment: hostEnvironment(),
    root: ROOT,
    dryRun: parsed.flags.has('--dry-run'),
    profile: parsed.values.get('--profile') ?? 'web',
  };
  return install(target as Target, args, options, fail);
}

/** Run only when invoked as a script; the tests import the helpers above. */
const invoked = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invoked === import.meta.url) {
  process.exitCode = main(process.argv.slice(2));
}
