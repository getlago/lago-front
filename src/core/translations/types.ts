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

// Available locales in BCP 47 language formats
export const LocaleBCPMapping: Record<LocaleEnum, string> = {
  [LocaleEnum.en]: 'en',
  [LocaleEnum.fr]: 'fr',
  [LocaleEnum.nb]: 'nb',
  [LocaleEnum.de]: 'de',
  [LocaleEnum.it]: 'it',
  [LocaleEnum.es]: 'es',
  [LocaleEnum.sv]: 'sv',
  [LocaleEnum.pt_BR]: 'pt-BR',
}

export type Locale = keyof typeof LocaleEnum
