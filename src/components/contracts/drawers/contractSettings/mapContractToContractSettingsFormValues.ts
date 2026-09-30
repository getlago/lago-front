import { DateTime } from 'luxon'

import { getTimezoneConfig } from '~/core/timezone'
import { ContractForContractDrawerFragment, TimezoneEnum } from '~/generated/graphql'

import { ContractSettingsFormValues } from './constants'

const toUtcMidnight = (calendarDay: string): string =>
  DateTime.fromISO(calendarDay, { zone: getTimezoneConfig(TimezoneEnum.TzUtc).name })
    .startOf('day')
    .toISO() ?? ''

// Mirrors `Contract#effective_billing_anchor_date`, which the backend accepts as an unchanged
// anchor on an active contract.
const getBillingAnchorDay = (contract: ContractForContractDrawerFragment): string => {
  if (contract.billingAnchorDate) return contract.billingAnchorDate
  if (!contract.startedAt) return ''

  return (
    DateTime.fromISO(contract.startedAt)
      .setZone(getTimezoneConfig(contract.customer.applicableTimezone).name)
      .toISODate() ?? ''
  )
}

export const mapContractToContractSettingsFormValues = (
  contract: ContractForContractDrawerFragment,
): ContractSettingsFormValues => {
  const billingAnchorDay = getBillingAnchorDay(contract)

  return {
    externalId: contract.externalId,
    name: contract.name ?? '',
    startedAt: contract.startedAt ?? '',
    endedAt: contract.endedAt ?? undefined,
    initialEndedAt: contract.endedAt ?? undefined,
    billingAnchorDate: billingAnchorDay ? toUtcMidnight(billingAnchorDay) : '',
    purchaseOrderNumber: contract.purchaseOrderNumber ?? undefined,
  }
}
