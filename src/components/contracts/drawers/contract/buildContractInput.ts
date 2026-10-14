import { DateTime } from 'luxon'

import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import { CreateContractInput } from '~/generated/graphql'

import { ContractFormValues } from './constants'

// The pickers publish UTC already; this is the same belt-and-braces conversion the
// subscription form applies on submit.
export const toUtcDateTime = (value: string): string | undefined =>
  DateTime.fromISO(value).toUTC().toISO() ?? undefined

// `billingAnchorDate` is an ISO8601Date: a bare calendar day.
export const toUtcCalendarDay = (value: string): string | undefined =>
  DateTime.fromISO(value).toUTC().toISODate() ?? undefined

export const buildCreateContractInput = (value: ContractFormValues): CreateContractInput => ({
  externalCustomerId: value.externalCustomerId,
  externalId: value.externalId || undefined,
  planCode: value.planCode,
  name: value.name || undefined,
  billingEntityId: value.billingEntityId || undefined,
  consolidateInvoice: value.consolidateInvoice,
  invoiceCustomSection: toInvoiceCustomSectionReference(value.invoiceCustomSection),
  paymentMethod: value.paymentMethod,
  purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber) ?? undefined,
  startedAt: toUtcDateTime(value.startedAt),
  endedAt: value.endedAt ? toUtcDateTime(value.endedAt) : undefined,
  billingAnchorDate: value.billingAnchorDate
    ? toUtcCalendarDay(value.billingAnchorDate)
    : undefined,
})
