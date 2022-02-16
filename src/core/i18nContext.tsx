/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useState, useEffect, useCallback, createContext } from 'react'

export enum LocaleEnum {
  'en' = 'en',
}

interface DittoTranslation {
  projects: {
    [key: string]: Record<string, string>
  }
}

interface I18nProviderProps {
  locale: LocaleEnum
  children: any
}

export const I18nContext = createContext({
  locale: LocaleEnum.en,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  translate: (key: string, data?: Record<string, any>, plural?: number): string => {
    return key
  },
})

function replaceDynamicVarInString(template: string, data: Record<string, any>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key])
}

function getPluralTranslation(template: string, plural: number) {
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

export const I18nProvider = ({ locale, children }: I18nProviderProps) => {
  const [translations, setTranslations] = useState<Record<string, string>>({})

  // Translations are dinamically imported according to the selected locale
  useEffect(() => {
    const loadTranslations = async () => {
      let loadedDittoTranslation: DittoTranslation
      let dittoTranslationKeys: Record<string, string>

      try {
        loadedDittoTranslation = (await import(`../../ditto/${locale}.json`)) as DittoTranslation
      } catch (err) {
        loadedDittoTranslation = (await import(`../../ditto/base.json`)) as DittoTranslation
      }

      if (loadedDittoTranslation?.projects) {
        dittoTranslationKeys =
          Object.keys(loadedDittoTranslation?.projects).reduce<Record<string, string>>(
            (acc, key) => {
              return { ...acc, ...loadedDittoTranslation.projects[key] }
            },
            {}
          ) || {}
        setTranslations(dittoTranslationKeys || {})
      }
    }

    loadTranslations()
  }, [locale])

  // Translate function that will be used in pages/component to get translations
  const translate = useCallback(
    (key: string, data?: Record<string, any>, plural = 0) => {
      console.log('zut')
      if (!translations || Object.keys(translations).length === 0) {
        return ''
      }

      if (!translations || !translations[key]) {
        if (!IS_PROD_ENV) {
          // eslint-disable-next-line no-console
          console.warn(`Translation '${key}' for locale '${locale}' not found.`)
        }
        return key
      }

      const translation = getPluralTranslation(translations[key], plural)

      return data ? replaceDynamicVarInString(translation, data) : translation
    },
    [translations, locale]
  )

  return <I18nContext.Provider value={{ locale, translate }}>{children}</I18nContext.Provider>
}

export const useI18nContext = () => useContext(I18nContext)
