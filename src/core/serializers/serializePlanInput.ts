import { PlanFormInput } from '~/components/plans/types'
import { ChargeModelEnum } from '~/generated/graphql'

export const serializePlanInput = (values: PlanFormInput) => {
  const { amountCents, trialPeriod, charges, ...otherValues } = values

  return {
    amountCents: Math.round(Number(amountCents) * 100),
    trialPeriod: Number(trialPeriod || 0),
    charges: charges.map(({ billableMetric, chargeModel, properties, ...charge }) => {
      return {
        chargeModel,
        billableMetricId: billableMetric.id,
        properties: {
          ...properties,
          ...([ChargeModelEnum.Package, ChargeModelEnum.Standard].includes(chargeModel)
            ? { amount: String(properties?.amount) }
            : {}),
          ...(chargeModel === ChargeModelEnum.Graduated
            ? {
                graduatedRanges: (properties?.graduatedRanges || []).map(
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
                volumeRanges: (properties?.volumeRanges || []).map(
                  ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                    flatAmount: String(flatAmount || '0'),
                    fromValue: fromValue || 0,
                    perUnitAmount: String(perUnitAmount || '0'),
                    ...range,
                  })
                ),
              }
            : {}),
          ...(chargeModel === ChargeModelEnum.Package
            ? { freeUnits: properties?.freeUnits || 0 }
            : {}),
          ...(chargeModel === ChargeModelEnum.Percentage
            ? { freeUnitsPerEvents: Number(properties?.freeUnitsPerEvents) || undefined }
            : {}),
        },
        ...charge,
      }
    }),
    ...otherValues,
  }
}
