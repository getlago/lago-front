import { forwardRef, useMemo } from 'react'

import { TextInput, TextInputProps } from '~/components/form/TextInput'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  AmountFormattingOptions,
  definedDefaultPlaceholder,
  defineNewBeforeChangeFormatter,
} from './formatting'

export type { AmountValueFormatter } from './formatting'
export interface AmountInputProps
  extends Omit<TextInputProps, 'beforeChangeFormatter'>, AmountFormattingOptions {}

export const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  (
    {
      currency,
      beforeChangeFormatter,
      placeholder,
      chargePricingUnitShortName,
      ...props
    }: AmountInputProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
    const newBeforeChangeFormatter = useMemo(
      () =>
        defineNewBeforeChangeFormatter({
          beforeChangeFormatter,
          currency,
          chargePricingUnitShortName,
        }),
      [beforeChangeFormatter, currency, chargePricingUnitShortName],
    )
    const newPlaceholder = useMemo(
      () =>
        placeholder ??
        definedDefaultPlaceholder({ currency, translate, chargePricingUnitShortName }),
      [placeholder, currency, translate, chargePricingUnitShortName],
    )

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
