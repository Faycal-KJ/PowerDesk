export type Language = 'en' | 'fr' | 'es' | 'de' | 'ar' | 'zh' | 'ja' | 'ko' | 'pt' | 'ru' | 'tr' | 'it' | 'nl' | 'pl' | 'sv' | 'hi' | 'ur'

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'zh', label: '\u4e2d\u6587' },
  { code: 'ja', label: '\u65e5\u672c\u8a9e' },
  { code: 'ko', label: '\ud55c\uad6d\uc5b4' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'tr', label: 'T\u00fcrk\u00e7e' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'sv', label: 'Svenska' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'ur', label: '\u0627\u0631\u062f\u0648' },
]
