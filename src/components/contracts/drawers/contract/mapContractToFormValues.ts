import { DateTime } from 'luxon'

import { getTimezoneConfig } from '~/core/timezone'
import { ContractForContractDrawerFragment, TimezoneEnum } from '~/generated/graphql'

import { ContractDrawerCustomer, ContractFormValues } from './constants'

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

export const mapContractToFormValues = (
  contract: ContractForContractDrawerFragment,
): ContractFormValues => {
  const billingAnchorDay = getBillingAnchorDay(contract)

  return {
    externalCustomerId: contract.customer.externalId,
    externalId: contract.externalId,
    planCode: contract.plan?.code ?? '',
    isPlanRequired: !!contract.plan,
    name: contract.name ?? '',
    billingEntityId: contract.billingEntityId ?? contract.customer.billingEntity?.id,
    consolidateInvoice: contract.consolidateInvoice,
    paymentMethod: {
      paymentMethodId: contract.paymentMethod?.id ?? null,
      paymentMethodType: contract.paymentMethodType,
    },
    purchaseOrderNumber: contract.purchaseOrderNumber ?? undefined,
    startedAt: contract.startedAt ?? '',
    endedAt: contract.endedAt ?? undefined,
    initialEndedAt: contract.endedAt ?? undefined,
    billingAnchorDate: billingAnchorDay ? toUtcMidnight(billingAnchorDay) : '',
  }
}

export const mapContractToDrawerCustomer = (
  contract: ContractForContractDrawerFragment,
): ContractDrawerCustomer => ({
  externalId: contract.customer.externalId,
  displayName: contract.customer.displayName,
  applicableTimezone: contract.customer.applicableTimezone,
  billingEntityId: contract.customer.billingEntity?.id,
})
