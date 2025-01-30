import { makeVar, useReactiveVar } from '@apollo/client'

import { getItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'
import { getTranslations, Locale, LocaleEnum } from '~/core/translations'

const LOCALE_LS_KEY = 'locale'

interface InternationalizationVar {
  locale: Locale
  translations?: Record<string, string>
}

const internationalizationVar = makeVar<InternationalizationVar>({
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

export const updateIntlLocale = async (locale: Locale) => {
  setItemFromLS(LOCALE_LS_KEY, locale)
  const translations = await getTranslations(locale)

  internationalizationVar({
    locale,
    translations,
  })
}

export const useInternationalizationVar = () => useReactiveVar(internationalizationVar)
