import { Typography } from '~/components/designSystem/Typography'
import { useDateRangeFilterValue } from '~/components/Filters/graphql/filtersElements/useDateRangeFilterValue'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { DatePicker } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemIssuingDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemIssuingDate = ({
  value = ',',
  setFilterValue,
}: FiltersItemIssuingDateProps) => {
  const { translate } = useInternationalization()
  const { from, to, maxFromDate, minToDate, handleFromChange, handleToChange } =
    useDateRangeFilterValue({ value, setFilterValue })

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        showErrorInTooltip
        className="flex-1"
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
        showErrorInTooltip
        className="flex-1"
        minDate={minToDate}
        onChange={handleToChange}
        value={to}
      />
    </div>
  )
}
