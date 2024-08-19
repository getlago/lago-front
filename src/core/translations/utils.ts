import { AppEnvEnum } from '~/core/constants/globalTypes'

import { Locale, TranslateData, Translation, Translations } from './types'

export const getTranslations: (locale: Locale) => Promise<Record<string, string>> = async (
  locale,
) => {
  let loadedTranslation: Translation

  // Translations are dinamically imported according to the selected locale
  try {
    loadedTranslation = (await import(`../../../translations/${locale}.json`)) as Translation
  } catch (err) {
    loadedTranslation = (await import(`../../../translations/base.json`)) as unknown as Translation
  }

  return loadedTranslation
}

export function replaceDynamicVarInString(template: string, data: TranslateData) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key]))
}

export function getPluralTranslation(template: string, plural: number) {
  // Translations are defined on the following base : "none | unique | plural" or "unique | plural"
  const splitted = template.split('|')

  switch (true) {
    case splitted.length < 2:
      return template
    case splitted.length === 2:
      return plural < 2 ? splitted[0] : splitted[1]
    default:
      return splitted[plural] || splitted.slice(-1)[0]
  }
}

export const translateKey: (
  context: {
    translations: Translations
    locale: Locale
    appEnv: AppEnvEnum
  },
  key: string,
  data?: TranslateData,
  plural?: number,
) => string = ({ translations, locale, appEnv }, key, data, plural = 0) => {
  if (!translations || Object.keys(translations).length === 0) {
    return ''
  }

  if (!translations || !translations[key]) {
    if ([AppEnvEnum.qa, AppEnvEnum.development].includes(appEnv)) {
      // eslint-disable-next-line no-console
      console.warn(`Translation '${key}' for locale '${locale}' not found.`)
    }
    return key
  }

  const translation = getPluralTranslation(translations[key], plural)

  return data ? replaceDynamicVarInString(translation, data) : translation
}
