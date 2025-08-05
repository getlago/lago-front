import { LocaleEnum } from '~/core/translations'

const SEPARATORS = {
  COMMA: ',',
  HYPHEN: '-',
}

const CityStateZipcodeLocaleFormat: Record<LocaleEnum, string> = {
  de: '{{zipcode}} {{city}}',
  en: '{{city}}{{COMMA}} {{state}} {{zipcode}}',
  fr: '{{zipcode}} {{city}}',
  it: '{{zipcode}} {{city}}',
  nb: '{{zipcode}} {{city}}',
  pt_BR: '{{city}} {{HYPHEN}} {{state}}{{COMMA}} {{zipcode}}',
  es: '{{zipcode}} {{city}}{{COMMA}} {{state}}',
  sv: '{{zipcode}} {{city}}',
}

const hasNextMeaningfulToken = (
  tokens: string[],
  currentIndex: number,
  values: Record<string, string | undefined>,
): boolean => {
  for (let i = currentIndex + 1; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.startsWith('{{') && token.endsWith('}}')) {
      const key = token.slice(2, -2)

      if (key !== 'COMMA' && key !== 'HYPHEN' && values[key]) {
        return true
      }
    }
  }

  return false
}

export const formatCityStateZipcodeString = ({
  city,
  state,
  zipcode,
  locale,
}: {
  city: string | null | undefined
  state: string | null | undefined
  zipcode: string | null | undefined
  locale?: LocaleEnum
}): string => {
  const template = CityStateZipcodeLocaleFormat[locale || 'en']

  const values = {
    city: city?.trim(),
    state: state?.trim(),
    zipcode: zipcode?.trim(),
  }

  const tokens = template.split(/(\{\{[^}]+\}\})/).filter(Boolean)

  let result = ''
  let previousTokenHadValue = false

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.startsWith('{{') && token.endsWith('}}')) {
      const key = token.slice(2, -2)

      if (key in SEPARATORS) {
        // Only add separator if the previous token had a value and there's a next meaningful token
        const nextMeaningfulToken = hasNextMeaningfulToken(tokens, i, values)

        if (previousTokenHadValue && nextMeaningfulToken) {
          result += SEPARATORS[key as keyof typeof SEPARATORS]
        }
      } else if (values[key as keyof typeof values]) {
        // Add the actual value
        result += values[key as keyof typeof values]
        previousTokenHadValue = true
      } else {
        // Value doesn't exist, mark as no value
        previousTokenHadValue = false
      }
    } else {
      // Regular text (spaces, etc.)
      if (previousTokenHadValue) {
        result += token
      }
    }
  }

  return result.replace(/\s+/g, ' ').trim()
}
