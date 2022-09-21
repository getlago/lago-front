import { PlanFormInput } from '~/components/plans/types'
import { ChargeModelEnum } from '~/generated/graphql'

export const serializePlanInput = (values: PlanFormInput) => {
  const { amountCents, trialPeriod, charges, ...otherValues } = values

  return {
    amountCents: Math.round(Number(amountCents) * 100),
    trialPeriod: Number(trialPeriod || 0),
    charges: charges.map(
      ({
        billableMetric,
        amount: chargeAmount,
        graduatedRanges,
        volumeRanges,
        chargeModel,
        freeUnits,
        freeUnitsPerEvents,
        ...charge
      }) => {
        return {
          chargeModel,
          billableMetricId: billableMetric.id,
          ...([ChargeModelEnum.Package, ChargeModelEnum.Standard].includes(chargeModel)
            ? { amount: String(chargeAmount) }
            : {}),
          ...(chargeModel === ChargeModelEnum.Graduated
            ? {
                graduatedRanges: (graduatedRanges || []).map(
                  ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                    flatAmount: String(flatAmount || '0'),
                    fromValue: fromValue || 0,
                    perUnitAmount: String(perUnitAmount || '0'),
                    ...range,
                  })
                ),
              }
            : {}),
          ...(chargeModel === ChargeModelEnum.Volume
            ? {
                volumeRanges: (volumeRanges || []).map(
                  ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                    flatAmount: String(flatAmount || '0'),
                    fromValue: fromValue || 0,
                    perUnitAmount: String(perUnitAmount || '0'),
                    ...range,
                  })
                ),
              }
            : {}),
          ...(chargeModel === ChargeModelEnum.Package ? { freeUnits: freeUnits || 0 } : {}),
          ...(chargeModel === ChargeModelEnum.Percentage
            ? { freeUnitsPerEvents: Number(freeUnitsPerEvents) || undefined }
            : {}),
          ...charge,
        }
      }
    ),
    ...otherValues,
  }
}
