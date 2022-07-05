import { makeVar, useReactiveVar } from '@apollo/client'

import { getItemFromLS, setItemFromLS } from '../utils'

const LOCALE_LS_KEY = 'locale'

export enum LocaleEnum {
  'en' = 'en',
}

export type IntlLocale = keyof typeof LocaleEnum

interface InternationalizationVar {
  locale: IntlLocale
  translations?: Record<string, string>
}

interface DittoTranslation {
  [key: string]: string
}

const getTranslations: (locale: IntlLocale) => Promise<Record<string, string>> = async (locale) => {
  let loadedDittoTranslation: DittoTranslation

  // Translations are dinamically imported according to the selected locale
  try {
    loadedDittoTranslation = (await import(`../../../../ditto/${locale}.json`)) as DittoTranslation
  } catch (err) {
    loadedDittoTranslation = (await import(
      `../../../../ditto/base.json`
    )) as unknown as DittoTranslation
  }

  return loadedDittoTranslation
}

export const internationalizationVar = makeVar<InternationalizationVar>({
  locale: getItemFromLS(LOCALE_LS_KEY) ?? LocaleEnum.en,
  translations: {},
})

export const initializeTranslations = async () => {
  const { locale } = internationalizationVar()
  const translations = await getTranslations(locale)

  internationalizationVar({
    locale,
    translations,
  })
}

export const updateIntlLocale = async (locale: IntlLocale) => {
  setItemFromLS(LOCALE_LS_KEY, locale)
  const translations = await getTranslations(locale)

  internationalizationVar({
    locale,
    translations,
  })
}

export const useInternationalizationVar = () => useReactiveVar(internationalizationVar)
