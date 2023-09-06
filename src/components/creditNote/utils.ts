import { FeesPerInvoice, FromFee, GroupedFee } from './types'

export const updateOrCreateTaxMap = (
  currentTaxesMap: TaxMapType,
  feeAmount?: number,
  feeAppliedTaxes?: { id: string; tax: { id: string; name: string; rate: number } }[]
) => {
  if (!feeAppliedTaxes?.length) return currentTaxesMap
  if (!currentTaxesMap?.size) currentTaxesMap = new Map()

  feeAppliedTaxes.forEach((appliedTax) => {
    const { id, name, rate } = appliedTax.tax
    const amount = ((feeAmount || 0) * rate) / 100

    const previousTax = currentTaxesMap?.get(id)

    if (previousTax) {
      previousTax.amount += amount
      currentTaxesMap?.set(id, previousTax)
    } else {
      currentTaxesMap?.set(id, { amount, label: `${name} (${rate}%)`, taxRate: rate })
    }
  })

  return currentTaxesMap
}

export const mergeTaxMaps = (map1: TaxMapType, map2: TaxMapType): TaxMapType => {
  if (!map1.size) return map2
  if (!map2.size) return map1

  // We assume both map1 and map2 are the same length and contain the same keys
  const mergedMap = new Map()

  map1.forEach((_, key) => {
    const previousTax1 = map1.get(key)
    const previousTax2 = map2.get(key)

    if (previousTax1 && previousTax2) {
      mergedMap.set(key, {
        label: previousTax1.label,
        amount: previousTax1.amount + previousTax2.amount,
        taxRate: previousTax1.taxRate,
      })
    }
  })

  return mergedMap
}

type TaxMapType = Map<
  string, // id of the tax
  {
    label: string
    amount: number
    taxRate: number // Used for sorting purpose
  }
>

export type CreditNoteFormCalculationCalculationProps = {
  addOnFee: FromFee[] | undefined
  couponsAmountCents: string
  fees: FeesPerInvoice | undefined
  feesAmountCents: string
  hasFeeError: boolean
  isLegacyInvoice: boolean
}

// This method calculate the credit notes amounts to display
// It does parse once all items. If no coupon applied, values are used for display
// If coupon applied, it will calculate the credit note tax amount based on the coupon value on pro rata of each item
export const creditNoteFormCalculationCalculation = ({
  addOnFee,
  couponsAmountCents,
  fees,
  feesAmountCents,
  hasFeeError,
  isLegacyInvoice,
}: CreditNoteFormCalculationCalculationProps) => {
  if (hasFeeError) return { totalExcludedTax: undefined, taxes: new Map() }

  const feeTotal = Object.keys(fees || {}).reduce<{
    totalExcludedTax: number
    taxes: TaxMapType
  }>(
    (accSub, subKey) => {
      const subChild = ((fees as FeesPerInvoice) || {})[subKey]
      const subValues = Object.keys(subChild?.fees || {}).reduce<{
        totalExcludedTax: number
        taxes: TaxMapType
      }>(
        (accGroup, groupKey) => {
          const child = subChild?.fees[groupKey] as FromFee

          if (typeof child.checked === 'boolean') {
            const childExcludedTax = Number(child.value as number)

            return !child.checked
              ? accGroup
              : (accGroup = {
                  totalExcludedTax: accGroup.totalExcludedTax + childExcludedTax,
                  taxes: updateOrCreateTaxMap(
                    accGroup.taxes,
                    childExcludedTax,
                    child?.appliedTaxes
                  ),
                })
          }

          const grouped = (child as unknown as GroupedFee)?.grouped
          const groupedValues = Object.keys(grouped || {}).reduce<{
            totalExcludedTax: number
            taxes: TaxMapType
          }>(
            (accFee, feeKey) => {
              const fee = grouped[feeKey]
              const feeExcludedTax = Number(fee.value)

              return !fee.checked
                ? accFee
                : (accFee = {
                    totalExcludedTax: accFee.totalExcludedTax + feeExcludedTax,
                    taxes: updateOrCreateTaxMap(accFee.taxes, feeExcludedTax, fee?.appliedTaxes),
                  })
            },
            { totalExcludedTax: 0, taxes: new Map() }
          )

          return {
            totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
            taxes: mergeTaxMaps(accGroup.taxes, groupedValues.taxes),
          }
        },
        { totalExcludedTax: 0, taxes: new Map() }
      )

      return {
        totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
        taxes: mergeTaxMaps(accSub?.taxes, subValues.taxes),
      }
    },
    { totalExcludedTax: 0, taxes: new Map() }
  )

  const { value: addOnValue, taxes: addOnTaxes } = addOnFee?.reduce(
    (acc, fee) => {
      return {
        value: acc.value + (fee.checked ? Number(fee.value) : 0),
        taxes: updateOrCreateTaxMap(
          acc.taxes,
          fee.checked ? Number(fee.value) : 0,
          fee?.appliedTaxes
        ),
      }
    },
    { value: 0, taxes: new Map() }
  ) || { value: 0, taxes: new Map() }

  let proRatedCouponAmount = 0
  let totalExcludedTax = feeTotal.totalExcludedTax + Number(addOnValue || 0)
  const totalInvoiceFeesCreditableAmountCentsExcludingTax = Number(feesAmountCents || 0)

  // If legacy invoice or no coupon, return "basic" calculation
  if (isLegacyInvoice || Number(couponsAmountCents) === 0) {
    return {
      proRatedCouponAmount,
      totalExcludedTax,
      taxes: mergeTaxMaps(feeTotal.taxes, addOnTaxes),
    }
  }

  const couponsAdjustmentAmountCents = () => {
    return (
      (Number(couponsAmountCents) / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
      feeTotal.totalExcludedTax
    )
  }

  // Parse fees a second time to calculate pro-rated amounts
  const proRatedTotal = () => {
    return Object.keys(fees || {}).reduce<{
      totalExcludedTax: number
      taxes: TaxMapType
    }>(
      (accSub, subKey) => {
        const subChild = ((fees as FeesPerInvoice) || {})[subKey]
        const subValues = Object.keys(subChild?.fees || {}).reduce<{
          totalExcludedTax: number
          taxes: TaxMapType
        }>(
          (accGroup, groupKey) => {
            const child = subChild?.fees[groupKey] as FromFee

            if (typeof child.checked === 'boolean') {
              const childExcludedTax = Number(child.value as number)

              let itemRate = Number(child.value) / feeTotal.totalExcludedTax
              let proratedCouponAmount = couponsAdjustmentAmountCents() * itemRate

              return !child.checked
                ? accGroup
                : (accGroup = {
                    totalExcludedTax: accGroup.totalExcludedTax + childExcludedTax,
                    taxes: updateOrCreateTaxMap(
                      accGroup.taxes,
                      childExcludedTax - proratedCouponAmount,
                      child?.appliedTaxes
                    ),
                  })
            }

            const grouped = (child as unknown as GroupedFee)?.grouped
            const groupedValues = Object.keys(grouped || {}).reduce<{
              totalExcludedTax: number
              taxes: TaxMapType
            }>(
              (accFee, feeKey) => {
                const fee = grouped[feeKey]
                const feeExcludedTax = Number(fee.value)
                let itemRate = Number(fee.value) / feeTotal.totalExcludedTax
                let proratedCouponAmount = couponsAdjustmentAmountCents() * itemRate

                return !fee.checked
                  ? accFee
                  : (accFee = {
                      totalExcludedTax: accFee.totalExcludedTax + feeExcludedTax,
                      taxes: updateOrCreateTaxMap(
                        accFee.taxes,
                        feeExcludedTax - proratedCouponAmount,
                        fee?.appliedTaxes
                      ),
                    })
              },
              { totalExcludedTax: 0, taxes: new Map() }
            )

            return {
              totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
              taxes: mergeTaxMaps(accGroup.taxes, groupedValues.taxes),
            }
          },
          { totalExcludedTax: 0, taxes: new Map() }
        )

        return {
          totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
          taxes: mergeTaxMaps(accSub?.taxes, subValues.taxes),
        }
      },
      { totalExcludedTax: 0, taxes: new Map() }
    )
  }

  // If coupon is applied, we need to pro-rate the coupon amount and the tax amount
  proRatedCouponAmount =
    (Number(couponsAmountCents) / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
    feeTotal.totalExcludedTax

  // And deduct the coupon amount from the total excluding Tax
  totalExcludedTax -= proRatedCouponAmount

  const { taxes } = proRatedTotal()

  return {
    proRatedCouponAmount,
    totalExcludedTax,
    taxes,
  }
}
