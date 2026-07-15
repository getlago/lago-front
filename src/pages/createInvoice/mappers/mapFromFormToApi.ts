import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { InvoiceFormInput } from '~/components/invoices/types'
import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/utils'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { CreateInvoiceInput, CurrencyEnum } from '~/generated/graphql'

/**
 * Form → createInvoice mutation input, 1:1 parity port of the old onSubmit
 * serialization. `prefillInvoiceId` is the regeneration PREVIEW's id — the
 * route param only gates the void mutation and never reaches the input.
 */
export const mapFormToCreateInput = (
  formValues: InvoiceFormInput,
  {
    hasTaxProvider,
    prefillInvoiceId,
  }: {
    hasTaxProvider: boolean
    prefillInvoiceId?: string
  },
): CreateInvoiceInput => {
  const { fees, paymentMethod, invoiceCustomSection, purchaseOrderNumber, ...values } = formValues
  const currency = formValues.currency || CurrencyEnum.Usd

  return {
    ...values,
    purchaseOrderNumber: normalizePurchaseOrderNumber(purchaseOrderNumber),
    ...(prefillInvoiceId ? { voidedInvoiceId: prefillInvoiceId } : {}),
    paymentMethod,
    invoiceCustomSection: toInvoiceCustomSectionReference(invoiceCustomSection),
    fees: fees.map(({ unitAmountCents, taxes: addonTaxes, ...fee }) => {
      return {
        ...fee,
        unitAmountCents: Number(serializeAmount(unitAmountCents, currency) || 0),
        taxCodes: hasTaxProvider ? [] : addonTaxes?.map(({ code }) => code) || [],
      }
    }),
  }
}
