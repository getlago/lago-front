import { useStore } from '@tanstack/react-form'
import { useEffect } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { parseFromToValue } from '~/components/Filters/graphql/utils'
import {
  ACTIVE_SUBSCRIPTIONS_INTERVALS_TRANSLATION_MAP,
  ActiveSubscriptionsFilterInterval,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type FiltersItemActiveSubscriptionsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const ACTIVE_SUBSCRIPTIONS_INTERVALS = [
  ActiveSubscriptionsFilterInterval.isBetween,
  ActiveSubscriptionsFilterInterval.isEqualTo,
  ActiveSubscriptionsFilterInterval.isGreaterThan,
  ActiveSubscriptionsFilterInterval.isLessThan,
].map((interval) => ({
  value: interval,
  label: ACTIVE_SUBSCRIPTIONS_INTERVALS_TRANSLATION_MAP[interval],
}))

const FROM_INTERVALS = [
  ActiveSubscriptionsFilterInterval.isGreaterThan,
  ActiveSubscriptionsFilterInterval.isEqualTo,
  ActiveSubscriptionsFilterInterval.isBetween,
]

const TO_INTERVALS = [
  ActiveSubscriptionsFilterInterval.isLessThan,
  ActiveSubscriptionsFilterInterval.isBetween,
]

export const FiltersItemActiveSubscriptions = ({
  value = '',
  setFilterValue,
}: FiltersItemActiveSubscriptionsProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: {
      interval: value.split(',')?.[0],
      activeSubscriptionsFrom: value.split(',')?.[1],
      activeSubscriptionsTo: value.split(',')?.[2],
    },
  })

  const interval = useStore(form.store, (state) => state.values.interval)
  const activeSubscriptionsFrom = useStore(
    form.store,
    (state) => state.values.activeSubscriptionsFrom,
  )
  const activeSubscriptionsTo = useStore(form.store, (state) => state.values.activeSubscriptionsTo)

  const showFrom = FROM_INTERVALS.includes(interval as ActiveSubscriptionsFilterInterval)
  const showTo = TO_INTERVALS.includes(interval as ActiveSubscriptionsFilterInterval)

  useEffect(() => {
    const { activeSubscriptionsFrom: from, activeSubscriptionsTo: to } = parseFromToValue(
      `${interval},${activeSubscriptionsFrom},${activeSubscriptionsTo}`,
      { from: 'activeSubscriptionsFrom', to: 'activeSubscriptionsTo' },
    )

    setFilterValue?.(`${interval},${from !== null ? from : ''},${to !== null ? to : ''}`)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, activeSubscriptionsFrom, activeSubscriptionsTo])

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <form.AppField name="interval">
        {(field) => (
          <field.ComboBoxField
            data={ACTIVE_SUBSCRIPTIONS_INTERVALS.map((subscriptionsInterval) => ({
              value: subscriptionsInterval.value,
              label: translate(subscriptionsInterval.label),
            }))}
            placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
            disableClearable={true}
          />
        )}
      </form.AppField>

      {showFrom && (
        <form.AppField name="activeSubscriptionsFrom">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['int', 'positiveNumber']}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}

      {showFrom && showTo && <Typography className="text-grey-700">and</Typography>}

      {showTo && (
        <form.AppField name="activeSubscriptionsTo">
          {(field) => (
            <field.TextInputField
              beforeChangeFormatter={['int', 'positiveNumber']}
              type="number"
              placeholder="0"
            />
          )}
        </form.AppField>
      )}
    </div>
  )
}
