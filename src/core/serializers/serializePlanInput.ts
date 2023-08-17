import { PlanFormInput } from '~/components/plans/types'
import { ChargeModelEnum, Properties } from '~/generated/graphql'

import { serializeAmount } from './serializeAmount'
const serializeScientificNotation = (value: string): string => {
  if (!value) return '0'

  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 15, useGrouping: false })
}

const serializeProperties = (properties: Properties, chargeModel: ChargeModelEnum) => {
  if (!properties) return

  return {
    ...properties,
    ...([ChargeModelEnum.Package, ChargeModelEnum.Standard].includes(chargeModel)
      ? { amount: !!properties?.amount ? String(properties?.amount) : undefined }
      : {}),
    ...(chargeModel === ChargeModelEnum.Graduated
      ? {
          graduatedRanges: properties?.graduatedRanges
            ? (properties?.graduatedRanges || []).map(
                ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                  flatAmount: serializeScientificNotation(flatAmount),
                  fromValue: fromValue || 0,
                  perUnitAmount: serializeScientificNotation(perUnitAmount),
                  ...range,
                })
              )
            : undefined,
        }
      : { graduatedRanges: undefined }),
    ...(chargeModel === ChargeModelEnum.GraduatedPercentage
      ? {
          graduatedPercentageRanges: properties?.graduatedPercentageRanges
            ? (properties?.graduatedPercentageRanges || []).map(
                ({ flatAmount, fromValue, rate, ...range }) => ({
                  flatAmount: serializeScientificNotation(flatAmount),
                  fromValue: fromValue || 0,
                  rate: serializeScientificNotation(rate),
                  ...range,
                })
              )
            : undefined,
        }
      : { graduatedPercentageRanges: undefined }),
    ...(chargeModel === ChargeModelEnum.Volume
      ? {
          volumeRanges: properties?.volumeRanges
            ? (properties?.volumeRanges || []).map(
                ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
                  flatAmount: serializeScientificNotation(flatAmount),

                  fromValue: fromValue || 0,
                  perUnitAmount: serializeScientificNotation(perUnitAmount),
                  ...range,
                })
              )
            : undefined,
        }
      : { volumeRanges: undefined }),
    ...(chargeModel === ChargeModelEnum.Package
      ? { freeUnits: properties?.freeUnits || 0 }
      : { packageSize: undefined, freeUnits: undefined }),
    ...(chargeModel === ChargeModelEnum.Percentage
      ? {
          amount: undefined,
          freeUnitsPerEvents: Number(properties?.freeUnitsPerEvents) || undefined,
          fixedAmount:
            Number(properties?.fixedAmount || 0) > 0 ? String(properties?.fixedAmount) : undefined,
          freeUnitsPerTotalAggregation: !!properties?.freeUnitsPerTotalAggregation
            ? String(properties?.freeUnitsPerTotalAggregation)
            : undefined,
        }
      : {}),
  }
}

export const serializePlanInput = (values: PlanFormInput) => {
  const { amountCents, trialPeriod, charges, taxes: planTaxes, ...otherValues } = values

  return {
    amountCents: Number(serializeAmount(amountCents, values.amountCurrency)),
    trialPeriod: Number(trialPeriod || 0),
    taxCodes: planTaxes?.map(({ code }) => code) || [],
    charges: charges.map(
      ({
        billableMetric,
        chargeModel,
        properties,
        groupProperties,
        minAmountCents,
        taxes: chargeTaxes,
        ...charge
      }) => {
        return {
          chargeModel,
          billableMetricId: billableMetric.id,
          minAmountCents: Number(serializeAmount(minAmountCents, values.amountCurrency) || 0),
          taxCodes: chargeTaxes?.map(({ code }) => code) || [],
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
