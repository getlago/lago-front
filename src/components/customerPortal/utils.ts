import { DateTime } from 'luxon'

import { getTimezoneConfig } from '~/core/timezone/utils'
import { TimezoneEnum } from '~/generated/graphql'

type PlanRenewalDateProps = {
  currentBillingPeriodEndingAt: string
  applicableTimezone?: TimezoneEnum | null
}

const formatAndAddDay = (
  date: string,
  timezone: TimezoneEnum | null | undefined,
  format?: string,
) => {
  return DateTime.fromISO(date, {
    zone: getTimezoneConfig(timezone).name,
  })
    .plus({ days: 1 })
    .toFormat(format || 'LLL. dd, yyyy')
}

export const planRenewalDate = ({
  currentBillingPeriodEndingAt,
  applicableTimezone,
}: PlanRenewalDateProps) => formatAndAddDay(currentBillingPeriodEndingAt, applicableTimezone)
