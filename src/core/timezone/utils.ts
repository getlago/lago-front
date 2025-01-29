import { captureMessage } from '@sentry/react'
import { DateTime } from 'luxon'

import { envGlobalVar } from '~/core/apolloClient'
import { TimeZonesConfig } from '~/core/timezone/config'
import { LocaleEnum } from '~/core/translations'
import { TimezoneEnum } from '~/generated/graphql'

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

export const intlFormatDateTime = (
  date: string,
  {
    timezone = TimezoneEnum.TzUtc,
    locale = LocaleEnum.en,
  }: {
    timezone?: TimezoneEnum | null | undefined
    locale?: LocaleEnum
  },
) => {
  const localeDateTime = DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
    locale: locale,
  })

  const localeDate = localeDateTime.toLocaleString(DateTime.DATE_MED)

  const localeTime = localeDateTime
    .toLocaleParts({
      hour: '2-digit',
      minute: '2-digit',
      hour12: LocaleEnum.en === locale,
      timeZoneName: 'short',
    })
    .map((part) => part.value)
    .join('')

  return { date: localeDate, time: localeTime }
}
