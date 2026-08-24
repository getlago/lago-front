import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { getTimezoneConfig } from '~/core/timezone'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

type FiltersItemWebhookDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemWebhookDate = ({ value, setFilterValue }: FiltersItemWebhookDateProps) => {
  const { timezone } = useOrganizationInfos()

  return (
    <DateRangeFilterFields
      disableFutureFromDate
      disableFutureToDate
      defaultZone={getTimezoneConfig(timezone).name}
      placement="auto"
      setFilterValue={setFilterValue}
      value={value}
    />
  )
}
