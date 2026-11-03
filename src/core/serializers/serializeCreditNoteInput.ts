import {
  CreditNoteForm,
  CreditTypeEnum,
  FeesPerInvoice,
  FromFee,
} from '~/components/creditNote/types'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreateCreditNoteInput,
  CreditNoteItemInput,
  CreditNoteReasonEnum,
  CurrencyEnum,
} from '~/generated/graphql'

export const serializeCheckedCreditNoteFees = (
  fees: FromFee[],
  currency: CurrencyEnum,
): CreditNoteItemInput[] =>
  fees
    .filter((fee) => fee.checked)
    .map((fee) => ({ feeId: fee.id, amountCents: serializeAmount(fee.value, currency) }))

export const serializeCreditNoteInput: (
  invoiceId: string,
  formValues: CreditNoteForm,
  currency: CurrencyEnum,
) => CreateCreditNoteInput = (invoiceId, formValues, currency) => {
  const {
    reason,
    description,
    payBack,
    fees = [],
    addOnFee,
    productFee,
    creditFee,
    metadata,
  } = formValues

  return {
    invoiceId: invoiceId as string,
    reason: reason as CreditNoteReasonEnum,
    description: description,
    creditAmountCents: !payBack
      ? 0
      : serializeAmount(
          payBack.find((p) => p.type === CreditTypeEnum.credit)?.value || 0,
          currency,
        ),
    refundAmountCents: !payBack
      ? 0
      : serializeAmount(
          payBack.find((p) => p.type === CreditTypeEnum.refund)?.value || 0,
          currency,
        ) || 0,
    offsetAmountCents: !payBack
      ? 0
      : serializeAmount(
          payBack.find((p) => p.type === CreditTypeEnum.offset)?.value || 0,
          currency,
        ) || 0,
    items: serializeCheckedCreditNoteFees(
      [
        ...(addOnFee || []),
        ...(productFee || []),
        ...(creditFee || []),
        ...Object.values(fees as FeesPerInvoice).flatMap(
          (subscription) => subscription?.fees || [],
        ),
      ].filter((fee) => Number(fee.value) > 0),
      currency,
    ),
    metadata,
  }
}
