/**
 * Locale strings for the product site. Embedded at build time — no runtime i18n.
 */

export type SiteLocale = 'en' | 'zh';

export interface SiteCopy {
  htmlLang: string;
  ogLocale: string;
  title: string;
  description: string;
  brandZh: string;
  brandEn: string;
  tagline: string;
  inspirationBody: string;
  editorsTitle: string;
  terminalsTitle: string;
  flavorsLabel: string;
  ctaInstall: string;
  ctaSource: string;
  specimenLabel: string;
  colorIdeaLabel: string;
  previewLabel: string;
  footerLicense: string;
  footerPalette: string;
  langEn: string;
  langZh: string;
  skipToContent: string;
}

export const siteCopy: Record<SiteLocale, SiteCopy> = {
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    title: 'Inkstone · Traditional Chinese color themes',
    description:
      'A code palette grown from 526 traditional Chinese colors, with six variants for VS Code, Cursor, Ghostty, WezTerm and OpenCode.',
    brandZh: '墨观',
    brandEn: 'Inkstone',
    tagline:
      'A code palette grown from 526 traditional Chinese colors. Six variants share one hue skeleton, so switching feels like the same painting under a different light.',
    inspirationBody:
      'All six palettes draw from the same traditional Chinese chart. Ink & paper sit on paper and soot; sea & celadon sit on deep water and glaze. Dimmed turns the lights down — it never puts a gray filter over the ink.',
    editorsTitle: 'Editors',
    terminalsTitle: 'Terminals',
    flavorsLabel: 'Variants',
    ctaInstall: 'Install from Releases',
    ctaSource: 'Source on GitHub',
    specimenLabel: 'Palettes',
    colorIdeaLabel: 'Color idea',
    previewLabel: 'Editor',
    footerLicense: 'MIT License',
    footerPalette: 'Palette reference',
    langEn: 'EN',
    langZh: '中文',
    skipToContent: 'Skip to content',
  },
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    title: '墨观 Inkstone · 中国传统色彩主题',
    description:
      '一套从 526 个中国传统颜色里长出来的代码配色，为 VS Code、Cursor、Ghostty、WezTerm 与 OpenCode 提供六个变体。',
    brandZh: '墨观',
    brandEn: 'Inkstone',
    tagline:
      '一套从 526 个中国传统颜色里长出来的代码配色。六个变体共用同一套色相骨架，切换时像同一幅画换了光线。',
    inspirationBody:
      '六套色板都从同一张中国传统色谱里取色。墨纸组以纸墨为底，海瓷组以深海与青瓷釉为底；Dimmed 不是蒙一层灰，而是把房间的灯调暗。',
    editorsTitle: '编辑器',
    terminalsTitle: '终端',
    flavorsLabel: '变体',
    ctaInstall: '从 Releases 安装',
    ctaSource: 'GitHub 源码',
    specimenLabel: '色板',
    colorIdeaLabel: '配色思路',
    previewLabel: '编辑器',
    footerLicense: 'MIT 许可',
    footerPalette: '色板对照',
    langEn: 'EN',
    langZh: '中文',
    skipToContent: '跳到正文',
  },
};
