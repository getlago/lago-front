import { useStore } from '@tanstack/react-form'
import { useEffect } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { parseFromToValue } from '~/components/Filters/graphql/utils'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { ValueFormatterType } from '~/components/form/TextInput'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type NumericRangeFilterFieldsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
  intervals: readonly { value: string; label: string }[]
  fromIntervals: readonly string[]
  toIntervals: readonly string[]
  beforeChangeFormatter: ValueFormatterType[]
}

/**
 * The interval selector and the two bounds behind every `interval,from,to` numeric filter.
 * Each surface differs only by its interval enum and the formatter its bounds accept, so the
 * markup and the round-trip through `parseFromToValue` live here once rather than in each
 * `FiltersItem*`.
 *
 * `intervals` carries translation keys, not labels: callers stay a list of constants and the
 * enum-typed interval arrays they pass keep rejecting a value outside their own enum, while
 * this component only ever needs to compare them as strings.
 */
export const NumericRangeFilterFields = ({
  value = '',
  setFilterValue,
  intervals,
  fromIntervals,
  toIntervals,
  beforeChangeFormatter,
}: NumericRangeFilterFieldsProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: {
      interval: value.split(',')?.[0],
      from: value.split(',')?.[1],
      to: value.split(',')?.[2],
    },
  })

  const interval = useStore(form.store, (state) => state.values.interval)
  const from = useStore(form.store, (state) => state.values.from)
  const to = useStore(form.store, (state) => state.values.to)

  const showFrom = fromIntervals.includes(interval)
  const showTo = toIntervals.includes(interval)

  useEffect(() => {
    const { from: parsedFrom, to: parsedTo } = parseFromToValue(`${interval},${from},${to}`, {
      from: 'from',
      to: 'to',
    })

    setFilterValue(`${interval},${parsedFrom ?? ''},${parsedTo ?? ''}`)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, from, to])

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <form.AppField name="interval">
        {(field) => (
          <field.ComboBoxField
            data={intervals.map(({ value: intervalValue, label }) => ({
              value: intervalValue,
              label: translate(label),
            }))}
            placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
            disableClearable={true}
          />
        )}
      </form.AppField>

      {showFrom && (
        <form.AppField name="from">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={beforeChangeFormatter}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}

      {showFrom && showTo && <Typography className="text-grey-700">and</Typography>}

      {showTo && (
        <form.AppField name="to">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={beforeChangeFormatter}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}
    </div>
  )
}
