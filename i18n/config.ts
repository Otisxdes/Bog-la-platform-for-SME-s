export const locales = ['ru', 'uz', 'en'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  uz: "O'zbekcha",
  en: 'English',
}

export const defaultLocale: Locale = 'ru'

