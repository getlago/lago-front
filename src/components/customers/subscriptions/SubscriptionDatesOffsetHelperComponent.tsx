import { DateTime } from 'luxon'
import { useCallback } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { intlFormatDateTime, TimeZonesConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

export interface SubscriptionDatesOffsetHelperComponentProps {
  customerTimezone?: TimezoneEnum | null
  subscriptionAt?: string
  endingAt?: string
  className?: string
}

export const SubscriptionDatesOffsetHelperComponent = ({
  customerTimezone,
  subscriptionAt,
  endingAt,
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

    // If date is in the future
    if (DateTime.fromISO(subscriptionAt).diff(DateTime.now().startOf('day'), 'days').days > 0) {
      return translate('text_64ef8cc7c83f5d006131a488', { date, time, offset })
    }

    // If date is in the past
    return translate('text_64ef81071c6da2010dd24b1d', { date, time, offset })
  }, [customerTimezone, organizationTimezone, subscriptionAt, translate])

  // endingAt helper text
  const endingAtHelperText = useCallback((): string => {
    if (!endingAt) return translate('text_64ef81071c6da2010dd24b1e')

    const timezone = customerTimezone || organizationTimezone
    const { date, time } = intlFormatDateTime(endingAt, { timezone })
    const offset = TimeZonesConfig[timezone].offset

    return translate('text_64ef81071c6da2010dd24b1f', { date, time, offset })
  }, [customerTimezone, endingAt, organizationTimezone, translate])

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
