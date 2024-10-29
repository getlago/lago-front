import { captureMessage } from '@sentry/react'
import { DateTime } from 'luxon'

import { LocaleEnum } from '~/core/translations'
import { TimezoneEnum } from '~/generated/graphql'

import { TimeZonesConfig } from './config'

import { envGlobalVar } from '../apolloClient'

const { sentryDsn } = envGlobalVar()

export const getTimezoneConfig = (timezone: TimezoneEnum | null | undefined) => {
  if (!timezone) return TimeZonesConfig[TimezoneEnum.TzUtc]

  const doesTimezoneConfigExist = Object.keys(TimeZonesConfig).includes(timezone)

  if (!doesTimezoneConfigExist) {
    // If given timezone is not present in config, we should default to UTC config.
    // However, it's pretty critical as UI and date calculation will be wrong.
    // Calling sentry to make sure we notice and add missing timezone to the TimeZonesConfig enum then.
    if (!!sentryDsn) {
      captureMessage(`Timezone ${timezone} is missing in TimeZonesConfig`)
    }

    return TimeZonesConfig[TimezoneEnum.TzUtc]
  }

  return TimeZonesConfig[timezone as TimezoneEnum]
}

export const formatDateToTZ = (
  date: string,
  timezone: TimezoneEnum | null | undefined,
  format?: string,
) => {
  return DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
  }).toFormat(format || 'LLL. dd, yyyy')
}

export const isSameDay = (a: DateTime, b: DateTime): boolean => {
  return a.hasSame(b, 'day') && a.hasSame(b, 'month') && a.hasSame(b, 'year')
}

export const intlFormatDateToDateMed = (
  date: string,
  timezone: TimezoneEnum | null | undefined,
  locale: LocaleEnum,
) => {
  return DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
    locale: locale,
  }).toLocaleString(DateTime.DATE_MED)
}
