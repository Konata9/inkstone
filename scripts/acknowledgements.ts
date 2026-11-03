/**
 * Build a changelog Acknowledgements block from the commits in a release.
 *
 * External contributions usually arrive as merged pull requests, so the PR
 * author is the most reliable GitHub handle: merge commits record it as
 * `Merge pull request #123 from <login>/<branch>`. Direct commits fall back to
 * a GitHub noreply address (`123+login@users.noreply.github.com`) or the git
 * author name. Maintainers are filtered out.
 */

import { git } from './git.ts';

const MAINTAINER_LOGINS = new Set(['konata9']);

function isMaintainerEmail(email: string): boolean {
  const value = email.toLowerCase();
  return value === 'maochichen@163.com' || value.startsWith('maochichen@');
}

function isMaintainerLogin(login: string): boolean {
  return MAINTAINER_LOGINS.has(login.toLowerCase());
}

function githubLoginFromEmail(email: string): string | undefined {
  return /^\d+\+([^@]+)@users\.noreply\.github\.com$/i.exec(email)?.[1];
}

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function bullet(label: string, contribution: string, reference?: string): string {
  const title = contribution || 'contribution';
  return reference ? `${label} — ${title} (${reference})` : `${label} — ${title}`;
}

/** Previous tag for a release stream, e.g. `v0.3.5` or `vscode-v0.3.6`. */
export function previousTag(match: string): string | undefined {
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', match) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Acknowledgements for `${fromRef}..${toRef}`, one bullet per contributor.
 * Returns an empty array when only maintainers contributed.
 */
export function findAcknowledgements(fromRef: string, toRef = 'HEAD'): string[] {
  const output = git(
    'log',
    '--first-parent',
    '--format=%an%x1f%ae%x1f%B%x1e',
    `${fromRef}..${toRef}`,
  );
  const seen = new Set<string>();
  const bullets: string[] = [];

  const add = (value: string): void => {
    if (!seen.has(value)) {
      seen.add(value);
      bullets.push(value);
    }
  };

  for (const record of output.split('\x1e')) {
    const [name = '', email = '', body = ''] = record.replace(/^\n+/, '').split('\x1f');
    if (!name && !email) continue;

    const lines = body.trim().split('\n');
    const subject = clean(lines[0] ?? '');
    const pr = /^Merge pull request #(\d+) from ([^/\s]+)\//.exec(subject);

    if (pr) {
      const [, number, login] = pr;
      if (isMaintainerLogin(login!)) continue;

      const title = clean(lines.slice(1).find((line) => line.trim().length > 0) ?? '');
      add(bullet(`@${login}`, title, `#${number}`));
    } else if (subject && !isMaintainerEmail(email)) {
      const login = githubLoginFromEmail(email);
      add(bullet(login ? `@${login}` : clean(name), subject));
    }

    for (const match of body.matchAll(/^Co-authored-by:\s*(.+?)\s*<([^>]+)>$/gim)) {
      const coAuthor = clean(match[1] ?? '');
      const coEmail = match[2] ?? '';
      if (isMaintainerEmail(coEmail)) continue;

      const login = githubLoginFromEmail(coEmail);
      add(bullet(login ? `@${login}` : coAuthor, subject));
    }
  }

  return bullets;
}

/**
 * Insert a `### Acknowledgements` section at the end of the `version` section.
 * Existing hand-written acknowledgements win; returns the input unchanged.
 */
export function appendAcknowledgements(
  changelog: string,
  version: string,
  bullets: string[],
): string {
  if (bullets.length === 0) return changelog;

  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) =>
    new RegExp(`^##\\s+v?${escaped}(?:\\s|$)`).test(line),
  );
  if (start === -1) return changelog;

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) end = lines.length;

  const section = lines.slice(start, end).join('\n');
  if (/^###\s+Acknowledgements\s*$/m.test(section)) return changelog;

  const before = lines.slice(0, end);
  while (before.length > start + 1 && before[before.length - 1] === '') before.pop();

  const block = ['', '### Acknowledgements', ...bullets.map((item) => `- ${item}`), ''];
  return [...before, ...block, ...lines.slice(end)].join('\n');
}
