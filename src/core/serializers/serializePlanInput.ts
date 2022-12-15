import { PlanFormInput } from '~/components/plans/types'
import { ChargeModelEnum, Properties } from '~/generated/graphql'

const serializeProperties = (properties: Properties, chargeModel: ChargeModelEnum) => {
  if (!properties) return

  return {
    ...properties,
    ...([ChargeModelEnum.Package, ChargeModelEnum.Standard].includes(chargeModel)
      ? { amount: String(properties?.amount) }
      : {}),
    ...(chargeModel === ChargeModelEnum.Graduated
      ? {
          graduatedRanges: properties?.graduatedRanges
            ? (properties?.graduatedRanges || []).map(
                ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                  flatAmount: String(flatAmount || '0'),
                  fromValue: fromValue || 0,
                  perUnitAmount: String(perUnitAmount || '0'),
                  ...range,
                })
              )
            : undefined,
        }
      : { graduatedRanges: undefined }),
    ...(chargeModel === ChargeModelEnum.Volume
      ? {
          volumeRanges: properties?.volumeRanges
            ? (properties?.volumeRanges || []).map(
                ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                  flatAmount: String(flatAmount || '0'),

                  fromValue: fromValue || 0,
                  perUnitAmount: String(perUnitAmount || '0'),
                  ...range,
                })
              )
            : undefined,
        }
      : { volumeRanges: undefined }),
    ...(chargeModel === ChargeModelEnum.Package
      ? { freeUnits: properties?.freeUnits || 0 }
      : { packageSize: undefined }),
    ...(chargeModel === ChargeModelEnum.Percentage
      ? {
          freeUnitsPerEvents: Number(properties?.freeUnitsPerEvents) || undefined,
          fixedAmount: Number(properties?.fixedAmount) || undefined,
          freeUnitsPerTotalAggregation:
            Number(properties?.freeUnitsPerTotalAggregation) || undefined,
        }
      : {}),
  }
}

export const serializePlanInput = (values: PlanFormInput) => {
  const { amountCents, trialPeriod, charges, ...otherValues } = values

  return {
    amountCents: Math.round(Number(amountCents) * 100),
    trialPeriod: Number(trialPeriod || 0),
    charges: charges.map(
      ({ billableMetric, chargeModel, properties, groupProperties, ...charge }) => {
        return {
          chargeModel,
          billableMetricId: billableMetric.id,
          properties: properties
            ? {
                ...serializeProperties(properties as Properties, chargeModel),
              }
            : undefined,
          groupProperties: groupProperties?.length
            ? groupProperties?.map((property) => ({
                groupId: property.groupId,
                values: {
                  ...serializeProperties(property.values, chargeModel),
                },
              }))
            : undefined,
          ...charge,
        }
      }
    ),
    ...otherValues,
  }
}
