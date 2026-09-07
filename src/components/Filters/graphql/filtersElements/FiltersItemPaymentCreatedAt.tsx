import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { FiltersFormValues } from '~/components/Filters/presentation/types'

type Props = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemPaymentCreatedAt = (props: Props) => <DateRangeFilterFields {...props} />
