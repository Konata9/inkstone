import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Environment, InstallOptions, Spawn, SpawnOutcome } from './install.ts';
import {
  dshPackageName,
  ghosttyThemesDir,
  install,
  kakuVersion,
  keroThemesDir,
  opencodeThemesDir,
  versionAtLeast,
  zedThemesDir,
} from './install.ts';

const fail = (message: string): never => {
  throw new Error(message);
};

/** Run an installer without letting its hints into the test output. */
function quiet<T>(run: () => T): T {
  const log = console.log;
  console.log = () => {};
  try {
    return run();
  } finally {
    console.log = log;
  }
}

const tempDirs: string[] = [];

/** A temporary directory, removed when the process exits. */
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'inkstone-install-'));
  tempDirs.push(dir);
  return dir;
}

process.on('exit', () => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** Create files under `<root>/dist/<path>`, as the build would. */
function build(root: string, path: string, files: readonly string[] = []): string {
  const dir = join(root, 'dist', path);
  mkdirSync(dir, { recursive: true });
  for (const file of files) writeFileSync(join(dir, file), 'theme');
  return dir;
}

function environment(platform: NodeJS.Platform, home: string, env: NodeJS.ProcessEnv = {}): Environment {
  return { platform, home, env };
}

function options(root: string, host: Environment, dryRun = false): InstallOptions {
  return { root, environment: host, dryRun, profile: 'web' };
}

/** Records what the installer asked to run and returns a canned outcome. */
function fakeSpawn(outcome: SpawnOutcome = { status: 0, signal: null }) {
  const calls: { command: string; args: readonly string[]; cwd?: string }[] = [];
  const spawn: Spawn = (command, args, spawnOptions) => {
    calls.push({ command, args, cwd: spawnOptions.cwd });
    return outcome;
  };
  return { calls, spawn };
}

function windows(home: string, env: NodeJS.ProcessEnv = {}): Environment {
  return environment('win32', home, { LOCALAPPDATA: join(home, 'AppData', 'Local'), APPDATA: join(home, 'AppData', 'Roaming'), ...env });
}

test('Zed reads %APPDATA%\\Zed on Windows and ignores XDG', () => {
  const home = join('C:', 'Users', 'someone');
  assert.equal(zedThemesDir(windows(home)), join(home, 'AppData', 'Roaming', 'Zed', 'themes'));
  assert.equal(zedThemesDir(windows(home, { XDG_CONFIG_HOME: join('D:', 'xdg') })), join(home, 'AppData', 'Roaming', 'Zed', 'themes'));
});

test('Zed falls back to ~/.config elsewhere', () => {
  assert.equal(zedThemesDir(environment('linux', '/home/someone')), join('/home/someone', '.config', 'zed', 'themes'));
  assert.equal(zedThemesDir(environment('linux', '/home/someone', { XDG_CONFIG_HOME: '/xdg' })), join('/xdg', 'zed', 'themes'));
});

test('Kero reads %LOCALAPPDATA%\\ghostty\\themes on Windows when XDG is unset', () => {
  const home = join('C:', 'Users', 'someone');
  assert.equal(keroThemesDir(windows(home)), join(home, 'AppData', 'Local', 'ghostty', 'themes'));
});

test('Kero prefers XDG_CONFIG_HOME on every platform', () => {
  assert.equal(keroThemesDir(windows(join('C:', 'Users', 'someone'), { XDG_CONFIG_HOME: join('D:', 'xdg') })), join('D:', 'xdg', 'ghostty', 'themes'));
  assert.equal(keroThemesDir(environment('linux', '/home/someone', { XDG_CONFIG_HOME: '/xdg' })), join('/xdg', 'ghostty', 'themes'));
});

test('Kero falls back to ~/.config when Windows has no LOCALAPPDATA', () => {
  const home = join('C:', 'Users', 'someone');
  assert.equal(
    keroThemesDir({ platform: 'win32', home, env: {} }),
    join(home, '.config', 'ghostty', 'themes'),
  );
});

test('Kero falls back to ~/.config on macOS and Linux', () => {
  assert.equal(keroThemesDir(environment('linux', '/home/someone')), join('/home/someone', '.config', 'ghostty', 'themes'));
  assert.equal(keroThemesDir(environment('darwin', '/Users/someone')), join('/Users/someone', '.config', 'ghostty', 'themes'));
});

test('Ghostty and Kero keep different Windows paths', () => {
  const home = join('C:', 'Users', 'someone');
  assert.equal(ghosttyThemesDir(windows(home)), join(home, '.config', 'ghostty', 'themes'));
  assert.notEqual(ghosttyThemesDir(windows(home)), keroThemesDir(windows(home)));
});

test('OpenCode uses ~/.config/opencode on Windows too', () => {
  const home = join('C:', 'Users', 'someone');
  assert.equal(opencodeThemesDir(windows(home)), join(home, '.config', 'opencode', 'themes'));
});

test('DSH variants map to the package names the build writes', () => {
  assert.equal(dshPackageName('menu'), 'inkstone-dsh');
  assert.equal(dshPackageName('ink'), 'inkstone-dsh-ink');
  assert.equal(dshPackageName('ink-dimmed'), 'inkstone-dsh-ink-dimmed');
  assert.equal(dshPackageName('sea'), 'inkstone-dsh-sea');
});

test('versionAtLeast compares up to three numeric components', () => {
  assert.equal(versionAtLeast('0.27.1', '0.27.1'), true);
  assert.equal(versionAtLeast('0.27', '0.27.1'), false);
  assert.equal(versionAtLeast('0.28.0', '0.27.1'), true);
  assert.equal(versionAtLeast('1.0', '0.27.1'), true);
  assert.equal(versionAtLeast('0.27.1-beta', '0.27.1'), true);
});

test('dsh runs the CLI with the plugin command for the chosen variant', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh-sea');
  const { calls, spawn } = fakeSpawn();
  const code = quiet(() => install('dsh', ['sea'], options(root, environment('linux', '/home/someone')), fail, spawn));
  assert.equal(code, 0);
  assert.deepEqual(calls, [
    { command: 'dsh', args: ['plugin', '--profile', 'web', 'add', join(root, 'dist', 'dsh', 'inkstone-dsh-sea')], cwd: root },
  ]);
});

test('dsh reports the CLI exit code and an unknown variant', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { spawn } = fakeSpawn({ status: 2, signal: null });
  assert.equal(quiet(() => install('dsh', [], options(root, environment('linux', '/home/someone')), fail, spawn)), 2);
  assert.throws(
    () => install('dsh', ['purple'], options(root, environment('linux', '/home/someone')), fail, spawn),
    /unknown DSH variant/,
  );
});

test('dsh rejects a second variant', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { spawn } = fakeSpawn();
  assert.throws(
    () => install('dsh', ['menu', 'extra'], options(root, environment('linux', '/home/someone')), fail, spawn),
    /one variant/,
  );
});

test('dsh explains a missing build', () => {
  const root = tempDir();
  const { spawn } = fakeSpawn();
  assert.throws(() => install('dsh', [], options(root, environment('linux', '/home/someone')), fail, spawn), /run pnpm build/);
});

test('dsh passes the profile through', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { calls, spawn } = fakeSpawn();
  quiet(() =>
    install('dsh', [], { ...options(root, environment('linux', '/home/someone')), profile: 'desktop' }, fail, spawn),
  );
  assert.deepEqual(calls[0]?.args, [
    'plugin',
    '--profile',
    'desktop',
    'add',
    join(root, 'dist', 'dsh', 'inkstone-dsh'),
  ]);
});

test('dsh maps a killed child to the shell\'s 128 + signal', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { spawn } = fakeSpawn({ status: null, signal: 'SIGINT' });
  assert.equal(
    quiet(() => install('dsh', [], options(root, environment('linux', '/home/someone')), fail, spawn)),
    130,
  );
});

test('an unusable dsh is reported with the command to run instead', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { spawn } = fakeSpawn({ status: null, signal: null, error: new Error('spawn dsh ENOENT') });
  const home = tempDir();
  assert.throws(
    () => install('dsh', [], options(root, windows(home)), fail, spawn),
    /dsh plugin --profile web add/,
  );
});

test('Ghostty refuses on Windows and copies on Linux', () => {
  const root = tempDir();
  build(root, 'ghostty', ['Inkstone Xuanmo', 'Inkstone Xuanzhi']);
  const home = tempDir();
  assert.throws(
    () => install('ghostty', [], options(root, windows(home)), fail),
    /Ghostty has no Windows build/,
  );
  quiet(() => install('ghostty', [], options(root, environment('linux', home)), fail));
  assert.equal(existsSync(join(home, '.config', 'ghostty', 'themes', 'Inkstone Xuanmo')), true);
});

test('Kero copies to %LOCALAPPDATA% unless XDG_CONFIG_HOME is set', () => {
  const root = tempDir();
  build(root, 'ghostty', ['Inkstone Xuanmo']);
  const home = tempDir();
  quiet(() => install('kero', [], options(root, windows(home)), fail));
  assert.equal(existsSync(join(home, 'AppData', 'Local', 'ghostty', 'themes', 'Inkstone Xuanmo')), true);

  const xdg = tempDir();
  quiet(() => install('kero', [], options(root, windows(home, { XDG_CONFIG_HOME: xdg })), fail));
  assert.equal(existsSync(join(xdg, 'ghostty', 'themes', 'Inkstone Xuanmo')), true);
});

test('OpenCode copies only theme JSON files', () => {
  const root = tempDir();
  build(root, 'opencode', ['inkstone-xuanmo.json', 'inkstone-qingci.json', 'notes.txt']);
  const home = tempDir();
  quiet(() => install('opencode', [], options(root, environment('linux', home)), fail));
  const dir = join(home, '.config', 'opencode', 'themes');
  assert.equal(existsSync(join(dir, 'inkstone-xuanmo.json')), true);
  assert.equal(existsSync(join(dir, 'inkstone-qingci.json')), true);
  assert.equal(existsSync(join(dir, 'notes.txt')), false);
});

test('Zed writes to %APPDATA%\\Zed\\themes on Windows', () => {
  const root = tempDir();
  build(root, 'zed', ['inkstone.json', 'extension.toml']);
  const home = tempDir();
  quiet(() => install('zed', [], options(root, windows(home)), fail));
  assert.equal(existsSync(join(home, 'AppData', 'Roaming', 'Zed', 'themes', 'inkstone.json')), true);
});

test('Kaku refuses off macOS and old versions, installs on 0.27.1+', () => {
  const root = tempDir();
  build(root, 'kaku', ['inkstone-xuanmo.toml']);
  const home = tempDir();
  assert.throws(() => install('kaku', [], options(root, environment('win32', home)), fail), /macOS/);

  const old = fakeSpawn({ status: 0, signal: null, stdout: 'kaku 0.26.4\n' });
  assert.throws(
    () => install('kaku', [], options(root, environment('darwin', home)), fail, old.spawn),
    /older than 0.27.1/,
  );

  const current = fakeSpawn({ status: 0, signal: null, stdout: 'kaku 0.27.1\n' });
  const kakuDir = join(home, '.config', 'kaku');
  mkdirSync(kakuDir, { recursive: true });
  writeFileSync(join(kakuDir, 'inkstone-old.lua'), 'lua');
  quiet(() => install('kaku', [], options(root, environment('darwin', home)), fail, current.spawn));
  assert.equal(existsSync(join(kakuDir, 'colors', 'inkstone-xuanmo.toml')), true);
  assert.equal(existsSync(join(kakuDir, 'inkstone-old.lua')), false);
});

test('Kaku warns when kaku.lua still loads the removed Lua files', () => {
  const root = tempDir();
  build(root, 'kaku', ['inkstone-xuanmo.toml']);
  const home = tempDir();
  const kakuDir = join(home, '.config', 'kaku');
  mkdirSync(kakuDir, { recursive: true });
  writeFileSync(join(kakuDir, 'kaku.lua'), "dofile(wezterm.config_dir .. '/inkstone-xuanmo.lua')\n");
  const spawn = fakeSpawn({ status: 0, signal: null, stdout: 'kaku 0.27.1\n' }).spawn;
  const lines: string[] = [];
  const log = console.log;
  console.log = (...values: unknown[]) => {
    lines.push(values.join(' '));
  };
  try {
    install('kaku', [], options(root, environment('darwin', home)), fail, spawn);
  } finally {
    console.log = log;
  }
  assert.match(lines.join('\n'), /still loads Inkstone Lua files/);
});

test('--dry-run changes nothing', () => {
  const root = tempDir();
  build(root, 'zed', ['inkstone.json']);
  const home = tempDir();
  quiet(() => install('zed', [], options(root, windows(home), true), fail));
  assert.equal(existsSync(join(home, 'AppData')), false);
});

test('dsh maps SIGTERM to 143 too', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const { spawn } = fakeSpawn({ status: null, signal: 'SIGTERM' });
  assert.equal(
    quiet(() => install('dsh', [], options(root, environment('linux', '/home/someone')), fail, spawn)),
    143,
  );
});

test('--dry-run neither spawns dsh nor removes stale Kaku Lua files', () => {
  const root = tempDir();
  build(root, 'dsh/inkstone-dsh');
  const dsh = fakeSpawn();
  quiet(() => install('dsh', [], options(root, environment('linux', '/home/someone'), true), fail, dsh.spawn));
  assert.deepEqual(dsh.calls, []);

  build(root, 'kaku', ['inkstone-xuanmo.toml']);
  const home = tempDir();
  const kakuDir = join(home, '.config', 'kaku');
  mkdirSync(kakuDir, { recursive: true });
  writeFileSync(join(kakuDir, 'inkstone-old.lua'), 'lua');
  const kaku = fakeSpawn({ status: 0, signal: null, stdout: 'kaku 0.27.1\n' });
  quiet(() => install('kaku', [], options(root, environment('darwin', home), true), fail, kaku.spawn));
  assert.equal(existsSync(join(kakuDir, 'inkstone-old.lua')), true);
  assert.equal(existsSync(join(kakuDir, 'colors')), false);
});

test('Kaku reads the bundle version through plutil, and XML as a fallback', () => {
  const dir = tempDir();
  const plist = join(dir, 'Info.plist');
  writeFileSync(
    plist,
    '<plist><dict><key>CFBundleShortVersionString</key><string>0.27.1</string></dict></plist>',
  );
  const spawnWith = (plutilOutcome: SpawnOutcome): Spawn => (command: string) =>
    command === 'kaku'
      ? { status: null, signal: null, error: new Error('spawn kaku ENOENT') }
      : plutilOutcome;

  assert.equal(kakuVersion(spawnWith({ status: 0, signal: null, stdout: '0.28.0\n' }), plist), '0.28.0');
  assert.equal(
    kakuVersion(spawnWith({ status: null, signal: null, error: new Error('no plutil') }), plist),
    '0.27.1',
  );
});

test('symlinked build files are copied, and stale Lua symlinks are removed without their target', { skip: process.platform === 'win32' }, () => {
  const root = tempDir();
  const source = join(root, 'dist', 'ghostty');
  mkdirSync(source, { recursive: true });
  const realTheme = join(root, 'real-theme');
  writeFileSync(realTheme, 'theme');
  symlinkSync(realTheme, join(source, 'Inkstone Xuanmo'));

  const home = tempDir();
  quiet(() => install('kero', [], options(root, environment('linux', home)), fail));
  const copied = join(home, '.config', 'ghostty', 'themes', 'Inkstone Xuanmo');
  assert.equal(existsSync(copied), true);
  assert.equal(lstatSync(copied).isSymbolicLink(), false);
  assert.equal(readFileSync(copied, 'utf8'), 'theme');

  build(root, 'kaku', ['inkstone-xuanmo.toml']);
  const kakuDir = join(home, '.config', 'kaku');
  mkdirSync(kakuDir, { recursive: true });
  const realLua = join(home, 'real.lua');
  writeFileSync(realLua, 'lua');
  const staleLink = join(kakuDir, 'inkstone-old.lua');
  symlinkSync(realLua, staleLink);

  const spawn = fakeSpawn({ status: 0, signal: null, stdout: 'kaku 0.27.1\n' }).spawn;
  quiet(() => install('kaku', [], options(root, environment('darwin', home)), fail, spawn));
  assert.equal(existsSync(staleLink), false);
  assert.equal(existsSync(realLua), true);
});
