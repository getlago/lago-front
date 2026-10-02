import { NumericRangeFilterFields } from '~/components/Filters/graphql/filtersElements/NumericRangeFilterFields'
import {
  ACTIVE_SUBSCRIPTIONS_INTERVALS_TRANSLATION_MAP,
  ActiveSubscriptionsFilterInterval,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'

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
  value,
  setFilterValue,
}: FiltersItemActiveSubscriptionsProps) => (
  <NumericRangeFilterFields
    value={value}
    setFilterValue={setFilterValue}
    intervals={ACTIVE_SUBSCRIPTIONS_INTERVALS}
    fromIntervals={FROM_INTERVALS}
    toIntervals={TO_INTERVALS}
    beforeChangeFormatter={['int', 'positiveNumber']}
  />
)
