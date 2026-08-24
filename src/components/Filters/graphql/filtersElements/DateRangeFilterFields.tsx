import { DateTime } from 'luxon'

import { Typography } from '~/components/designSystem/Typography'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { DatePicker, DatePickerProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type DateRangeFilterFieldsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
  defaultZone?: string
  disableFutureFromDate?: boolean
  disableFutureToDate?: boolean
  placement?: DatePickerProps['placement']
}

/**
 * Bounds are parsed in the pickers' own zone, not the ambient Luxon one. `DatePicker` only
 * switches `Settings.defaultZone` from an effect, so during the first render the ambient zone
 * is still the organization's — which would put a UTC-backed bound on the previous calendar
 * day and cap the calendars one day off.
 */
const parseBound = (isoDate?: string | null, zone?: string): DateTime | undefined => {
  if (!isoDate) return undefined

  const parsed = DateTime.fromISO(isoDate, { zone })

  return parsed.isValid ? parsed : undefined
}

/**
 * The two pickers behind every `from,to` date range filter. Each surface differs only by
 * timezone, future-date availability and popper placement, so the markup and the ordering
 * guard live here once rather than in each `FiltersItem*Date`.
 *
 * Keeps the range ordered: picking a "from" after the current "to" (or a "to" before the
 * current "from") clamps the opposite bound to the same day instead of persisting an
 * inverted range the API would silently answer with no results.
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

  const [from, to] = value.split(',')
  const fromDate = parseBound(from, defaultZone)
  const toDate = parseBound(to, defaultZone)

  const handleFromChange = (dateFrom?: string | null): void => {
    const newFrom = parseBound(dateFrom, defaultZone)?.startOf('day')

    if (!newFrom) {
      setFilterValue(`,${to}`)
      return
    }

    // If fromDate > toDate, adjust toDate to end of fromDate day
    if (toDate && newFrom > toDate) {
      setFilterValue(`${newFrom.toISO()},${newFrom.endOf('day').toISO()}`)
      return
    }

    setFilterValue(`${newFrom.toISO()},${to}`)
  }

  const handleToChange = (dateTo?: string | null): void => {
    const newTo = parseBound(dateTo, defaultZone)?.endOf('day')

    if (!newTo) {
      setFilterValue(`${from},`)
      return
    }

    // If toDate < fromDate, adjust fromDate to start of toDate day
    if (fromDate && newTo < fromDate) {
      setFilterValue(`${newTo.startOf('day').toISO()},${newTo.toISO()}`)
      return
    }

    setFilterValue(`${from},${newTo.toISO()}`)
  }

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        defaultZone={defaultZone}
        disableFuture={disableFutureFromDate}
        maxDate={toDate}
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
        minDate={fromDate}
        onChange={handleToChange}
        placement={placement}
        value={to}
      />
    </div>
  )
}
