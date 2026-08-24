import { Typography } from '~/components/designSystem/Typography'
import { useDateRangeFilterValue } from '~/components/Filters/graphql/filtersElements/useDateRangeFilterValue'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { DatePicker } from '~/components/form'
import { getTimezoneConfig } from '~/core/timezone'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

type FiltersItemWebhookDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemWebhookDate = ({
  value = ',',
  setFilterValue,
}: FiltersItemWebhookDateProps) => {
  const { translate } = useInternationalization()
  const { timezone } = useOrganizationInfos()
  const defaultZone = getTimezoneConfig(timezone).name
  const { from, to, maxFromDate, minToDate, handleFromChange, handleToChange } =
    useDateRangeFilterValue({ value, setFilterValue })

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        disableFuture
        showErrorInTooltip
        placement="auto"
        className="flex-1"
        defaultZone={defaultZone}
        maxDate={maxFromDate}
        onChange={handleFromChange}
        value={from}
      />
      <Typography variant="body" color="grey700">
        <div className="block lg:hidden">-</div>
        <div className="hidden lg:block">
          {translate('text_65f8472df7593301061e27d6').toLowerCase()}
        </div>
      </Typography>
      <DatePicker
        disableFuture
        showErrorInTooltip
        placement="auto"
        className="flex-1"
        defaultZone={defaultZone}
        minDate={minToDate}
        onChange={handleToChange}
        value={to}
      />
    </div>
  )
}
