import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';

import type { Environment } from './install.ts';
import {
  dshPackageName,
  ghosttyThemesDir,
  install,
  keroThemesDir,
  opencodeThemesDir,
  ROOT,
  zedThemesDir,
} from './install.ts';
import type { InstallOptions, Spawn, SpawnOutcome } from './install.ts';

/** A Windows host with the variables a stock install sets. */
function windows(env: NodeJS.ProcessEnv = {}): Environment {
  return {
    platform: 'win32',
    home: join('C:', 'Users', 'someone'),
    env: { LOCALAPPDATA: join('C:', 'Users', 'someone', 'AppData', 'Local'), APPDATA: join('C:', 'Users', 'someone', 'AppData', 'Roaming'), ...env },
  };
}

function linux(env: NodeJS.ProcessEnv = {}): Environment {
  return { platform: 'linux', home: join('/home', 'someone'), env };
}

test('Zed reads %APPDATA%\\Zed on Windows and ignores XDG', () => {
  assert.equal(zedThemesDir(windows()), join('C:', 'Users', 'someone', 'AppData', 'Roaming', 'Zed', 'themes'));
  assert.equal(
    zedThemesDir(windows({ XDG_CONFIG_HOME: join('D:', 'xdg') })),
    join('C:', 'Users', 'someone', 'AppData', 'Roaming', 'Zed', 'themes'),
  );
});

test('Zed falls back to ~/.config elsewhere', () => {
  assert.equal(zedThemesDir(linux()), join('/home', 'someone', '.config', 'zed', 'themes'));
  assert.equal(zedThemesDir(linux({ XDG_CONFIG_HOME: '/xdg' })), join('/xdg', 'zed', 'themes'));
});

test('a Windows host without APPDATA cannot place Zed themes', () => {
  assert.throws(() => zedThemesDir(windows({ APPDATA: undefined })), /APPDATA is not set/);
});

test('Kero reads %LOCALAPPDATA%\\ghostty\\themes on Windows when XDG is unset', () => {
  assert.equal(
    keroThemesDir(windows()),
    join('C:', 'Users', 'someone', 'AppData', 'Local', 'ghostty', 'themes'),
  );
});

test('Kero prefers XDG_CONFIG_HOME on every platform', () => {
  assert.equal(keroThemesDir(windows({ XDG_CONFIG_HOME: join('D:', 'xdg') })), join('D:', 'xdg', 'ghostty', 'themes'));
  assert.equal(keroThemesDir(linux({ XDG_CONFIG_HOME: '/xdg' })), join('/xdg', 'ghostty', 'themes'));
});

test('Kero falls back to ~/.config on macOS and Linux', () => {
  assert.equal(keroThemesDir(linux()), join('/home', 'someone', '.config', 'ghostty', 'themes'));
  assert.equal(
    keroThemesDir({ platform: 'darwin', home: '/Users/someone', env: {} }),
    join('/Users/someone', '.config', 'ghostty', 'themes'),
  );
});

test('Ghostty keeps the XDG layout, which is not Kero\'s Windows path', () => {
  assert.equal(ghosttyThemesDir(windows({ XDG_CONFIG_HOME: join('D:', 'xdg') })), join('D:', 'xdg', 'ghostty', 'themes'));
  assert.equal(ghosttyThemesDir(linux()), join('/home', 'someone', '.config', 'ghostty', 'themes'));
  assert.notEqual(ghosttyThemesDir(windows()), keroThemesDir(windows()));
});

test('OpenCode uses ~/.config/opencode on Windows too', () => {
  assert.equal(
    opencodeThemesDir(windows()),
    join('C:', 'Users', 'someone', '.config', 'opencode', 'themes'),
  );
});

test('DSH variants map to the package names the build writes', () => {
  assert.equal(dshPackageName('menu'), 'inkstone-dsh');
  assert.equal(dshPackageName('ink'), 'inkstone-dsh-ink');
  assert.equal(dshPackageName('ink-dimmed'), 'inkstone-dsh-ink-dimmed');
  assert.equal(dshPackageName('sea'), 'inkstone-dsh-sea');
});

/** Records what the installer asked to run and returns a canned outcome. */
function fakeSpawn(outcome: SpawnOutcome = { status: 0, signal: null }) {
  const calls: { command: string; args: readonly string[]; cwd: string }[] = [];
  const spawn: Spawn = (command, args, options) => {
    calls.push({ command, args, cwd: options.cwd });
    return outcome;
  };
  return { calls, spawn };
}


function posixOptions(overrides: Partial<InstallOptions> = {}): InstallOptions {
  return { environment: linux(), root: ROOT, dryRun: false, profile: 'web', ...overrides };
}

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

test('POSIX delegates the remaining scripts with their arguments and cwd', () => {
  const { calls, spawn } = fakeSpawn();
  assert.equal(install('zed', [], posixOptions(), fail, spawn), 0);
  assert.deepEqual(calls, [
    { command: 'bash', args: [join(ROOT, 'scripts', 'install-zed.sh')], cwd: ROOT },
  ]);
});

test('Kero falls back to ~/.config when Windows has no LOCALAPPDATA', () => {
  assert.equal(
    keroThemesDir({ platform: 'win32', home: join('C:', 'Users', 'someone'), env: {} }),
    join('C:', 'Users', 'someone', '.config', 'ghostty', 'themes'),
  );
});

test('POSIX targets without arguments still delegate', () => {
  for (const target of ['ghostty', 'kaku', 'opencode', 'zed'] as const) {
    const { calls, spawn } = fakeSpawn();
    install(target, [], posixOptions(), fail, spawn);
    assert.deepEqual(calls[0]?.args, [join(ROOT, 'scripts', `install-${target}.sh`)]);
  }
});

test('the delegated script\'s exit code becomes ours', () => {
  const { spawn } = fakeSpawn({ status: 3, signal: null });
  assert.equal(install('zed', [], posixOptions(), fail, spawn), 3);
});

test('a delegated script killed by a signal maps to the shell\'s 128 + signal', () => {
  const { spawn } = fakeSpawn({ status: null, signal: 'SIGINT' });
  assert.equal(install('zed', [], posixOptions(), fail, spawn), 130);
});

test('a bash that cannot start is reported, not swallowed', () => {
  const { spawn } = fakeSpawn({ status: null, signal: null, error: new Error('spawn bash ENOENT') });
  assert.throws(() => install('zed', [], posixOptions(), fail, spawn), /could not run bash/);
});

test('dsh passes the profile through on every platform', () => {
  const { calls, spawn } = fakeSpawn();
  install('dsh', [], { ...posixOptions(), profile: 'desktop' }, fail, spawn);
  assert.deepEqual(calls[0]?.args, [
    'plugin',
    '--profile',
    'desktop',
    'add',
    join(ROOT, 'dist', 'dsh', 'inkstone-dsh'),
  ]);
});

test('an unusable dsh is reported with the command to run instead', () => {
  const { spawn } = fakeSpawn({ status: null, signal: null, error: new Error('spawn dsh ENOENT') });
  assert.throws(
    () => install('dsh', [], { ...posixOptions(), environment: windows() }, fail, spawn),
    /dsh plugin --profile web add/,
  );
});

test('Windows never shells out to the POSIX scripts', () => {
  const { calls, spawn } = fakeSpawn();
  install('zed', [], { ...posixOptions({ environment: windows() }), dryRun: true }, fail, spawn);
  assert.deepEqual(calls, []);
});
