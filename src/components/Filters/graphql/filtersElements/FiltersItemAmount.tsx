import { NumericRangeFilterFields } from '~/components/Filters/graphql/filtersElements/NumericRangeFilterFields'
import {
  AMOUNT_INTERVALS_TRANSLATION_MAP,
  AmountFilterInterval,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'

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

export const FiltersItemAmount = ({ value, setFilterValue }: FiltersItemAmountProps) => (
  <NumericRangeFilterFields
    value={value}
    setFilterValue={setFilterValue}
    intervals={AMOUNT_INTERVALS}
    fromIntervals={FROM_INTERVALS}
    toIntervals={TO_INTERVALS}
    beforeChangeFormatter={['chargeDecimal']}
  />
)
