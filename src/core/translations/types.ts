export type TranslateData = Record<string, string | number | undefined | null>

export type Translations = Record<string, string> | undefined

export interface Translation {
  [key: string]: string
}

export enum LocaleEnum {
  en = 'en',
  fr = 'fr', // French
  nb = 'nb', // Norwegian
  de = 'de', // German
  it = 'it', // Italian
  es = 'es', // Spanish
  sv = 'sv', // Swedish
  pt_BR = 'pt_BR', // Brazilian Portuguese
}
export type Locale = keyof typeof LocaleEnum
