import { useStore } from '@tanstack/react-form'
import { useEffect } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { parseFromToValue } from '~/components/Filters/graphql/utils'
import {
  AMOUNT_INTERVALS_TRANSLATION_MAP,
  AmountFilterInterval,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type FiltersItemAmountProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const AMOUNT_INTERVALS = [
  AmountFilterInterval.isBetween,
  AmountFilterInterval.isEqualTo,
  AmountFilterInterval.isUpTo,
  AmountFilterInterval.isAtLeast,
].map((interval) => ({ value: interval, label: AMOUNT_INTERVALS_TRANSLATION_MAP[interval] }))

const FROM_INTERVALS = [
  AmountFilterInterval.isAtLeast,
  AmountFilterInterval.isEqualTo,
  AmountFilterInterval.isBetween,
]

const TO_INTERVALS = [AmountFilterInterval.isUpTo, AmountFilterInterval.isBetween]

export const FiltersItemAmount = ({ value = '', setFilterValue }: FiltersItemAmountProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: {
      interval: value.split(',')?.[0],
      amountFrom: value.split(',')?.[1],
      amountTo: value.split(',')?.[2],
    },
  })

  const interval = useStore(form.store, (state) => state.values.interval)
  const amountFrom = useStore(form.store, (state) => state.values.amountFrom)
  const amountTo = useStore(form.store, (state) => state.values.amountTo)

  const showFrom = FROM_INTERVALS.includes(interval as AmountFilterInterval)
  const showTo = TO_INTERVALS.includes(interval as AmountFilterInterval)

  useEffect(() => {
    const { amountFrom: from, amountTo: to } = parseFromToValue(
      `${interval},${amountFrom},${amountTo}`,
      { from: 'amountFrom', to: 'amountTo' },
    )

    setFilterValue?.(`${interval},${from !== null ? from : ''},${to !== null ? to : ''}`)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, amountFrom, amountTo])

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <form.AppField name="interval">
        {(field) => (
          <field.ComboBoxField
            data={AMOUNT_INTERVALS.map((amountInterval) => ({
              value: amountInterval.value,
              label: translate(amountInterval.label),
            }))}
            placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
            disableClearable={true}
          />
        )}
      </form.AppField>

      {showFrom && (
        <form.AppField name="amountFrom">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['chargeDecimal']}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}

      {showFrom && showTo && <Typography className="text-grey-700">and</Typography>}

      {showTo && (
        <form.AppField name="amountTo">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['chargeDecimal']}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}
    </div>
  )
}
