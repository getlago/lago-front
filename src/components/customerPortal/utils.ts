import { formatDateToTZ } from '~/core/timezone/utils'
import { TimezoneEnum } from '~/generated/graphql'

type PlanRenewalDateProps = {
  currentBillingPeriodEndingAt: string
  applicableTimezone?: TimezoneEnum | null
}

export const planRenewalDate = ({
  currentBillingPeriodEndingAt,
  applicableTimezone,
}: PlanRenewalDateProps) => formatDateToTZ(currentBillingPeriodEndingAt, applicableTimezone)
