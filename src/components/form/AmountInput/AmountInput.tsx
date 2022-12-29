import { forwardRef } from 'react'
import styled, { css } from 'styled-components'

import { getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

import { TextInput, TextInputProps, ValueFormatter, ValueFormatterType } from '../TextInput'

type AmountValueFormatter = Exclude<keyof typeof ValueFormatter, 'int' | 'decimal' | 'triDecimal'>

type AmountValueFormatterType = AmountValueFormatter

export interface AmountInputProps extends Omit<TextInputProps, 'beforeChangeFormatter'> {
  currency: CurrencyEnum
  beforeChangeFormatter?: AmountValueFormatterType[] | AmountValueFormatterType
  displayErrorText?: boolean
}

const defineNewBeforeChangeFormatter = (
  beforeChangeFormatter: AmountInputProps['beforeChangeFormatter'],
  currency: CurrencyEnum
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
  }

  return translate('text_63971043c9668f1ba5221bac', undefined, 1)
}

export const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  (
    {
      currency,
      beforeChangeFormatter,
      placeholder,
      displayErrorText = true,
      ...props
    }: AmountInputProps,
    ref
  ) => {
    const { translate } = useInternationalization()
    const newBeforeChangeFormatter = defineNewBeforeChangeFormatter(beforeChangeFormatter, currency)
    const newPlaceholder = placeholder ?? definedDefaultPlaceholder(currency, translate)

    return (
      <StyledTextInput
        ref={ref}
        $displayErrorText={displayErrorText}
        beforeChangeFormatter={newBeforeChangeFormatter}
        placeholder={newPlaceholder}
        {...props}
      />
    )
  }
)

AmountInput.displayName = 'AmountInput'

const StyledTextInput = styled(TextInput)<{ $displayErrorText?: boolean }>`
  ${({ $displayErrorText }) =>
    !$displayErrorText &&
    css`
      .MuiTextField-root {
        margin-bottom: 0 !important;
      }
    `}
`
