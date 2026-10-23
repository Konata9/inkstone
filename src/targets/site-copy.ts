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
  specimenTitle: string;
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
      'Inkstone (墨观) is a traditional Chinese color theme for VS Code, Cursor, Ghostty, WezTerm and OpenCode: six variants from the 526-color zhongguose palette.',
    brandZh: '墨观',
    brandEn: 'Inkstone',
    tagline:
      'Six variants share one hue skeleton, so switching feels like the same painting under a different light.',
    inspirationBody:
      'Colours come from the 526-entry zhongguose chart. Ink & paper (玄墨 / 宣纸) and sea & celadon (沧海 / 青瓷) keep the same hue order; Dimmed lowers the room light, not the ink.',
    editorsTitle: 'Editors',
    terminalsTitle: 'Terminals',
    flavorsLabel: 'Variants',
    ctaInstall: 'Install from Releases',
    ctaSource: 'Source on GitHub',
    specimenTitle: 'Active palette',
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
      '墨观从 526 个中国传统颜色中取色，为 VS Code、Cursor、Ghostty、WezTerm 与 OpenCode 提供六个变体：玄墨、宣纸、沧海、青瓷及 Dimmed。',
    brandZh: '墨观',
    brandEn: 'Inkstone',
    tagline: '六个变体共用同一套色相骨架，切换时像同一幅画换了光线。',
    inspirationBody:
      '色值来自 zhongguose 526 色色谱。墨纸组（玄墨 / 宣纸）与海瓷组（沧海 / 青瓷）色相顺序一致；Dimmed 只降环境光，不降墨色。',
    editorsTitle: '编辑器',
    terminalsTitle: '终端',
    flavorsLabel: '变体',
    ctaInstall: '从 Releases 安装',
    ctaSource: 'GitHub 源码',
    specimenTitle: '当前色板',
    previewLabel: '编辑器',
    footerLicense: 'MIT 许可',
    footerPalette: '色板对照',
    langEn: 'EN',
    langZh: '中文',
    skipToContent: '跳到正文',
  },
};
