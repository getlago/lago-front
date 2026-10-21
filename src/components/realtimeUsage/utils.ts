import { DateTime } from 'luxon'

import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

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
