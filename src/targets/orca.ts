/**
 * Orca app and terminal theme plugin generator.
 *
 * What it produces: one Orca plugin folder with six app themes and six matching
 * terminal palettes, ready for `orca plugin dev load dist/orca/inkstone-orca`.
 * Orca's store has no review step — a public repository with `orca-plugin.json`
 * at the root, a `publisher` equal to the repository owner, a licence, the
 * `orca-plugin` topic and a `vX.Y.Z` tag is listed automatically — so the folder
 * this writes is the whole submission.
 *
 * Why the tokens are read from the palette: `orca-tokens.ts` maps each Orca
 * token to an Inkstone semantic field, so a flavour change reaches Orca the same
 * way it reaches every other target. Orca derives every token the map omits from
 * the ones it sets, which is why a partial map still paints a whole theme.
 *
 * Contrast: Orca drops a text/surface pair below 4.5:1 (3:1 for source-control
 * decorations) and keeps its own colour for that pair. The generator runs the
 * same check up front and removes the offending token, so the shipped file
 * always survives Orca's own validation instead of silently losing half a pair.
 */

import { contrast, formatRatio } from '../color.ts';
import { flavorName, flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { inkstoneThemeName } from './naming.ts';
import {
  ORCA_REQUIRED_TOKENS,
  ORCA_TEXT_PAIRS,
  ORCA_TOKEN_SOURCES,
} from './orca-tokens.ts';
import type { GeneratedFile } from './types.ts';
import { buildTheme } from './vscode.ts';

/** Plugin id. Orca reserves every id starting `orca-` for its own catalog. */
export const ORCA_PLUGIN_ID = 'inkstone-theme';
/** Display name in the plugin list and the theme pickers. */
export const ORCA_PLUGIN_NAME = 'Inkstone for Orca';
/** Must equal the owner of the publishing repository. */
export const ORCA_PUBLISHER = 'wahaha1024';
/** Repository the store links to; the listing is found through it. */
export const ORCA_REPOSITORY = 'https://github.com/wahaha1024/inkstone-orca';
/** Format 2 manifests need 1.4.245; `publisher` widens that to older releases. */
export const ORCA_ENGINE = '>=1.4.245';
/** Plugin folder, relative to the repository root. */
export const ORCA_PACKAGE_DIR = 'dist/orca/inkstone-orca';
/** Orca refuses a theme file above this size. */
export const ORCA_THEME_LIMIT = 16 * 1024;

/** Theme id in the picker: `inkstone-xuanmo`. */
export function orcaThemeId(flavor: Flavor): string {
  return `inkstone-${flavor.meta.id}`;
}

/** Title shown in the picker: `Inkstone Xuanmo`. */
export function orcaThemeTitle(flavor: Flavor): string {
  return inkstoneThemeName(flavor);
}

/** App theme path inside the plugin: `themes/inkstone-xuanmo.json`. */
export function orcaAppThemePath(flavor: Flavor): string {
  return `themes/${orcaThemeId(flavor)}.json`;
}

/** Terminal theme path inside the plugin: `terminal/inkstone-xuanmo.json`. */
export function orcaTerminalThemePath(flavor: Flavor): string {
  return `terminal/${orcaThemeId(flavor)}.json`;
}

/** A token the generator removed because Orca would have dropped it. */
export interface OrcaDroppedToken {
  token: string;
  /** The surface it was measured against. */
  surface: string;
  /** Measured ratio, below `min`. */
  ratio: number;
  min: number;
}

interface OrcaTokenRule {
  scope: string[];
  settings: { foreground?: string; fontStyle?: string };
}

/** An Orca app theme file. `base` picks the Light or the Dark slot. */
export interface OrcaAppTheme {
  schemaVersion: 1;
  base: 'light' | 'dark';
  tokens: Record<string, string>;
  tokenColors?: OrcaTokenRule[];
}

/** An Orca terminal theme file: one ANSI palette. */
export interface OrcaTerminalTheme {
  schemaVersion: 1;
  mode: 'light' | 'dark';
  terminal: Record<string, string>;
}

/** The 16 ANSI keys, in slot order, as Orca spells them. */
export const ORCA_ANSI_KEYS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
] as const;

/** The whole palette, resolved for one flavour. */
export function orcaTokens(flavor: Flavor): Record<string, string> {
  return Object.fromEntries(
    Object.entries(ORCA_TOKEN_SOURCES).map(([token, source]) => [token, source(flavor)]),
  );
}

/**
 * The palette minus every text token whose surface cannot carry it.
 *
 * Removing the text token, rather than the surface, leaves Orca deriving a
 * readable foreground for that surface from `--foreground` and `--background`.
 * Required tokens are never removed: a palette too dark to read its own body
 * text is a palette bug the build must report, not paper over.
 */
export function withoutLowContrast(
  flavor: Flavor,
  tokens: Record<string, string> = orcaTokens(flavor),
): { tokens: Record<string, string>; dropped: OrcaDroppedToken[] } {
  const kept = { ...tokens };
  const dropped: OrcaDroppedToken[] = [];
  for (const pair of ORCA_TEXT_PAIRS) {
    const text = kept[pair.text];
    const surface = kept[pair.surface];
    if (!text || !surface) continue;
    const ratio = contrast(text, surface);
    if (ratio >= pair.ratio) continue;
    if ((ORCA_REQUIRED_TOKENS as readonly string[]).includes(pair.text)) continue;
    delete kept[pair.text];
    dropped.push({ token: pair.text, surface: pair.surface, ratio, min: pair.ratio });
  }
  return { tokens: kept, dropped };
}

/** Word- and scope-order-independent size of a rendered theme file. */
function themeBytes(value: unknown): number {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`).length;
}

/**
 * Render a theme file, shedding code rules only if the file would exceed Orca's
 * 16 KiB cap. `name` goes first (Orca ignores it), then the widest rules: one
 * rule matching ten scopes covers more colour than one matching two.
 */
function renderAppTheme(theme: OrcaAppTheme): string {
  const render = (value: OrcaAppTheme): string => `${JSON.stringify(value, null, 2)}\n`;
  if (themeBytes(theme) <= ORCA_THEME_LIMIT) return render(theme);

  const anonymous: OrcaAppTheme = {
    ...theme,
    tokenColors: theme.tokenColors?.map(({ scope, settings }) => ({ scope, settings })),
  };
  if (themeBytes(anonymous) <= ORCA_THEME_LIMIT) return render(anonymous);

  let kept = [...(anonymous.tokenColors ?? [])].sort((a, b) => b.scope.length - a.scope.length);
  while (kept.length > 0) {
    const candidate: OrcaAppTheme = { ...anonymous, tokenColors: kept };
    if (themeBytes(candidate) <= ORCA_THEME_LIMIT) return render(candidate);
    kept = kept.slice(1);
  }
  return render({ ...anonymous, tokenColors: [] });
}

/**
 * Build one app theme.
 *
 * `tokenColors` is the VS Code rule list unchanged: Orca reads the same `scope`
 * and `settings` shape, ignores `name` and ignores `semanticTokenColors`, so the
 * code colours match the VS Code theme without a second table.
 */
export function buildOrcaAppTheme(flavor: Flavor): {
  theme: OrcaAppTheme;
  dropped: OrcaDroppedToken[];
} {
  const { tokens, dropped } = withoutLowContrast(flavor);
  return {
    theme: {
      schemaVersion: 1,
      base: flavor.meta.appearance,
      tokens,
      tokenColors: buildOrcaTokenColors(flavor),
    },
    dropped,
  };
}

/** The VS Code rule list, in Orca's `{ scope, settings }` shape. */
function buildOrcaTokenColors(flavor: Flavor): OrcaTokenRule[] {
  return buildTheme(flavor).tokenColors.map(({ scope, settings }) => ({
    scope,
    settings: {
      ...(settings.foreground ? { foreground: settings.foreground } : {}),
      ...(settings.fontStyle ? { fontStyle: settings.fontStyle } : {}),
    },
  }));
}

/**
 * Build one terminal palette.
 *
 * The four named keys mirror `terminal.*` in the VS Code theme, which reads the
 * same fields: the terminal shares the editor canvas, so a split beside an
 * editor shows one continuous colour.
 */
export function buildOrcaTerminalTheme(flavor: Flavor): OrcaTerminalTheme {
  return {
    schemaVersion: 1,
    mode: flavor.meta.appearance,
    terminal: {
      background: flavor.surface.base,
      foreground: flavor.text.primary,
      cursor: flavor.text.cursor,
      selectionBackground: flavor.surface.selection,
      ...Object.fromEntries(
        flavor.ansi.map((hex, slot): [string, string] => [ORCA_ANSI_KEYS[slot]!, hex]),
      ),
    },
  };
}

/** `orca-plugin.json`, manifest format 2. */
export function buildOrcaManifest(version: string): string {
  return `${JSON.stringify(
    {
      $schema:
        'https://raw.githubusercontent.com/stablyai/orca/main/docs/schemas/plugins/orca-plugin.v2.schema.json',
      manifestVersion: 2,
      execution: 'data',
      id: ORCA_PLUGIN_ID,
      publisher: ORCA_PUBLISHER,
      name: ORCA_PLUGIN_NAME,
      version,
      description:
        '墨观 Inkstone — six Chinese-colour themes (three light, three dark) for the Orca ' +
        'interface, each with a matching terminal palette.',
      author: { name: 'wahaha1024', url: 'https://github.com/wahaha1024' },
      repository: ORCA_REPOSITORY,
      license: 'MIT',
      engines: { orca: ORCA_ENGINE },
      contributes: {
        themes: flavors.map((flavor) => ({
          id: orcaThemeId(flavor),
          title: `Inkstone ${flavorName(flavor, 'en')}`,
          path: orcaAppThemePath(flavor),
        })),
        terminalThemes: flavors.map((flavor) => ({
          id: orcaThemeId(flavor),
          title: `Inkstone ${flavorName(flavor, 'en')}`,
          path: orcaTerminalThemePath(flavor),
        })),
      },
      capabilities: [],
    },
    null,
    2,
  )}\n`;
}

/** Plugin README. Chinese leads because the palettes are Chinese colours; English follows. */
export function buildOrcaReadme(version: string): string {
  const names = (predicate: (flavor: Flavor) => boolean): string =>
    flavors.filter(predicate).map(orcaThemeTitle).join('、');
  const rows = flavors
    .map(
      (flavor) =>
        `| ${orcaThemeTitle(flavor)}（${flavorName(flavor, 'zh')}） | ${
          flavor.meta.appearance === 'dark' ? '暗' : '浅'
        } | ${flavor.meta.description.zh} |`,
    )
    .join('\n');
  return `# 墨观 Inkstone · Orca 主题

六套中国色配色 —— 三浅三深 —— 由同一份语义色板生成，同时绘制 Orca 的界面与终端。版本 ${version}。

属于[墨观 Inkstone](https://github.com/wahaha1024/inkstone)项目：同一份色板还生成 VS Code、Ghostty、Kaku、OpenCode、Zed 与 DeepSeek Harness 主题。本目录由 \`pnpm build\` 生成，请勿手改。

## 六个主题

| 主题 | 明暗 | 气质 |
| --- | --- | --- |
${rows}

每个主题都带一份界面主题（界面配色 + 代码高亮）与一份同名终端色板，所以编辑器旁边的终端是同一块墨。

## 安装

在 Orca 插件目录里搜 "Inkstone"（**Settings → Plugins**），或在[目录页](https://orca.dev/plugins/wahaha1024/inkstone-orca)点 **Open in Orca**。装好后在 **Settings → Appearance** 分别选浅色与深色主题：

- **浅色主题** —— ${names((flavor) => flavor.meta.appearance === 'light')}
- **深色主题** —— ${names((flavor) => flavor.meta.appearance === 'dark')}

终端色板单独选：**Settings → Terminal** 里挑同名主题。

也可以按 Git 仓库直接装：**Settings → Plugins → Add plugin → From a Git URL**，填 \`https://github.com/wahaha1024/inkstone-orca#v${version}\`。

## 许可

MIT，与墨观本身一致。

## English

Six Chinese-colour themes for Orca — three light, three dark — that paint the
interface and the terminal from one semantic palette. Install it from the plugin
directory (**Settings → Plugins**, search "Inkstone"), then pick an app theme
under **Settings → Appearance** and the matching palette under
**Settings → Terminal**. Part of [Inkstone](https://github.com/wahaha1024/inkstone);
licensed MIT.
`;
}

/** Every file of the plugin folder, in the order Orca reads them. */
export function generateOrca(version: string, license: string): GeneratedFile[] {
  const dir = ORCA_PACKAGE_DIR;
  const themes: GeneratedFile[] = [];
  for (const flavor of flavors) {
    const { theme, dropped } = buildOrcaAppTheme(flavor);
    for (const drop of dropped) {
      console.warn(
        `  ! orca: dropped ${drop.token} (${formatRatio(drop.ratio)} against ` +
          `${drop.surface}, needs ${drop.min}:1) in ${flavor.meta.id}`,
      );
    }
    themes.push({ path: `${dir}/${orcaAppThemePath(flavor)}`, content: renderAppTheme(theme) });
    themes.push({
      path: `${dir}/${orcaTerminalThemePath(flavor)}`,
      content: `${JSON.stringify(buildOrcaTerminalTheme(flavor), null, 2)}\n`,
    });
  }
  return [
    { path: `${dir}/orca-plugin.json`, content: buildOrcaManifest(version) },
    { path: `${dir}/LICENSE`, content: license },
    { path: `${dir}/README.md`, content: buildOrcaReadme(version) },
    ...themes,
  ];
}
