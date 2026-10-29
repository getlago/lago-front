import { getPaymentMethodLabelKey } from '~/components/PaymentProviderChip'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { CurrencyEnum, PaymentTypeEnum, ProviderTypeEnum, TimezoneEnum } from '~/generated/graphql'

import { DocumentData } from './EmailPreview'

type FormatAmountInput = {
  amountCents: number | string | null | undefined
  currency: CurrencyEnum | null | undefined
}

const formatAmount = ({ amountCents, currency }: FormatAmountInput): string => {
  const cur = currency || CurrencyEnum.Usd

  return intlFormatNumber(deserializeAmount(amountCents || 0, cur), { currency: cur })
}

// --- Invoice ---

type InvoiceInput = {
  totalAmountCents?: number | string | null
  currency?: CurrencyEnum | null
  number?: string | null
  issuingDate?: string | null
}

export const buildInvoiceDocumentData = (
  invoice: InvoiceInput | undefined | null,
): DocumentData => {
  if (!invoice) return {}

  return {
    amount: formatAmount({ amountCents: invoice.totalAmountCents, currency: invoice.currency }),
    invoiceNumber: invoice.number ?? undefined,
    issueDate: invoice.issuingDate ? intlFormatDateTime(invoice.issuingDate).date : undefined,
  }
}

// --- Credit Note ---

type CreditNoteInput = {
  totalAmountCents?: number | string | null
  currency?: CurrencyEnum | null
  number?: string | null
  createdAt?: string | null
  invoice?: { number?: string | null } | null
}

export const buildCreditNoteDocumentData = (
  creditNote: CreditNoteInput | undefined | null,
): DocumentData => {
  if (!creditNote) return {}

  return {
    amount: formatAmount({
      amountCents: creditNote.totalAmountCents,
      currency: creditNote.currency,
    }),
    creditNoteNumber: creditNote.number ?? undefined,
    invoiceNumber: creditNote.invoice?.number ?? undefined,
    issueDate: creditNote.createdAt ? intlFormatDateTime(creditNote.createdAt).date : undefined,
  }
}

// --- Payment Receipt ---

type PaymentInvoice = {
  number: string
  totalAmountCents?: number | string | null
  currency?: CurrencyEnum | null
}

type PaymentInput = {
  amountCents?: number | string | null
  amountCurrency?: CurrencyEnum | null
  createdAt?: string | null
  paymentType?: PaymentTypeEnum | null
  paymentProviderType?: ProviderTypeEnum | null
  paymentReceipt?: { number?: string | null } | null
  invoices: PaymentInvoice[]
  timezone?: TimezoneEnum | null
  translate: (key: string) => string
}

export const buildPaymentDocumentData = ({
  amountCents,
  amountCurrency,
  createdAt,
  paymentType,
  paymentProviderType,
  paymentReceipt,
  invoices,
  timezone,
  translate,
}: PaymentInput): DocumentData => {
  const formattedAmount = formatAmount({ amountCents, currency: amountCurrency })

  const paymentMethodKey = getPaymentMethodLabelKey({
    paymentType,
    paymentProviderType,
    manualVariant: 'manual_long',
  })
  const paymentMethod = paymentMethodKey ? translate(paymentMethodKey) : undefined

  return {
    amount: formattedAmount,
    receiptNumber: paymentReceipt?.number ?? undefined,
    paymentDate: createdAt ? intlFormatDateTime(createdAt, { timezone }).date : undefined,
    paymentMethod,
    amountPaid: formattedAmount,
    invoices: invoices.map((inv) => ({
      number: inv.number,
      amount:
        inv.totalAmountCents !== null
          ? formatAmount({ amountCents: inv.totalAmountCents, currency: inv.currency })
          : '',
    })),
  }
}
