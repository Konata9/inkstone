/** Read and query CHANGELOG.md sections without pulling in a Markdown parser. */

function sectionLines(changelog: string, heading: RegExp): string[] | undefined {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return undefined;

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) end = lines.length;

  return lines.slice(start + 1, end);
}

function versionHeading(version: string): RegExp {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s+v?${escaped}(?:\\s|$)`);
}

/** Body of the `## <version>` section, or undefined when the heading is missing. */
export function extractReleaseNotes(changelog: string, version: string): string | undefined {
  const body = sectionLines(changelog, versionHeading(version))?.join('\n').trim();
  return body ? `${body}\n` : undefined;
}

export function hasVersionSection(changelog: string, version: string): boolean {
  return sectionLines(changelog, versionHeading(version)) !== undefined;
}

/** True when `## Unreleased` exists and still has entries. */
export function hasUnreleasedEntries(changelog: string): boolean {
  return (sectionLines(changelog, /^##\s+Unreleased\s*$/) ?? []).some(
    (line) => line.trim().length > 0,
  );
}
