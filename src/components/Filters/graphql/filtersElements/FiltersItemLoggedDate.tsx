import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

type FiltersItemLoggedDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemLoggedDate = ({ value, setFilterValue }: FiltersItemLoggedDateProps) => (
  <DateRangeFilterFields
    disableFutureToDate
    defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
    setFilterValue={setFilterValue}
    value={value}
  />
)
