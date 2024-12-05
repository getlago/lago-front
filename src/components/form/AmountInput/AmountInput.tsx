import { forwardRef } from 'react'

import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

import { TextInput, TextInputProps, ValueFormatter, ValueFormatterType } from '../TextInput'

type AmountValueFormatter = Exclude<
  keyof typeof ValueFormatter,
  'int' | 'decimal' | 'triDecimal' | 'quadDecimal'
>

type AmountValueFormatterType = AmountValueFormatter

export interface AmountInputProps extends Omit<TextInputProps, 'beforeChangeFormatter'> {
  currency: CurrencyEnum
  beforeChangeFormatter?: AmountValueFormatterType[] | AmountValueFormatterType
}

const defineNewBeforeChangeFormatter = (
  beforeChangeFormatter: AmountInputProps['beforeChangeFormatter'],
  currency: CurrencyEnum,
) => {
  const newBeforeChangeFormatter: ValueFormatterType[] = [
    beforeChangeFormatter
      ? typeof beforeChangeFormatter === 'string'
        ? beforeChangeFormatter
        : [beforeChangeFormatter].flat()
      : [],
  ].flat()

  if (beforeChangeFormatter?.includes('chargeDecimal')) {
    return beforeChangeFormatter
  }

  if (getCurrencyPrecision(currency) === 0) {
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

const definedDefaultPlaceholder = (currency: CurrencyEnum, translate: TranslateFunc) => {
  if (getCurrencyPrecision(currency) === 0) {
    return translate('text_63971043c9668f1ba5221bac', undefined, 0)
  } else if (getCurrencyPrecision(currency) === 3) {
    return translate('text_63971043c9668f1ba5221bac', undefined, 2)
  } else if (getCurrencyPrecision(currency) === 4) {
    return translate('text_644250cc64306c00c12fc2ca')
  }

  return translate('text_63971043c9668f1ba5221bac', undefined, 1)
}

export const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  ({ currency, beforeChangeFormatter, placeholder, ...props }: AmountInputProps, ref) => {
    const { translate } = useInternationalization()
    const newBeforeChangeFormatter = defineNewBeforeChangeFormatter(beforeChangeFormatter, currency)
    const newPlaceholder = placeholder ?? definedDefaultPlaceholder(currency, translate)

    return (
      <TextInput
        ref={ref}
        beforeChangeFormatter={newBeforeChangeFormatter}
        placeholder={newPlaceholder}
        {...props}
      />
    )
  },
)

AmountInput.displayName = 'AmountInput'
