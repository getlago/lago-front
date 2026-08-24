import { Typography } from '~/components/designSystem/Typography'
import { useDateRangeFilterValue } from '~/components/Filters/graphql/filtersElements/useDateRangeFilterValue'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { DatePicker, DatePickerProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type DateRangeFilterFieldsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
  /** Timezone the bounds are read and written in. Defaults to the picker's own zone. */
  defaultZone?: string
  disableFutureFromDate?: boolean
  disableFutureToDate?: boolean
  placement?: DatePickerProps['placement']
}

/**
 * The two pickers behind every `from,to` date range filter. Each surface differs only by
 * timezone, future-date availability and popper placement, so the markup and the ordering
 * guard live here once rather than in each `FiltersItem*Date`.
 */
export const DateRangeFilterFields = ({
  value = ',',
  setFilterValue,
  defaultZone,
  disableFutureFromDate,
  disableFutureToDate,
  placement,
}: DateRangeFilterFieldsProps) => {
  const { translate } = useInternationalization()
  const { from, to, maxFromDate, minToDate, handleFromChange, handleToChange } =
    useDateRangeFilterValue({ value, setFilterValue })

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        defaultZone={defaultZone}
        disableFuture={disableFutureFromDate}
        maxDate={maxFromDate}
        onChange={handleFromChange}
        placement={placement}
        value={from}
      />
      <Typography variant="body" color="grey700">
        <div className="block lg:hidden">-</div>
        <div className="hidden lg:block">
          {translate('text_65f8472df7593301061e27d6').toLowerCase()}
        </div>
      </Typography>
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        defaultZone={defaultZone}
        disableFuture={disableFutureToDate}
        minDate={minToDate}
        onChange={handleToChange}
        placement={placement}
        value={to}
      />
    </div>
  )
}
