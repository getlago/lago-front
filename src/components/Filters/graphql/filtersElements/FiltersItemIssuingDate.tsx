import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { FiltersFormValues } from '~/components/Filters/presentation/types'

type FiltersItemIssuingDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemIssuingDate = ({ value, setFilterValue }: FiltersItemIssuingDateProps) => (
  <DateRangeFilterFields setFilterValue={setFilterValue} value={value} />
)
