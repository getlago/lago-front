import { useCallback, useEffect, useState } from 'react'

import { envGlobalVar } from '~/core/apolloClient'
import {
  DittoTranslation,
  getTranslations,
  Locale,
  TranslateData,
  translateKey,
} from '~/core/translations'

const { appEnv } = envGlobalVar()

type UseContextualLocale = (locale: Locale) => {
  translateWithContextualLocal: (key: string, data?: TranslateData, plural?: number) => string
}

export const useContextualLocale: UseContextualLocale = (locale) => {
  const [translations, setTranslations] = useState<DittoTranslation>()

  useEffect(() => {
    const updateTranslations = async () => {
      const contextualTranslations = await getTranslations(locale)

      setTranslations(contextualTranslations)
    }

    updateTranslations()
  }, [locale])

  return {
    translateWithContextualLocal: useCallback(
      (key, data, plural = 0) => {
        return translateKey({ translations, locale, appEnv }, key, data, plural)
      },
      [translations, locale],
    ),
  }
}
