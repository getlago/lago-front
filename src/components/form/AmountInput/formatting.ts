import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import type { TranslateFunc } from '~/hooks/core/useInternationalization'

import { ValueFormatter, ValueFormatterType } from '../TextInput/formatValue'

export type AmountValueFormatter = Exclude<
  keyof typeof ValueFormatter,
  'int' | 'decimal' | 'triDecimal' | 'quadDecimal'
>
export interface AmountFormattingOptions {
  currency: CurrencyEnum
  chargePricingUnitShortName?: string
  beforeChangeFormatter?: AmountValueFormatter[] | AmountValueFormatter
}

export const defineNewBeforeChangeFormatter = ({
  beforeChangeFormatter,
  currency,
  chargePricingUnitShortName,
}: AmountFormattingOptions): ValueFormatterType[] | ValueFormatterType => {
  const newBeforeChangeFormatter: ValueFormatterType[] = [
    ((): AmountValueFormatter[] | AmountValueFormatter => {
      if (!beforeChangeFormatter) return []
      if (typeof beforeChangeFormatter === 'string') return beforeChangeFormatter
      return [beforeChangeFormatter].flat()
    })(),
  ].flat()

  if (beforeChangeFormatter?.includes('chargeDecimal')) {
    return beforeChangeFormatter
  }

  if (!!chargePricingUnitShortName) {
    newBeforeChangeFormatter.push('decimal')
  } else if (getCurrencyPrecision(currency) === 0) {
    newBeforeChangeFormatter.push('int')
  } else if (getCurrencyPrecision(currency) === 3) {
    newBeforeChangeFormatter.push('triDecimal')
  } else if (getCurrencyPrecision(currency) === 4) {
    newBeforeChangeFormatter.push('quadDecimal')
  } else {
    newBeforeChangeFormatter.push('decimal')
  }

  return newBeforeChangeFormatter
}

export const definedDefaultPlaceholder = ({
  currency,
  translate,
  chargePricingUnitShortName,
}: {
  currency: CurrencyEnum
  translate: TranslateFunc
  chargePricingUnitShortName?: string
}): string => {
  if (!!chargePricingUnitShortName) {
    return translate('text_63971043c9668f1ba5221bac', undefined, 1)
  } else if (getCurrencyPrecision(currency) === 0) {
    return translate('text_63971043c9668f1ba5221bac', undefined, 0)
  } else if (getCurrencyPrecision(currency) === 3) {
    return translate('text_63971043c9668f1ba5221bac', undefined, 2)
  } else if (getCurrencyPrecision(currency) === 4) {
    return translate('text_644250cc64306c00c12fc2ca')
  }

  return translate('text_63971043c9668f1ba5221bac', undefined, 1)
}
