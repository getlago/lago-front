import { DateTime } from 'luxon'

import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import {
  ContractForContractDrawerFragment,
  CreateContractInput,
  UpdateContractInput,
} from '~/generated/graphql'

import { ContractFormValues } from './constants'
import { mapContractToFormValues } from './mapContractToFormValues'

// The pickers publish UTC already; this is the same belt-and-braces conversion the
// subscription form applies on submit.
const toUtcDateTime = (value: string): string | undefined =>
  DateTime.fromISO(value).toUTC().toISO() ?? undefined

// `billingAnchorDate` is an ISO8601Date: a bare calendar day.
const toUtcCalendarDay = (value: string): string | undefined =>
  DateTime.fromISO(value).toUTC().toISODate() ?? undefined

export const buildCreateContractInput = (value: ContractFormValues): CreateContractInput => ({
  externalCustomerId: value.externalCustomerId,
  externalId: value.externalId || undefined,
  planCode: value.planCode,
  name: value.name || undefined,
  billingEntityId: value.billingEntityId || undefined,
  consolidateInvoice: value.consolidateInvoice,
  paymentMethod: value.paymentMethod,
  purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber) ?? undefined,
  startedAt: toUtcDateTime(value.startedAt),
  endedAt: value.endedAt ? toUtcDateTime(value.endedAt) : undefined,
  billingAnchorDate: toUtcCalendarDay(value.billingAnchorDate),
})

// `Contracts::UpdateService` writes only present keys: a cleared value goes as null (Apollo strips
// undefined), an untouched inherited one is omitted so a no-op save does not pin it as an override.
export const buildUpdateContractInput = (
  value: ContractFormValues,
  contract: ContractForContractDrawerFragment,
): UpdateContractInput => {
  const seededValues = mapContractToFormValues(contract)
  const keepsInheritedBillingEntity =
    !contract.billingEntityId && value.billingEntityId === seededValues.billingEntityId
  const keepsInheritedBillingAnchor =
    !contract.billingAnchorDate && value.billingAnchorDate === seededValues.billingAnchorDate

  return {
    externalId: contract.externalId,
    planCode: value.planCode || undefined,
    name: value.name || null,
    billingEntityId: keepsInheritedBillingEntity ? undefined : value.billingEntityId || null,
    consolidateInvoice: value.consolidateInvoice,
    paymentMethod: value.paymentMethod ?? undefined,
    purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber),
    startedAt: toUtcDateTime(value.startedAt),
    endedAt: value.endedAt ? toUtcDateTime(value.endedAt) : null,
    billingAnchorDate: keepsInheritedBillingAnchor
      ? undefined
      : toUtcCalendarDay(value.billingAnchorDate),
  }
}
