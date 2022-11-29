import { useCallback } from 'react'

import { IntlLocale, useInternationalizationVar, updateIntlLocale } from '~/core/apolloClient'
import { AppEnvEnum } from '~/globalTypes'
import { envGlobalVar } from '~/core/apolloClient'

const { appEnv } = envGlobalVar()

export type TranslateFunc = (
  key: string,
  data?: Record<string, string | number | undefined | null>,
  plural?: number
) => string

type UseInternationalization = () => {
  locale: IntlLocale
  translate: TranslateFunc
  updateLocale: (locale: IntlLocale) => void
}

export function replaceDynamicVarInString(
  template: string,
  data: Record<string, string | number | undefined | null>
) {
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

export const useInternationalization: UseInternationalization = () => {
  const { translations, locale } = useInternationalizationVar()

  return {
    locale,
    translate: useCallback(
      (key, data, plural = 0) => {
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
      },
      [translations, locale]
    ),
    updateLocale: updateIntlLocale,
  }
}
