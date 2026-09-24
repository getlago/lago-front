import { DateTime } from 'luxon'

import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import { CreateContractInput, UpdateContractInput } from '~/generated/graphql'

import { ContractFormValues } from './constants'

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

// `Contracts::UpdateService` writes a field only when its key is present, so a cleared value
// must be sent as null: Apollo strips undefined and the stored value would survive.
export const buildUpdateContractInput = (
  value: ContractFormValues,
  externalId: string,
): UpdateContractInput => ({
  externalId,
  planCode: value.planCode,
  name: value.name || null,
  billingEntityId: value.billingEntityId || null,
  consolidateInvoice: value.consolidateInvoice,
  paymentMethod: value.paymentMethod ?? undefined,
  purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber),
  startedAt: toUtcDateTime(value.startedAt),
  endedAt: value.endedAt ? toUtcDateTime(value.endedAt) : null,
  billingAnchorDate: toUtcCalendarDay(value.billingAnchorDate),
})
