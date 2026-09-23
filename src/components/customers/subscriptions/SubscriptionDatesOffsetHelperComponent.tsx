import { DateTime } from 'luxon'
import { useCallback } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { intlFormatDateTime, TimeZonesConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

/** The four sentences the caption is built from. Only the billing object's noun
 *  changes between surfaces ("subscription", "contract"); the date maths is the same. */
export interface DatesOffsetHelperTranslationKeys {
  /** "The … will start on {{date}} at {{time}} UTC {{offset}} for your customer." */
  willStart: string
  /** "The … started on {{date}} at {{time}} UTC {{offset}} for your customer." */
  started: string
  /** "It won't end until you manually terminate it." */
  noEnd: string
  /** "It will end on {{date}} at {{time}} UTC {{offset}}." */
  willEnd: string
}

export const SUBSCRIPTION_DATES_OFFSET_KEYS: DatesOffsetHelperTranslationKeys = {
  willStart: 'text_64ef8cc7c83f5d006131a488',
  started: 'text_64ef81071c6da2010dd24b1d',
  noEnd: 'text_64ef81071c6da2010dd24b1e',
  willEnd: 'text_64ef81071c6da2010dd24b1f',
}

export interface SubscriptionDatesOffsetHelperComponentProps {
  customerTimezone?: TimezoneEnum | null
  subscriptionAt?: string
  endingAt?: string
  className?: string
  /** Defaults to the subscription wording. */
  translationKeys?: DatesOffsetHelperTranslationKeys
}

export const SubscriptionDatesOffsetHelperComponent = ({
  customerTimezone,
  subscriptionAt,
  endingAt,
  translationKeys = SUBSCRIPTION_DATES_OFFSET_KEYS,
  ...props
}: SubscriptionDatesOffsetHelperComponentProps) => {
  const { translate } = useInternationalization()
  const { timezone: organizationTimezone } = useOrganizationInfos()

  // subscriptionAt helper text
  const subscriptionAtHelperText = useCallback((): string | undefined => {
    if (!subscriptionAt) return undefined

    const timezone = customerTimezone || organizationTimezone
    const { date, time } = intlFormatDateTime(subscriptionAt, { timezone })
    const offset = TimeZonesConfig[timezone].offset

    // `subscriptionAt` is a UTC calendar day, as the picker that writes it publishes it, so
    // today is read in UTC too rather than in the ambient zone.
    if (
      DateTime.fromISO(subscriptionAt, { zone: 'utc' }).diff(DateTime.utc().startOf('day'), 'days')
        .days > 0
    ) {
      return translate(translationKeys.willStart, { date, time, offset })
    }

    // If date is in the past
    return translate(translationKeys.started, { date, time, offset })
  }, [customerTimezone, organizationTimezone, subscriptionAt, translate, translationKeys])

  // endingAt helper text
  const endingAtHelperText = useCallback((): string => {
    if (!endingAt) return translate(translationKeys.noEnd)

    const timezone = customerTimezone || organizationTimezone
    const { date, time } = intlFormatDateTime(endingAt, { timezone })
    const offset = TimeZonesConfig[timezone].offset

    return translate(translationKeys.willEnd, { date, time, offset })
  }, [customerTimezone, endingAt, organizationTimezone, translate, translationKeys])

  // If no offset or no date, don't return any text
  if (!subscriptionAt) return null

  return (
    <Typography
      variant="caption"
      color="grey600"
      data-test="subscription-dates-offset-helper-component"
      {...props}
    >
      {/* Spaces here are important */}
      {`${!!subscriptionAt ? `${subscriptionAtHelperText()} ` : ''}${endingAtHelperText()}`}
    </Typography>
  )
}
