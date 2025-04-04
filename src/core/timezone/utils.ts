import { captureMessage } from '@sentry/react'
import { DateTime, DateTimeFormatOptions } from 'luxon'

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

/**
 * @deprecated Use `intlFormatDateTime` instead.
 */
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

export enum DateFormat {
  /** Apr 18, 2025 */
  DATE_MED = 'DATE_MED',
  /** 4/18/2025 */
  DATE_SHORT = 'DATE_SHORT',
  /** April 18, 2025 */
  DATE_FULL = 'DATE_FULL',
  /** Friday, April 18, 2025 */
  DATE_HUGE = 'DATE_HUGE',
  /** Fri, Apr 18, 2025 */
  DATE_MED_WITH_WEEKDAY = 'DATE_MED_WITH_WEEKDAY',
  /** Apr 18, 25 */
  DATE_MED_SHORT_YEAR = 'DATE_MED_SHORT_YEAR',
  /** Apr 2024 */
  DATE_MONTH_YEAR = 'DATE_MONTH_YEAR',
}

export enum TimeFormat {
  /** 1:41 PM */
  TIME_SIMPLE = 'TIME_SIMPLE',
  /** 1:41:39 PM */
  TIME_WITH_SECONDS = 'TIME_WITH_SECONDS',
  /** 13:41 */
  TIME_24_SIMPLE = 'TIME_24_SIMPLE',
  /** 13:41:39 */
  TIME_24_WITH_SECONDS = 'TIME_24_WITH_SECONDS',
}

export enum TimezoneFormat {
  /** UTC+5 */
  UTC_OFFSET = 'UTC_OFFSET',
  /** PDT */
  TIMEZONE_SHORT = 'TIMEZONE_SHORT',
  /** Pacific Daylight Time */
  TIMEZONE_LONG = 'TIMEZONE_LONG',
  /** GMT-7 */
  TIMEZONE_OFFSET = 'TIMEZONE_OFFSET',
}

const getDateString = (dateTime: DateTime, format: DateFormat) => {
  if (format === 'DATE_MONTH_YEAR' || format === 'DATE_MED_SHORT_YEAR') {
    return dateTime.toLocaleString({
      month: 'short',
      ...(format === 'DATE_MONTH_YEAR' && {
        year: 'numeric',
      }),
      ...(format === 'DATE_MED_SHORT_YEAR' && {
        day: 'numeric',
        year: '2-digit',
      }),
    })
  }
  return dateTime.toLocaleString(DateTime[format])
}
const getTimezoneString = (dateTime: DateTime, format: TimezoneFormat) => {
  let timeZoneName: DateTimeFormatOptions['timeZoneName'] | undefined
  let timezoneString: string | undefined

  switch (format) {
    case 'TIMEZONE_SHORT':
      timeZoneName = 'short'
      break
    case 'TIMEZONE_LONG':
      timeZoneName = 'long'
      break
    case 'TIMEZONE_OFFSET':
      timeZoneName = 'shortOffset'
      break
    default:
      timeZoneName = undefined
      break
  }

  if (timeZoneName) {
    timezoneString =
      dateTime
        .toLocaleParts({
          timeZoneName: timeZoneName,
        })
        .find((part) => part.type === 'timeZoneName')?.value || ''
  } else {
    const timezoneOffset = dateTime.offset / 60

    timezoneString =
      timezoneOffset === 0
        ? 'UTC'
        : `UTC${timezoneOffset > 0 ? `+${timezoneOffset}` : timezoneOffset}`
  }
  return timezoneString
}

export const intlFormatDateTime = (
  date: string,
  options:
    | {
        timezone?: TimezoneEnum | null | undefined
        locale?: LocaleEnum
        formatDate?: DateFormat
        formatTime?: TimeFormat
        formatTimezone?: TimezoneFormat
      }
    | undefined = {},
): {
  date: string
  time: string
  timezone: string
} => {
  const timezone = options?.timezone || TimezoneEnum.TzUtc
  const locale = options?.locale || LocaleEnum.en

  const localeDateTime = DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
    locale: locale,
  })

  return {
    date: getDateString(localeDateTime, options.formatDate || DateFormat.DATE_MED),
    time: localeDateTime.toLocaleString(DateTime[options?.formatTime || TimeFormat.TIME_SIMPLE]),
    timezone: getTimezoneString(
      localeDateTime,
      options?.formatTimezone || TimezoneFormat.UTC_OFFSET,
    ),
  }
}
