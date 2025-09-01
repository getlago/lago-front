import { LocaleEnum } from '~/core/translations/types'

type documentLocalesType = {
  [key in LocaleEnum]: string
}

// NOTE: Using hyphen instead of underscore, for consistency with IANA locale names
export const DocumentLocales: documentLocalesType = {
  fr: 'French',
  en: 'English',
  de: 'German',
  nb: 'Norwegian (Bokmål)',
  it: 'Italian',
  es: 'Spanish',
  sv: 'Swedish',
  'pt-BR': 'Portuguese (Brazil)',
}

export const documentLocalesDataForComboBox: { value: LocaleEnum; label: string }[] = (
  Object.keys(DocumentLocales) as Array<keyof typeof DocumentLocales>
).map((localeKey) => {
  return {
    value: localeKey,
    label: DocumentLocales[localeKey],
  }
})
