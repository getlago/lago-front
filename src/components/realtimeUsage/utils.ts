import { DateTime } from 'luxon'

import { isValidDateRangeValue } from '~/components/Filters/graphql/utils'
import { REALTIME_USAGE_MAX_DAYS } from '~/core/constants/realtimeUsage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

import { TimeRangeEnum } from './constants'

// The API snaps the window to the hour walls of the report's timezone, which differ from the
// browser's under a half-hour offset.
export const windowStartOf = (
  now: DateTime,
  windowInHours: number,
  timezone: TimezoneEnum,
): string =>
  now
    .setZone(getTimezoneConfig(timezone).name)
    .startOf('hour')
    .minus({ hours: windowInHours - 1 })
    .toUTC()
    .toISO() || ''

export const isTimeRangePreset = (value?: string | null): value is TimeRangeEnum =>
  Object.values(TimeRangeEnum).includes(value as TimeRangeEnum)

export const isApplicableRange = (value?: string | null): value is string => {
  if (!value || !isValidDateRangeValue(value)) return false

  const [from, to] = value.split(',')

  return DateTime.fromISO(to).diff(DateTime.fromISO(from), 'days').days <= REALTIME_USAGE_MAX_DAYS
}

export const formatUnits = (value: number): string =>
  intlFormatNumber(value, { style: 'decimal', maximumFractionDigits: 2 })
