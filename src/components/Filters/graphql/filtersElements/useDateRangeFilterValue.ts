import { DateTime } from 'luxon'

import { FiltersFormValues } from '~/components/Filters/presentation/types'

type UseDateRangeFilterValueProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

type UseDateRangeFilterValueReturn = {
  from: string
  to: string
  /** Upper bound of the "from" picker calendar: the currently selected "to" date */
  maxFromDate: DateTime | undefined
  /** Lower bound of the "to" picker calendar: the currently selected "from" date */
  minToDate: DateTime | undefined
  handleFromChange: (dateFrom?: string | null) => void
  handleToChange: (dateTo?: string | null) => void
}

const parseBound = (isoDate?: string | null): DateTime | undefined => {
  if (!isoDate) return undefined

  const parsed = DateTime.fromISO(isoDate)

  return parsed.isValid ? parsed : undefined
}

/**
 * Shared state handling for the `from,to` date range filters.
 *
 * Keeps the range ordered: picking a "from" after the current "to" (or a "to" before the
 * current "from") clamps the opposite bound to the same day instead of persisting an
 * inverted range the API would silently answer with no results.
 */
export const useDateRangeFilterValue = ({
  value = ',',
  setFilterValue,
}: UseDateRangeFilterValueProps): UseDateRangeFilterValueReturn => {
  const [from, to] = value.split(',')

  const fromDate = parseBound(from)
  const toDate = parseBound(to)

  const handleFromChange = (dateFrom?: string | null): void => {
    const newFrom = parseBound(dateFrom)?.startOf('day')

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
    const newTo = parseBound(dateTo)?.endOf('day')

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

  return {
    from,
    to,
    maxFromDate: toDate,
    minToDate: fromDate,
    handleFromChange,
    handleToChange,
  }
}
