export type Appearance = 'dark' | 'light';

export interface FlavorMeta {
  /** Stable id used for file names and CSS classes. */
  id: string;
  /** Chinese flavor name, e.g. 玄墨. */
  zh: string;
  /** English flavor name, e.g. Xuanmo. */
  en: string;
  appearance: Appearance;
  /** One-line description shown in docs and the preview. */
  description: { zh: string; en: string };
}

export interface SurfaceTokens {
  /** Editor background. */
  base: string;
  /** Side bars and panels. */
  alt: string;
  /** Tabs, widgets, raised cards. */
  raised: string;
  /** Dropdowns, hover overlays. */
  overlay: string;
  /** Deep wells: terminal, breadcrumbs, input groups. */
  sunken: string;
  /** Input fields. */
  input: string;
  /** Editor selection. */
  selection: string;
  /** Selection in unfocused editors. */
  selectionInactive: string;
  /** List/tree hover. */
  hover: string;
  /** Active list item, current tab. */
  active: string;
}

export interface BorderTokens {
  subtle: string;
  normal: string;
  strong: string;
  focus: string;
}

export interface TextTokens {
  primary: string;
  secondary: string;
  muted: string;
  faint: string;
  /** Text drawn on top of a strong accent. */
  inverse: string;
}

export interface SyntaxTokens {
  comment: string;
  keyword: string;
  storage: string;
  function: string;
  method: string;
  string: string;
  number: string;
  boolean: string;
  type: string;
  constant: string;
  variable: string;
  parameter: string;
  property: string;
  operator: string;
  punctuation: string;
  decorator: string;
  tag: string;
  attribute: string;
  regexp: string;
  escape: string;
  invalid: string;
  deprecated: string;
}

export interface StatusTokens {
  error: string;
  warning: string;
  info: string;
  success: string;
  modified: string;
  added: string;
  deleted: string;
  renamed: string;
}

export interface Flavor {
  meta: FlavorMeta;
  surface: SurfaceTokens;
  border: BorderTokens;
  text: TextTokens;
  syntax: SyntaxTokens;
  status: StatusTokens;
  /** ANSI 0–15, in terminal order. */
  ansi: [
    string, string, string, string,
    string, string, string, string,
    string, string, string, string,
    string, string, string, string,
  ];
}

export interface FlavorSet {
  /** Dark flavor. */
  xuanmo: Flavor;
  /** Warm light flavor. */
  xuanzhi: Flavor;
}

export const ANSI_NAMES = [
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
