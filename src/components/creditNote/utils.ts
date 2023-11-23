import { serializeAmount } from '~/core/serializers/serializeAmount'
import { CreditNoteItemInput, CurrencyEnum } from '~/generated/graphql'

import { FeesPerInvoice, FromFee, GroupedFee } from './types'

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
