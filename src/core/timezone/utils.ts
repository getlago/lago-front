import { DateTime } from 'luxon'

import { TimezoneEnum } from '~/generated/graphql'

import { TimeZonesConfig } from './config'

export const getTimezoneConfig = (timezone: TimezoneEnum | null | undefined) => {
  return TimeZonesConfig[timezone || TimezoneEnum.TzUtc]
}

export const formatDateToTZ = (
  date: string,
  timezone: TimezoneEnum | null | undefined,
  format?: string
) => {
  return DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
  }).toFormat(format || 'LLL. dd, yyyy')
}
