import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNoteItemInput,
  CreditNoteTableItemFragment,
  CurrencyEnum,
  Invoice,
  InvoiceForCreditNoteFormCalculationFragment,
  InvoicePaymentStatusTypeEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'

import { CreditNoteForm, CreditTypeEnum, FeesPerInvoice, FromFee } from './types'

// ----------------------------------------
// PayBack Fields Helper
// ----------------------------------------

export interface PayBackFieldInfo {
  path: string
  value: number
  show: boolean
}

export interface PayBackFields {
  credit: PayBackFieldInfo
  refund: PayBackFieldInfo
  applyToInvoice: PayBackFieldInfo
}

type PayBackItem = { type?: CreditTypeEnum | string; value?: number }

/**
 * Helper to get payBack field info by type.
 * Visibility (`show`) is derived from presence in the array - if an item exists, it should be shown.
 * This avoids passing visibility flags around since the array structure already encodes visibility.
 */
export const getPayBackFields = (payBack: PayBackItem[] | undefined): PayBackFields => {
  const items = payBack || []

  const creditIndex = items.findIndex((p) => p?.type === CreditTypeEnum.credit)
  const refundIndex = items.findIndex((p) => p?.type === CreditTypeEnum.refund)
  const applyToInvoiceIndex = items.findIndex((p) => p?.type === CreditTypeEnum.applyToInvoice)

  return {
    credit: {
      path: creditIndex >= 0 ? `payBack.${creditIndex}.value` : '',
      value: creditIndex >= 0 ? Number(items[creditIndex]?.value || 0) : 0,
      show: creditIndex >= 0,
    },
    refund: {
      path: refundIndex >= 0 ? `payBack.${refundIndex}.value` : '',
      value: refundIndex >= 0 ? Number(items[refundIndex]?.value || 0) : 0,
      show: refundIndex >= 0,
    },
    applyToInvoice: {
      path: applyToInvoiceIndex >= 0 ? `payBack.${applyToInvoiceIndex}.value` : '',
      value: applyToInvoiceIndex >= 0 ? Number(items[applyToInvoiceIndex]?.value || 0) : 0,
      show: applyToInvoiceIndex >= 0,
    },
  }
}

export type CreditNoteFormCalculationCalculationProps = {
  currency: CurrencyEnum
  fees: FeesPerInvoice | undefined
  addonFees: FromFee[] | undefined
  hasError: boolean
}

// This method calculate the credit notes amounts to display
// It does parse once all items. If no coupon applied, values are used for display
// If coupon applied, it will calculate the credit note tax amount based on the coupon value on pro rata of each item
export const creditNoteFormCalculationCalculation = ({
  currency,
  fees,
  addonFees,
  hasError,
}: CreditNoteFormCalculationCalculationProps): {
  feeForEstimate: CreditNoteItemInput[] | undefined
} => {
  if (hasError) return { feeForEstimate: undefined }

  let feeForEstimate: CreditNoteItemInput[] | undefined = undefined

  if (!!Object.keys(fees || {}).length) {
    feeForEstimate = Object.keys(fees || {}).reduce<CreditNoteItemInput[]>((accSub, subKey) => {
      const subChild = ((fees as FeesPerInvoice) || {})[subKey]
      const subValues = subChild?.fees?.reduce<CreditNoteItemInput[]>((accFees, fee) => {
        if (fee.checked) {
          accFees.push({
            feeId: fee.id,
            amountCents: serializeAmount(fee.value, currency),
          })
        }
        return accFees
      }, [])

      return [...accSub, ...(subValues || [])]
    }, [])
  } else if (addonFees) {
    feeForEstimate = addonFees.reduce<CreditNoteItemInput[]>((acc, fee) => {
      if (!!fee.checked) {
        acc.push({
          feeId: fee.id,
          amountCents: serializeAmount(fee.value, currency),
        })
      }

      return acc
    }, [])
  }

  return {
    feeForEstimate,
  }
}

export enum CreditNoteType {
  VOIDED,
  CREDIT_AND_REFUND,
  CREDIT,
  REFUND,
}

export const creditNoteType = ({
  creditAmountCents,
  refundAmountCents,
  voidedAt,
}: Pick<
  CreditNoteTableItemFragment,
  'creditAmountCents' | 'refundAmountCents' | 'voidedAt'
>): CreditNoteType | null => {
  if (voidedAt) {
    return CreditNoteType.VOIDED
  } else if (creditAmountCents > 0 && refundAmountCents > 0) {
    return CreditNoteType.CREDIT_AND_REFUND
  } else if (creditAmountCents > 0) {
    return CreditNoteType.CREDIT
  } else if (refundAmountCents > 0) {
    return CreditNoteType.REFUND
  }

  return null
}

export const CREDIT_NOTE_TYPE_TRANSLATIONS_MAP = {
  [CreditNoteType.VOIDED]: 'text_1727079454388ekfkh3vna8m',
  [CreditNoteType.CREDIT_AND_REFUND]: 'text_1727079454388wxlpkmmkrmj',
  [CreditNoteType.CREDIT]: 'text_1727079454388x9q4uz6ah71',
  [CreditNoteType.REFUND]: 'text_17270794543889mcmuhfq70p',
}

const TRANSLATIONS_MAP_ISSUE_CREDIT_NOTE_DISABLED = {
  terminatedWallet: 'text_172908299496461z9ejmm2j7',
  fullyCovered: 'text_1729082994964zccpjmtotdy',
}

export const isCreditNoteCreationDisabled = (
  invoice?: Partial<
    Pick<Invoice, 'paymentStatus' | 'creditableAmountCents' | 'refundableAmountCents'>
  > | null,
) => {
  const isUnpaid =
    invoice?.paymentStatus === InvoicePaymentStatusTypeEnum.Pending ||
    invoice?.paymentStatus === InvoicePaymentStatusTypeEnum.Failed

  return (
    !isUnpaid && invoice?.creditableAmountCents === '0' && invoice?.refundableAmountCents === '0'
  )
}

export const createCreditNoteForInvoiceButtonProps = ({
  paymentStatus,
  invoiceType,
  associatedActiveWalletPresent,
  creditableAmountCents,
  refundableAmountCents,
}: Partial<Invoice>) => {
  const isAssociatedWithTerminatedWallet =
    invoiceType === InvoiceTypeEnum.Credit && !associatedActiveWalletPresent

  const disabledIssueCreditNoteButton = isCreditNoteCreationDisabled({
    paymentStatus,
    creditableAmountCents,
    refundableAmountCents,
  })

  const getDisabledReason = (): keyof typeof TRANSLATIONS_MAP_ISSUE_CREDIT_NOTE_DISABLED => {
    if (isAssociatedWithTerminatedWallet) return 'terminatedWallet'
    return 'fullyCovered'
  }

  const disabledIssueCreditNoteButtonLabel =
    disabledIssueCreditNoteButton &&
    TRANSLATIONS_MAP_ISSUE_CREDIT_NOTE_DISABLED[getDisabledReason()]

  return {
    disabledIssueCreditNoteButton,
    disabledIssueCreditNoteButtonLabel,
  }
}

export const creditNoteFormHasAtLeastOneFeeChecked = (
  formValues: Partial<CreditNoteForm>,
): boolean => {
  const { fees, addOnFee, creditFee } = formValues
  const groupedFeesValues = Object.values(fees || {})

  if (addOnFee?.length) {
    return addOnFee?.some((aof) => {
      return aof?.checked
    })
  } else if (creditFee?.length) {
    return creditFee?.some((cf) => {
      return cf?.checked
    })
  } else if (groupedFeesValues.length) {
    return groupedFeesValues.some((fee) => {
      return fee?.fees?.some((f) => f?.checked)
    })
  }

  return false
}

// ----------------------------------------
// Initial PayBack Builder
// ----------------------------------------

/**
 * Builds the initial payBack array based on invoice payment status.
 * Determines which allocation options (credit, refund, applyToInvoice) should be available.
 */
export const buildInitialPayBack = (
  invoice?: InvoiceForCreditNoteFormCalculationFragment | null,
): CreditNoteForm['payBack'] => {
  const totalAmountCents = Number(invoice?.totalAmountCents) || 0
  const totalPaidAmountCents = Number(invoice?.totalPaidAmountCents) || 0
  const amountDueCents = totalAmountCents - totalPaidAmountCents
  const hasPaymentDisputeLost = !!invoice?.paymentDisputeLostAt

  // Refund: available when there's been a payment and no dispute lost
  const hasRefund = totalPaidAmountCents > 0 && !hasPaymentDisputeLost
  // Apply to current invoice: available when there's amount due > 0
  const hasApplyToInvoice = amountDueCents > 0

  return [
    { type: CreditTypeEnum.credit, value: undefined },
    ...(hasRefund ? [{ type: CreditTypeEnum.refund, value: undefined }] : []),
    ...(hasApplyToInvoice ? [{ type: CreditTypeEnum.applyToInvoice, value: undefined }] : []),
  ]
}
