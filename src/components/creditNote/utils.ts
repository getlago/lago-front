import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNoteItemInput,
  CreditNoteTableItemFragment,
  CurrencyEnum,
  Invoice,
  InvoicePaymentStatusTypeEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'

import { CreditNoteForm, FeesPerInvoice, FromFee, GroupedFee } from './types'

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

  const feeForEstimate = !!Object.keys(fees || {}).length
    ? Object.keys(fees || {}).reduce<CreditNoteItemInput[]>((accSub, subKey) => {
        const subChild = ((fees as FeesPerInvoice) || {})[subKey]
        const subValues = Object.keys(subChild?.fees || {}).reduce<CreditNoteItemInput[]>(
          (accGroup, groupKey) => {
            const child = subChild?.fees[groupKey] as FromFee

            if (typeof child.checked === 'boolean' && !!child.checked) {
              accGroup.push({
                feeId: child.id,
                amountCents: serializeAmount(child.value, currency),
              })

              return accGroup
            }

            const grouped = (child as unknown as GroupedFee)?.grouped
            const groupedValues = Object.keys(grouped || {}).reduce<CreditNoteItemInput[]>(
              (accFee, feeKey) => {
                const fee = grouped[feeKey]

                if (fee.checked) {
                  accFee.push({
                    feeId: fee.id,
                    amountCents: serializeAmount(fee.value, currency),
                  })
                }

                return accFee
              },
              [],
            )

            accGroup = [...accGroup, ...groupedValues]
            return accGroup
          },
          [],
        )

        accSub = [...accSub, ...subValues]

        return accSub
      }, [])
    : !!addonFees
      ? addonFees?.reduce<CreditNoteItemInput[]>((acc, fee) => {
          if (!!fee.checked) {
            acc.push({
              feeId: fee.id,
              amountCents: serializeAmount(fee.value, currency),
            })
          }

          return acc
        }, [])
      : undefined

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
  unpaid: 'text_17290829949642fgof01loxo',
  terminatedWallet: 'text_172908299496461z9ejmm2j7',
  fullyCovered: 'text_1729082994964zccpjmtotdy',
}

export const createCreditNoteForInvoiceButtonProps = ({
  paymentStatus,
  invoiceType,
  associatedActiveWalletPresent,
  creditableAmountCents,
  refundableAmountCents,
}: Partial<Invoice>) => {
  const isUnpaid =
    paymentStatus === InvoicePaymentStatusTypeEnum.Pending ||
    paymentStatus === InvoicePaymentStatusTypeEnum.Failed

  const isAssociatedWithTerminatedWallet =
    invoiceType === InvoiceTypeEnum.Credit && !associatedActiveWalletPresent

  const disabledIssueCreditNoteButton =
    creditableAmountCents === '0' && refundableAmountCents === '0'

  const disabledIssueCreditNoteButtonLabel =
    disabledIssueCreditNoteButton &&
    TRANSLATIONS_MAP_ISSUE_CREDIT_NOTE_DISABLED[
      isUnpaid ? 'unpaid' : isAssociatedWithTerminatedWallet ? 'terminatedWallet' : 'fullyCovered'
    ]

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
      const feesToInspect = Object.values(fee?.fees || {})

      return feesToInspect.some((f) => {
        // Fees of type GroupedFee
        if ('grouped' in f) {
          const feesGroupedValues = Object.values(f?.grouped || {})

          return feesGroupedValues.some((g) => g?.checked)
        }

        // Fees of type FromFee
        return f?.checked
      })
    })
  }

  return false
}
