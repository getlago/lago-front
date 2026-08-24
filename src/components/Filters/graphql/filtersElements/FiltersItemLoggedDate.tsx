import { Typography } from '~/components/designSystem/Typography'
import { useDateRangeFilterValue } from '~/components/Filters/graphql/filtersElements/useDateRangeFilterValue'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { DatePicker } from '~/components/form'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemLoggedDate = ({ value = ',', setFilterValue }: FiltersItemDateProps) => {
  const { translate } = useInternationalization()
  const { from, to, maxFromDate, minToDate, handleFromChange, handleToChange } =
    useDateRangeFilterValue({ value, setFilterValue })

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
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
        className="flex-1"
        defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
        minDate={minToDate}
        onChange={handleToChange}
        value={to}
      />
    </div>
  )
}
