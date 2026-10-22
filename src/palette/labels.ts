/**
 * Chinese labels for every semantic role.
 *
 * Both generated references — `docs/palette.md` and the preview page — read
 * these maps, so a new token cannot ship with a missing or divergent label.
 * Keying each map by `keyof Flavor[...]` makes an omitted role a type error.
 */

import type { Flavor } from './types.ts';

export const surfaceLabels: Record<keyof Flavor['surface'], string> = {
  base: '画布',
  alt: '面板 / 侧栏',
  raised: '浮起表面',
  overlay: '浮层',
  sunken: '深井（终端）',
  input: '输入框',
  selection: '选区',
  selectionInactive: '失焦选区',
  hover: '悬停',
  active: '激活',
};

export const borderLabels: Record<keyof Flavor['border'], string> = {
  subtle: '发丝边框',
  normal: '常规边框',
  strong: '强调边框',
  focus: '焦点环',
};

export const textLabels: Record<keyof Flavor['text'], string> = {
  primary: '正文',
  secondary: '次要文字',
  muted: '弱化文字',
  faint: '占位文字',
  inverse: '反白文字',
  cursor: '光标',
};

export const syntaxLabels: Record<keyof Flavor['syntax'], string> = {
  comment: '注释',
  keyword: '关键字',
  storage: '存储修饰',
  function: '函数',
  method: '方法',
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  type: '类型',
  constant: '常量',
  variable: '变量',
  parameter: '参数',
  property: '属性',
  operator: '运算符',
  punctuation: '标点',
  decorator: '装饰器',
  tag: '标签',
  attribute: '属性名',
  regexp: '正则',
  escape: '转义',
  invalid: '错误',
  deprecated: '废弃',
};

export const statusLabels: Record<keyof Flavor['status'], string> = {
  error: '错误',
  warning: '警告',
  info: '信息',
  success: '成功',
  modified: '已修改',
  added: '新增',
  deleted: '删除',
  renamed: '重命名',
};
