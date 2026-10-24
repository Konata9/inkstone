/**
 * VS Code / Cursor / Windsurf / VSCodium theme generator.
 *
 * One semantic palette in, one complete workbench theme out: chrome colors,
 * TextMate scopes and semantic tokens all read from the same flavor object.
 */

import { alpha } from '../color.ts';
import { actionHover, flavors } from '../palette/index.ts';
import type { Flavor } from '../palette/types.ts';
import { themeDisplayName, vscodeFileName } from './naming.ts';

interface TokenSpec {
  name: string;
  scope: string[];
  foreground?: string;
  fontStyle?: string;
}

interface TokenRule {
  name: string;
  scope: string[];
  settings: {
    foreground?: string;
    fontStyle?: string;
  };
}

interface ThemeFile {
  $schema: string;
  name: string;
  type: 'dark' | 'light';
  semanticHighlighting: boolean;
  colors: Record<string, string>;
  tokenColors: TokenRule[];
  semanticTokenColors: Record<string, string | { foreground?: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean }>;
}

const transparent = '#00000000';

function shadow(flavor: Flavor, opacity: number): string {
  return alpha(flavor.meta.appearance === 'dark' ? '#000000' : flavor.text.primary, opacity);
}

function workbench(flavor: Flavor): Record<string, string> {
  const f = flavor;
  const s = f.surface;
  const b = f.border;
  const t = f.text;
  const y = f.syntax;
  const st = f.status;
  const dark = f.meta.appearance === 'dark';

  return {
    // ---------------------------------------------------------------- base
    focusBorder: b.focus,
    foreground: t.primary,
    disabledForeground: t.faint,
    descriptionForeground: t.muted,
    errorForeground: st.error,
    'icon.foreground': t.secondary,
    'widget.border': b.normal,
    'widget.shadow': shadow(f, dark ? 0.45 : 0.12),
    'selection.background': s.selection,
    'sash.hoverBorder': b.focus,
    contrastBorder: b.strong,
    // Cursor draws this as a 1px outline on every editor tab, checked
    // activity-bar item and auxiliary action (including New Agent).
    // VS Code and VSCodium leave the token null outside high contrast,
    // so a visible value only appears in Cursor. Focus rings use focusBorder.
    contrastActiveBorder: transparent,

    // --------------------------------------------------------------- links
    'textLink.foreground': y.function,
    'textLink.activeForeground': y.method,
    'textPreformat.foreground': y.string,
    'textPreformat.background': s.alt,
    'textBlockQuote.background': s.alt,
    'textBlockQuote.border': b.strong,
    'textCodeBlock.background': s.alt,
    'textSeparator.foreground': b.normal,

    // -------------------------------------------------------------- editor
    'editor.background': s.base,
    'editor.foreground': t.primary,
    'editorLineNumber.foreground': t.faint,
    'editorLineNumber.activeForeground': t.secondary,
    'editorCursor.foreground': t.cursor,
    'editorCursor.background': s.base,
    'editor.selectionBackground': s.selection,
    'editor.inactiveSelectionBackground': s.selectionInactive,
    'editor.selectionHighlightBackground': alpha(y.keyword, 0.14),
    'editor.selectionHighlightBorder': alpha(y.keyword, 0.38),
    'editor.wordHighlightBackground': alpha(y.function, 0.16),
    'editor.wordHighlightStrongBackground': alpha(y.function, 0.24),
    'editor.wordHighlightTextBackground': alpha(y.function, 0.12),
    'editor.findMatchBackground': alpha(y.number, 0.32),
    'editor.findMatchHighlightBackground': alpha(y.number, 0.16),
    'editor.findMatchBorder': y.number,
    'editor.findRangeHighlightBackground': alpha(y.number, 0.1),
    'editor.hoverHighlightBackground': alpha(y.function, 0.14),
    'editor.lineHighlightBackground': alpha(t.primary, dark ? 0.045 : 0.05),
    'editor.lineHighlightBorder': transparent,
    'editor.rangeHighlightBackground': alpha(y.keyword, 0.08),
    'editor.symbolHighlightBackground': alpha(y.function, 0.2),
    'editorLink.activeForeground': y.function,
    'editorWhitespace.foreground': b.normal,
    'editorIndentGuide.background1': dark ? b.subtle : b.normal,
    'editorIndentGuide.activeBackground1': b.strong,
    'editorRuler.foreground': b.subtle,
    'editorCodeLens.foreground': t.muted,
    'editorBracketMatch.background': alpha(y.keyword, 0.12),
    'editorBracketMatch.border': alpha(y.keyword, 0.45),
    'editorBracketHighlight.foreground1': y.keyword,
    'editorBracketHighlight.foreground2': y.number,
    'editorBracketHighlight.foreground3': y.type,
    'editorBracketHighlight.foreground4': y.string,
    'editorBracketHighlight.foreground5': y.function,
    'editorBracketHighlight.foreground6': y.decorator,
    'editorBracketHighlight.unexpectedBracket.foreground': y.invalid,
    'editorError.foreground': st.error,
    'editorError.border': transparent,
    'editorWarning.foreground': st.warning,
    'editorWarning.border': transparent,
    'editorInfo.foreground': st.info,
    'editorInfo.border': transparent,
    'editorHint.foreground': st.success,
    'editorHint.border': transparent,
    'editorGhostText.foreground': alpha(t.muted, 0.8),
    'editorGhostText.background': transparent,
    'editorGhostText.border': transparent,
    'editorInlayHint.foreground': t.muted,
    'editorInlayHint.background': alpha(s.raised, 0.7),
    'editorInlayHint.typeForeground': t.muted,
    'editorInlayHint.typeBackground': alpha(s.raised, 0.5),
    'editorInlayHint.parameterForeground': t.muted,
    'editorInlayHint.parameterBackground': alpha(s.raised, 0.5),
    'editorGutter.background': s.base,
    'editorGutter.modifiedBackground': st.modified,
    'editorGutter.addedBackground': st.added,
    'editorGutter.deletedBackground': st.deleted,
    'editorGutter.foldingControlForeground': t.muted,
    'editorLightBulb.foreground': st.warning,
    'editorLightBulbAutoFix.foreground': st.info,
    'editorStickyScroll.background': s.alt,
    'editorStickyScrollHover.background': s.raised,
    'editorWidget.background': s.raised,
    'editorWidget.foreground': t.primary,
    'editorWidget.border': b.normal,
    'editorWidget.resizeBorder': b.focus,
    'editorSuggestWidget.background': s.raised,
    'editorSuggestWidget.border': b.normal,
    'editorSuggestWidget.foreground': t.primary,
    'editorSuggestWidget.selectedBackground': s.active,
    'editorSuggestWidget.selectedForeground': t.primary,
    'editorSuggestWidget.highlightForeground': y.function,
    'editorSuggestWidget.focusHighlightForeground': f.action,
    'editorHoverWidget.background': s.raised,
    'editorHoverWidget.foreground': t.primary,
    'editorHoverWidget.border': b.normal,
    'editorHoverWidget.statusBarBackground': s.overlay,
    'editorMarkerNavigation.background': s.alt,
    'editorMarkerNavigationError.background': st.error,
    'editorMarkerNavigationWarning.background': st.warning,
    'editorMarkerNavigationInfo.background': st.info,
    'editor.stackFrameHighlightBackground': alpha(st.warning, 0.12),
    'editor.focusedStackFrameHighlightBackground': alpha(st.warning, 0.22),

    // overview ruler
    'editorOverviewRuler.border': alpha(b.normal, 0.6),
    'editorOverviewRuler.findMatchForeground': alpha(y.number, 0.8),
    'editorOverviewRuler.rangeHighlightForeground': alpha(y.keyword, 0.4),
    'editorOverviewRuler.selectionHighlightForeground': alpha(y.keyword, 0.6),
    'editorOverviewRuler.wordHighlightForeground': alpha(y.function, 0.6),
    'editorOverviewRuler.wordHighlightStrongForeground': alpha(y.function, 0.8),
    'editorOverviewRuler.bracketMatchForeground': alpha(y.keyword, 0.6),
    'editorOverviewRuler.modifiedForeground': st.modified,
    'editorOverviewRuler.addedForeground': st.added,
    'editorOverviewRuler.deletedForeground': st.deleted,
    'editorOverviewRuler.errorForeground': st.error,
    'editorOverviewRuler.warningForeground': st.warning,
    'editorOverviewRuler.infoForeground': st.info,

    // ------------------------------------------------------------ problems
    'problemsErrorIcon.foreground': st.error,
    'problemsWarningIcon.foreground': st.warning,
    'problemsInfoIcon.foreground': st.info,

    // ------------------------------------------------------------ groups
    'editorGroup.border': b.normal,
    'editorGroup.dropBackground': alpha(y.function, 0.16),
    'editorGroup.emptyBackground': s.base,
    'editorGroup.focusedEmptyBorder': b.focus,
    'editorGroupHeader.tabsBackground': s.alt,
    'editorGroupHeader.tabsBorder': b.subtle,
    'editorGroupHeader.noTabsBackground': s.base,
    'editorGroupHeader.border': b.subtle,
    'editorPane.background': s.base,

    // -------------------------------------------------------------- tabs
    'tab.activeBackground': s.base,
    'tab.activeForeground': t.primary,
    'tab.inactiveBackground': s.alt,
    'tab.inactiveForeground': t.muted,
    'tab.border': b.subtle,
    'tab.activeBorder': s.base,
    'tab.activeBorderTop': f.action,
    'tab.unfocusedActiveBorder': s.base,
    'tab.unfocusedActiveBorderTop': alpha(f.action, 0.4),
    'tab.selectedBackground': s.raised,
    'tab.selectedForeground': t.primary,
    'tab.hoverBackground': s.raised,
    'tab.hoverForeground': t.primary,
    'tab.unfocusedHoverBackground': s.raised,
    'tab.activeModifiedBorder': st.modified,
    'tab.inactiveModifiedBorder': alpha(st.modified, 0.6),

    // ----------------------------------------------------------- sidebars
    'sideBar.background': s.alt,
    'sideBar.foreground': t.secondary,
    'sideBar.border': b.subtle,
    'sideBar.dropBackground': alpha(y.function, 0.16),
    'sideBarTitle.foreground': t.muted,
    'sideBarSectionHeader.background': s.alt,
    'sideBarSectionHeader.foreground': t.secondary,
    'sideBarSectionHeader.border': b.subtle,
    'activityBar.background': dark ? s.sunken : s.raised,
    'activityBar.foreground': t.primary,
    'activityBar.inactiveForeground': t.faint,
    'activityBar.border': b.subtle,
    'activityBar.activeBorder': f.action,
    'activityBar.activeBackground': alpha(f.action, 0.08),
    'activityBar.dropBorder': f.action,
    'activityBarBadge.background': f.action,
    'activityBarBadge.foreground': t.inverse,
    'list.activeSelectionBackground': s.active,
    'list.activeSelectionForeground': t.primary,
    'list.inactiveSelectionBackground': s.hover,
    'list.inactiveSelectionForeground': t.secondary,
    'list.hoverBackground': s.hover,
    'list.hoverForeground': t.primary,
    'list.focusBackground': s.active,
    'list.focusForeground': t.primary,
    'list.focusOutline': b.focus,
    'list.highlightForeground': y.function,
    'list.focusHighlightForeground': f.action,
    'list.invalidItemForeground': st.error,
    'list.errorForeground': st.error,
    'list.warningForeground': st.warning,
    'list.filterMatchBackground': alpha(y.number, 0.2),
    'list.dropBackground': alpha(y.function, 0.14),
    'tree.indentGuidesStroke': b.normal,
    'tree.inactiveIndentGuidesStroke': b.subtle,
    'tree.tableColumnsBorder': alpha(b.subtle, 0.6),
    'badge.background': f.action,
    'badge.foreground': t.inverse,

    // ---------------------------------------------------------- title bar
    'titleBar.activeBackground': s.alt,
    'titleBar.activeForeground': t.primary,
    'titleBar.inactiveBackground': s.alt,
    'titleBar.inactiveForeground': t.faint,
    'titleBar.border': b.subtle,
    'commandCenter.background': s.raised,
    'commandCenter.foreground': t.secondary,
    'commandCenter.activeBackground': s.base,
    'commandCenter.activeForeground': t.primary,
    'commandCenter.inactiveForeground': t.faint,
    'commandCenter.border': b.normal,
    'menubar.selectionBackground': s.active,
    'menubar.selectionForeground': t.primary,
    'menu.background': s.overlay,
    'menu.foreground': t.primary,
    'menu.selectionBackground': s.active,
    'menu.selectionForeground': t.primary,
    'menu.separatorBackground': b.normal,
    'menu.border': b.normal,

    // --------------------------------------------------------- status bar
    'statusBar.background': dark ? s.sunken : s.alt,
    'statusBar.foreground': t.secondary,
    'statusBar.border': b.subtle,
    'statusBar.noFolderBackground': s.alt,
    'statusBar.noFolderForeground': t.muted,
    'statusBar.noFolderBorder': b.subtle,
    'statusBar.debuggingBackground': st.warning,
    'statusBar.debuggingForeground': t.inverse,
    'statusBar.debuggingBorder': transparent,
    'statusBarItem.hoverBackground': alpha(t.primary, 0.08),
    'statusBarItem.activeBackground': alpha(t.primary, 0.12),
    'statusBarItem.prominentBackground': s.raised,
    'statusBarItem.prominentForeground': t.primary,
    'statusBarItem.prominentHoverBackground': s.overlay,
    'statusBarItem.errorBackground': st.error,
    'statusBarItem.errorForeground': t.inverse,
    'statusBarItem.warningBackground': st.warning,
    'statusBarItem.warningForeground': t.inverse,
    'statusBarItem.remoteBackground': f.action,
    'statusBarItem.remoteForeground': t.inverse,
    'statusBarItem.offlineBackground': st.error,
    'statusBarItem.offlineForeground': t.inverse,

    // -------------------------------------------------------------- panel
    'panel.background': s.alt,
    'panel.border': b.subtle,
    'panel.dropBorder': y.function,
    'panelTitle.activeForeground': t.primary,
    'panelTitle.activeBorder': f.action,
    'panelTitle.inactiveForeground': t.muted,
    'panelSection.border': b.subtle,
    'panelSectionHeader.background': s.alt,
    'panelSectionHeader.foreground': t.secondary,
    'panelSection.dropBackground': alpha(y.function, 0.12),

    // ----------------------------------------------------------- terminal
    'terminal.background': s.base,
    'terminal.foreground': t.primary,
    'terminalCursor.foreground': t.cursor,
    'terminalCursor.background': s.base,
    'terminal.selectionBackground': s.selection,
    'terminal.inactiveSelectionBackground': s.selectionInactive,
    'terminal.border': b.subtle,
    'terminal.findMatchBackground': alpha(y.number, 0.3),
    'terminal.findMatchHighlightBackground': alpha(y.number, 0.16),
    'terminal.ansiBlack': f.ansi[0],
    'terminal.ansiRed': f.ansi[1],
    'terminal.ansiGreen': f.ansi[2],
    'terminal.ansiYellow': f.ansi[3],
    'terminal.ansiBlue': f.ansi[4],
    'terminal.ansiMagenta': f.ansi[5],
    'terminal.ansiCyan': f.ansi[6],
    'terminal.ansiWhite': f.ansi[7],
    'terminal.ansiBrightBlack': f.ansi[8],
    'terminal.ansiBrightRed': f.ansi[9],
    'terminal.ansiBrightGreen': f.ansi[10],
    'terminal.ansiBrightYellow': f.ansi[11],
    'terminal.ansiBrightBlue': f.ansi[12],
    'terminal.ansiBrightMagenta': f.ansi[13],
    'terminal.ansiBrightCyan': f.ansi[14],
    'terminal.ansiBrightWhite': f.ansi[15],

    // -------------------------------------------------------- breadcrumbs
    'breadcrumb.foreground': t.muted,
    'breadcrumb.background': s.base,
    'breadcrumb.focusForeground': t.primary,
    'breadcrumb.activeSelectionForeground': t.primary,
    'breadcrumbPicker.background': s.overlay,

    // ------------------------------------------------------------- inputs
    'input.background': s.input,
    'input.foreground': t.primary,
    'input.border': b.normal,
    'input.placeholderForeground': t.faint,
    'inputOption.activeBackground': alpha(y.function, 0.2),
    'inputOption.activeForeground': t.primary,
    'inputOption.activeBorder': b.focus,
    'inputValidation.errorBackground': alpha(st.error, dark ? 0.18 : 0.1),
    'inputValidation.errorForeground': st.error,
    'inputValidation.errorBorder': st.error,
    'inputValidation.warningBackground': alpha(st.warning, dark ? 0.18 : 0.1),
    'inputValidation.warningForeground': st.warning,
    'inputValidation.warningBorder': st.warning,
    'inputValidation.infoBackground': alpha(st.info, dark ? 0.18 : 0.1),
    'inputValidation.infoForeground': st.info,
    'inputValidation.infoBorder': st.info,

    // ------------------------------------------------------------ buttons
    'button.background': f.action,
    'button.foreground': t.inverse,
    'button.hoverBackground': actionHover(f),
    'button.border': transparent,
    'button.secondaryBackground': s.raised,
    'button.secondaryForeground': t.primary,
    'button.secondaryHoverBackground': s.overlay,
    'button.separator': alpha(t.primary, 0.12),

    // ----------------------------------------------------------- dropdown
    'dropdown.background': s.overlay,
    'dropdown.listBackground': s.overlay,
    'dropdown.border': b.normal,
    'dropdown.foreground': t.primary,

    // --------------------------------------------------------- quick pick
    'quickInput.background': s.overlay,
    'quickInput.foreground': t.primary,
    'quickInputList.focusBackground': s.active,
    'quickInputList.focusForeground': t.primary,
    'quickInputList.focusIconForeground': f.action,
    'quickInputTitle.background': s.raised,
    'pickerGroup.foreground': t.muted,
    'pickerGroup.border': b.normal,
    'keybindingLabel.background': s.raised,
    'keybindingLabel.foreground': t.secondary,
    'keybindingLabel.border': b.normal,
    'keybindingLabel.bottomBorder': b.strong,

    // ------------------------------------------------------ notifications
    'notifications.background': s.overlay,
    'notifications.foreground': t.primary,
    'notifications.border': b.normal,
    'notificationsErrorIcon.foreground': st.error,
    'notificationsWarningIcon.foreground': st.warning,
    'notificationsInfoIcon.foreground': st.info,
    'notificationCenterHeader.background': s.raised,
    'notificationCenterHeader.foreground': t.primary,
    'notificationLink.foreground': y.function,

    // ---------------------------------------------------------- scrollbar
    'scrollbar.shadow': shadow(f, dark ? 0.4 : 0.08),
    'scrollbarSlider.background': alpha(t.primary, dark ? 0.1 : 0.14),
    'scrollbarSlider.hoverBackground': alpha(t.primary, dark ? 0.18 : 0.2),
    'scrollbarSlider.activeBackground': alpha(t.primary, dark ? 0.24 : 0.26),

    // ------------------------------------------------------------ minimap
    'minimap.background': s.base,
    'minimap.findMatchHighlight': alpha(y.number, 0.5),
    'minimap.selectionHighlight': alpha(t.primary, 0.18),
    'minimap.errorHighlight': st.error,
    'minimap.warningHighlight': st.warning,
    'minimapSlider.background': alpha(t.primary, 0.08),
    'minimapSlider.hoverBackground': alpha(t.primary, 0.14),
    'minimapSlider.activeBackground': alpha(t.primary, 0.2),
    'minimapGutter.addedBackground': st.added,
    'minimapGutter.modifiedBackground': st.modified,
    'minimapGutter.deletedBackground': st.deleted,

    // --------------------------------------------------------------- diff
    'diffEditor.insertedTextBackground': alpha(st.added, 0.16),
    'diffEditor.removedTextBackground': alpha(st.deleted, 0.16),
    'diffEditor.insertedLineBackground': alpha(st.added, 0.08),
    'diffEditor.removedLineBackground': alpha(st.deleted, 0.08),
    'diffEditor.diagonalFill': alpha(b.normal, 0.4),
    'diffEditor.border': b.normal,
    'diffEditorOverview.insertedForeground': alpha(st.added, 0.7),
    'diffEditorOverview.removedForeground': alpha(st.deleted, 0.7),
    'diffEditorGutter.insertedLineBackground': alpha(st.added, 0.12),
    'diffEditorGutter.removedLineBackground': alpha(st.deleted, 0.12),

    // ---------------------------------------------------------------- git
    'gitDecoration.addedResourceForeground': st.added,
    'gitDecoration.modifiedResourceForeground': st.modified,
    'gitDecoration.deletedResourceForeground': st.deleted,
    'gitDecoration.renamedResourceForeground': st.renamed,
    'gitDecoration.untrackedResourceForeground': y.regexp,
    'gitDecoration.ignoredResourceForeground': t.faint,
    'gitDecoration.conflictingResourceForeground': st.warning,
    'gitDecoration.submoduleResourceForeground': y.decorator,

    // -------------------------------------------------------------- debug
    'debugToolBar.background': s.raised,
    'debugToolBar.border': b.normal,
    'debugIcon.breakpointForeground': st.error,
    'debugIcon.breakpointDisabledForeground': t.faint,
    'debugIcon.breakpointCurrentStackframeForeground': st.warning,
    'debugIcon.breakpointStackframeForeground': t.muted,
    'debugIcon.startForeground': st.success,
    'debugIcon.pauseForeground': st.warning,
    'debugIcon.stopForeground': st.error,
    'debugIcon.disconnectForeground': st.error,
    'debugIcon.restartForeground': st.success,
    'debugIcon.stepOverForeground': y.function,
    'debugIcon.stepIntoForeground': y.function,
    'debugIcon.stepOutForeground': y.function,
    'debugIcon.continueForeground': y.function,
    'debugIcon.stepBackForeground': y.function,
    'debugConsole.errorForeground': st.error,
    'debugConsole.infoForeground': st.info,
    'debugConsole.warningForeground': st.warning,
    'debugConsoleInputIcon.foreground': y.function,

    // ------------------------------------------------------------ testing
    'testing.iconPassed': st.success,
    'testing.iconFailed': st.error,
    'testing.iconErrored': st.error,
    'testing.iconQueued': t.muted,
    'testing.iconSkipped': t.faint,
    'testing.runAction': y.function,

    // --------------------------------------------------------------- chat
    'chat.editedFileForeground': st.modified,
    'chat.linesAddedForeground': st.added,
    'chat.linesRemovedForeground': st.deleted,
    'chat.slashCommandBackground': alpha(y.keyword, 0.12),
    'chat.slashCommandForeground': y.keyword,
    'inlineChat.background': s.raised,
    'inlineChat.border': b.normal,
    'inlineChat.shadow': shadow(f, 0.2),
    'inlineChatInput.background': s.input,
    'inlineChatInput.border': b.normal,
    'inlineChatInput.focusBorder': b.focus,
    'inlineChatInput.placeholderForeground': t.faint,
    'inlineChatDiff.inserted': alpha(st.added, 0.12),
    'inlineChatDiff.removed': alpha(st.deleted, 0.12),

    // ---------------------------------------------------------- peek view
    'peekView.border': b.normal,
    'peekViewEditor.background': s.base,
    'peekViewEditorGutter.background': s.alt,
    'peekViewEditor.matchHighlightBackground': alpha(y.number, 0.25),
    'peekViewResult.background': s.alt,
    'peekViewResult.fileForeground': t.secondary,
    'peekViewResult.lineForeground': t.muted,
    'peekViewResult.matchHighlightBackground': alpha(y.number, 0.25),
    'peekViewResult.selectionBackground': s.active,
    'peekViewResult.selectionForeground': t.primary,
    'peekViewTitle.background': s.alt,
    'peekViewTitleDescription.foreground': t.muted,
    'peekViewTitleLabel.foreground': t.primary,

    // ---------------------------------------------------------- settings
    'settings.headerForeground': t.secondary,
    'settings.modifiedItemIndicator': st.modified,
    'settings.dropdownBackground': s.input,
    'settings.dropdownForeground': t.primary,
    'settings.dropdownBorder': b.normal,
    'settings.checkboxBackground': s.input,
    'settings.checkboxForeground': t.primary,
    'settings.checkboxBorder': b.normal,
    'settings.textInputBackground': s.input,
    'settings.textInputForeground': t.primary,
    'settings.textInputBorder': b.normal,
    'settings.numberInputBackground': s.input,
    'settings.numberInputForeground': t.primary,
    'settings.numberInputBorder': b.normal,
    'settings.focusBorder': b.focus,

    // ------------------------------------------------------------ welcome
    'welcomePage.background': s.base,
    'welcomePage.tileBackground': s.alt,
    'welcomePage.tileHoverBackground': s.hover,
    'walkThrough.embeddedEditorBackground': s.sunken,

    // ---------------------------------------------------------- extension
    'extensionButton.prominentBackground': f.action,
    'extensionButton.prominentForeground': t.inverse,
    'extensionButton.prominentHoverBackground': actionHover(f),
    'extensionBadge.remoteBackground': y.function,
    'extensionBadge.remoteForeground': t.inverse,
    'extensionIcon.starForeground': st.warning,
    'extensionIcon.verifiedForeground': st.success,
    'extensionIcon.preReleaseForeground': st.info,

    // ------------------------------------------------------------- banner
    'banner.background': s.overlay,
    'banner.foreground': t.primary,
    'banner.iconForeground': y.function,
    'gauge.background': b.normal,
    'gauge.foreground': y.function,
    'progressBar.background': f.action,
    'ports.iconRunningProcessForeground': st.success,
    'notebook.editorBackground': s.base,
    'notebook.cellBorderColor': b.subtle,
    'notebook.cellEditorBackground': s.base,
    'notebook.cellInsertionIndicator': f.action,
    'notebook.focusedCellBorder': b.focus,
    'notebook.focusedCellBackground': s.alt,
    'notebook.selectedCellBackground': s.alt,
    'notebook.selectedCellBorder': b.strong,
    'notebook.inactiveSelectedCellBorder': b.normal,
    'notebook.outputContainerBorderColor': b.subtle,
  };
}

function tokenSpecs(f: Flavor): TokenSpec[] {
  const y = f.syntax;
  return [
    { name: 'Comments', scope: ['comment', 'punctuation.definition.comment', 'string.comment'], foreground: y.comment },
    {
      name: 'Keywords and control flow',
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.logical',
        'keyword.operator.word',
        'storage',
        'storage.type',
        'storage.modifier',
        'variable.language',
      ],
      foreground: y.keyword,
    },
    {
      name: 'Functions and methods',
      scope: [
        'entity.name.function',
        'entity.name.function.member',
        'support.function',
        'support.function.builtin',
        'variable.function',
        'meta.function-call',
        'meta.function-call.generic',
      ],
      foreground: y.function,
    },
    {
      name: 'Methods',
      scope: ['meta.method-call', 'entity.name.function.method', 'support.function.method'],
      foreground: y.method,
    },
    {
      name: 'Types, classes and namespaces',
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.name.namespace',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'support.other.namespace',
        'storage.type.primitive',
        'entity.name.type.primitive',
        'entity.name.type.trait',
        'entity.name.type.enum',
        'entity.name.type.interface',
        'entity.name.type.alias',
        'support.type.primitive',
      ],
      foreground: y.type,
    },
    {
      name: 'Strings',
      scope: [
        'string',
        'string.quoted',
        'string.template',
        'string.unquoted',
        'string.other.link',
        'punctuation.definition.string',
        'markup.inline.raw',
        'markup.fenced_code',
      ],
      foreground: y.string,
    },
    {
      name: 'Numbers, booleans and constants',
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'constant.other.symbol',
        'support.constant',
        'support.variable',
        'variable.other.constant',
        'variable.other.enummember',
        'keyword.other.unit',
      ],
      foreground: y.number,
    },
    {
      name: 'Variables',
      scope: [
        'variable',
        'variable.other',
        'variable.other.readwrite',
        'variable.other.object',
        'variable.graphql',
        'meta.definition.variable',
      ],
      foreground: y.variable,
    },
    {
      name: 'Parameters',
      scope: [
        'variable.parameter',
        'variable.parameter.function',
        'variable.parameter.url',
        'meta.parameter',
      ],
      foreground: y.parameter,
    },
    {
      name: 'Properties and keys',
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'support.type.property-name',
        'meta.object-literal.key',
        'meta.objectliteral.key',
        'entity.name.tag.yaml',
        'support.type.property-name.json',
        'support.type.property-name.css',
        'support.type.property-name.scss',
      ],
      foreground: y.property,
    },
    {
      name: 'Tags',
      scope: [
        'entity.name.tag',
        'entity.name.tag.html',
        'entity.name.tag.xml',
        'punctuation.definition.tag',
        'meta.tag',
      ],
      foreground: y.tag,
    },
    {
      name: 'Attributes',
      scope: [
        'entity.other.attribute-name',
        'entity.other.attribute-name.html',
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
        'meta.attribute',
      ],
      foreground: y.attribute,
    },
    {
      name: 'Decorators and macros',
      scope: [
        'meta.decorator',
        'entity.name.function.decorator',
        'punctuation.decorator',
        'meta.annotation',
        'entity.name.function.macro',
        'meta.preprocessor',
        'keyword.control.directive',
        'keyword.control.import',
      ],
      foreground: y.decorator,
    },
    {
      name: 'Regular expressions',
      scope: [
        'string.regexp',
        'constant.other.character-class.regexp',
        'punctuation.definition.character-class.regexp',
        'keyword.operator.quantifier.regexp',
        'constant.character.escape.backslash.regexp',
      ],
      foreground: y.regexp,
    },
    {
      name: 'Escape characters',
      scope: ['constant.character.escape', 'constant.character.escape.cs', 'string.quoted.double.escape'],
      foreground: y.escape,
    },
    {
      name: 'Operators',
      scope: [
        'keyword.operator',
        'keyword.operator.assignment',
        'keyword.operator.arithmetic',
        'keyword.operator.bitwise',
        'keyword.operator.comparison',
        'keyword.operator.ternary',
        'punctuation.accessor',
        'punctuation.separator',
      ],
      foreground: y.operator,
    },
    {
      name: 'Punctuation and brackets',
      scope: ['punctuation', 'meta.brace', 'punctuation.terminator', 'punctuation.section'],
      foreground: y.punctuation,
    },
    { name: 'Invalid', scope: ['invalid', 'invalid.illegal'], foreground: y.invalid },
    { name: 'Deprecated', scope: ['invalid.deprecated'], foreground: y.deprecated },

    // ------------------------------------------------------------- markup
    {
      name: 'Markdown headings',
      scope: ['markup.heading', 'entity.name.section', 'markup.heading.markdown', 'punctuation.definition.heading.markdown'],
      foreground: y.keyword,
      fontStyle: 'bold',
    },
    { name: 'Markdown bold', scope: ['markup.bold'], foreground: y.type, fontStyle: 'bold' },
    { name: 'Markdown italic', scope: ['markup.italic'], foreground: y.string, fontStyle: 'italic' },
    { name: 'Markdown links', scope: ['markup.underline.link', 'meta.link'], foreground: y.function, fontStyle: 'underline' },
    { name: 'Markdown quote', scope: ['markup.quote', 'punctuation.definition.quote'], foreground: y.comment },
    { name: 'Markdown lists', scope: ['markup.list', 'punctuation.definition.list'], foreground: y.keyword },
    { name: 'Markdown separators', scope: ['meta.separator'], foreground: y.comment },
    { name: 'Inserted', scope: ['markup.inserted', 'meta.diff.header.to-file'], foreground: f.status.added },
    { name: 'Deleted', scope: ['markup.deleted', 'meta.diff.header.from-file'], foreground: f.status.deleted },
    { name: 'Changed', scope: ['markup.changed'], foreground: f.status.modified },
    { name: 'Diff header', scope: ['meta.diff.header', 'punctuation.definition.metadata'], foreground: y.comment },

    // ----------------------------------------------------------- embedded
    { name: 'CSS selectors', scope: ['entity.other.attribute-name.class', 'entity.other.attribute-name.id'], foreground: y.type },
    { name: 'CSS units', scope: ['keyword.other.unit.css', 'constant.numeric.css'], foreground: y.number },
    { name: 'Shell variables', scope: ['variable.other.normal.shell', 'variable.other.special.shell'], foreground: y.parameter },
    { name: 'SQL keywords', scope: ['keyword.other.sql', 'keyword.sql'], foreground: y.keyword },
    { name: 'JSON punctuation', scope: ['punctuation.support.type.property-name.json'], foreground: y.punctuation },
  ];
}

function semanticColors(f: Flavor): ThemeFile['semanticTokenColors'] {
  const y = f.syntax;
  return {
    namespace: y.type,
    class: y.type,
    interface: y.type,
    struct: y.type,
    enum: y.type,
    typeParameter: y.type,
    type: y.type,
    parameter: y.parameter,
    variable: y.variable,
    property: y.property,
    enumMember: y.constant,
    event: y.function,
    function: y.function,
    method: y.method,
    macro: y.decorator,
    label: y.comment,
    keyword: y.keyword,
    modifier: y.keyword,
    comment: { foreground: y.comment },
    string: y.string,
    number: y.number,
    regexp: y.regexp,
    operator: y.operator,
    decorator: y.decorator,
    '*.deprecated': { foreground: y.deprecated, strikethrough: true },
    deprecated: { foreground: y.deprecated, strikethrough: true },
    '*.readonly': { foreground: y.constant },
    '*.static': { foreground: y.keyword },
  };
}

export function buildTheme(flavor: Flavor): ThemeFile {
  return {
    $schema: 'vscode://schemas/color-theme',
    name: themeDisplayName(flavor),
    type: flavor.meta.appearance,
    semanticHighlighting: true,
    colors: workbench(flavor),
    tokenColors: tokenSpecs(flavor).map(({ name, scope, foreground, fontStyle }) => ({
      name,
      scope,
      settings: { ...(foreground ? { foreground } : {}), ...(fontStyle ? { fontStyle } : {}) },
    })),
    semanticTokenColors: semanticColors(flavor),
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export function generateVscode(): GeneratedFile[] {
  return flavors.map((flavor) => ({
    path: `packages/vscode/themes/${vscodeFileName(flavor)}`,
    content: `${JSON.stringify(buildTheme(flavor), null, 2)}\n`,
  }));
}
