import { InvoiceFormInput, LocalFeeInput } from '~/components/invoices/types'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { MaybePaymentTerm } from '~/core/utils/paymentTerm'
import {
  CurrencyEnum,
  GetBillingEntityQuery,
  GetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'

/**
 * One-off invoice form default values. Call it INLINE on every render:
 * TanStack re-seeds an untouched form when defaults deep-change, which
 * replaces Formik's `enableReinitialize` as the async sources resolve.
 * `prefillFees` must be the caller's MEMOIZED `invoiceFeesToFeeInput` result —
 * its `DateTime.now()` fallbacks would otherwise re-seed on every render.
 */
export const mapFromApiToForm = ({
  customerId,
  customer,
  billingEntity,
  prefillInvoice,
  prefillFees,
}: {
  customerId: string | undefined
  customer: GetInfosForCreateInvoiceQuery['customer'] | undefined
  billingEntity: GetBillingEntityQuery['billingEntity'] | undefined
  prefillInvoice:
    { purchaseOrderNumber?: string | null; paymentTerm?: MaybePaymentTerm } | null | undefined
  prefillFees: LocalFeeInput[] | undefined
}): InvoiceFormInput => ({
  customerId: customerId || '',
  billingEntityId: customer?.billingEntity?.id || undefined,
  currency: customer?.currency || billingEntity?.defaultCurrency || CurrencyEnum.Usd,
  fees: prefillFees || [],
  paymentMethod: undefined,
  invoiceCustomSection: undefined,
  purchaseOrderNumber: prefillInvoice?.purchaseOrderNumber || undefined,
  // A regenerated invoice keeps the voided invoice's term; it cannot be overridden.
  paymentTerm: paymentTermFormValuesFromTerm(prefillInvoice?.paymentTerm, true),
})

// Static empty defaults — for `withForm` section typing only.
export const emptyInvoiceFormDefaultValues = (): InvoiceFormInput =>
  mapFromApiToForm({
    customerId: undefined,
    customer: undefined,
    billingEntity: undefined,
    prefillInvoice: undefined,
    prefillFees: undefined,
  })
