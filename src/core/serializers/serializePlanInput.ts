import {
  LocalChargeFilterInput,
  LocalPricingUnitType,
  PlanFormInput,
} from '~/components/plans/types'
import { ChargeFilterInput, ChargeModelEnum, Properties } from '~/generated/graphql'

import { serializeAmount } from './serializeAmount'

const serializeScientificNotation = (value: string): string => {
  if (!value) return '0'

  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 15, useGrouping: false })
}

const serializeFilters = (
  filters: LocalChargeFilterInput[] | undefined,
  chargeModel: ChargeModelEnum,
): ChargeFilterInput[] | undefined => {
  if (!filters?.length) return []

  return filters.map(({ values, properties, invoiceDisplayName, ...filterProps }) => {
    const allValuesAsJson = values.map((value) => JSON.parse(value))
    const pricingGroupKeys = allValuesAsJson.reduce(
      (acc, cur) => {
        const [key, value] = Object.entries(cur)[0]

        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(value as string)
        return acc
      },
      {} as Record<string, string[]>,
    )

    return {
      ...filterProps,
      invoiceDisplayName: invoiceDisplayName || null,
      properties: serializeProperties(properties as Properties, chargeModel),
      values: pricingGroupKeys,
    }
  })
}

const serializeProperties = (properties: Properties, chargeModel: ChargeModelEnum) => {
  return {
    ...properties,
    ...(![ChargeModelEnum.Custom].includes(chargeModel)
      ? {
          pricingGroupKeys: !!properties?.pricingGroupKeys?.length
            ? properties?.pricingGroupKeys
            : undefined,
        }
      : { pricingGroupKeys: undefined }),
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
                }),
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
                }),
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
                }),
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
          perTransactionMinAmount: !!properties?.perTransactionMinAmount
            ? String(properties?.perTransactionMinAmount || 0)
            : undefined,
          perTransactionMaxAmount: !!properties?.perTransactionMaxAmount
            ? String(properties?.perTransactionMaxAmount || 0)
            : undefined,
        }
      : { perTransactionMinAmount: undefined, perTransactionMaxAmount: undefined }),
    ...(chargeModel === ChargeModelEnum.Custom
      ? { customProperties: properties?.customProperties }
      : { customProperties: undefined }),
  }
}

export const serializePlanInput = (values: PlanFormInput) => {
  const {
    amountCents,
    entitlements,
    trialPeriod,
    charges,
    taxes: planTaxes,
    minimumCommitment,
    nonRecurringUsageThresholds,
    recurringUsageThreshold,
    cascadeUpdates,
    ...otherValues
  } = values

  return {
    amountCents: Number(serializeAmount(amountCents, values.amountCurrency)),
    trialPeriod: Number(trialPeriod || 0),
    taxCodes: planTaxes?.map(({ code }) => code) || [],
    entitlements: entitlements.map(({ privileges, ...entitlement }) => ({
      ...entitlement,
      // Not needed in the backend, only FE display purpose
      featureId: undefined,
      featureName: undefined,
      privileges: privileges.map(({ ...privilege }) => ({
        ...privilege,
        // Not needed in the backend, only FE display purpose
        privilegeName: undefined,
        valueType: undefined,
        config: undefined,
        id: undefined,
      })),
    })),
    minimumCommitment:
      !!minimumCommitment && !!Object.keys(minimumCommitment).length
        ? {
            ...minimumCommitment,
            amountCents: Number(
              serializeAmount(minimumCommitment.amountCents, values.amountCurrency),
            ),
            taxCodes: minimumCommitment.taxes?.map(({ code }) => code) || [],
            // Reset tax array used for display purpose
            taxes: undefined,
          }
        : {},
    usageThresholds: [
      ...(nonRecurringUsageThresholds ?? []).map((threshold) => ({
        ...threshold,
        thresholdDisplayName: threshold.thresholdDisplayName ?? null,
        amountCents: Number(serializeAmount(threshold.amountCents, values.amountCurrency)),
      })),
      ...(recurringUsageThreshold
        ? [
            {
              ...recurringUsageThreshold,
              thresholdDisplayName: recurringUsageThreshold.thresholdDisplayName ?? null,
              amountCents: Number(
                serializeAmount(recurringUsageThreshold.amountCents, values.amountCurrency),
              ),
            },
          ]
        : []),
    ],
    charges: charges.map(
      ({
        billableMetric,
        chargeModel,
        properties,
        minAmountCents,
        taxes: chargeTaxes,
        filters,
        appliedPricingUnit,
        payInAdvance,
        ...charge
      }) => {
        return {
          chargeModel,
          billableMetricId: billableMetric.id,
          appliedPricingUnit:
            !appliedPricingUnit || appliedPricingUnit?.type === LocalPricingUnitType.Fiat
              ? undefined
              : {
                  code: appliedPricingUnit?.code,
                  conversionRate: Number(appliedPricingUnit?.conversionRate),
                },
          minAmountCents:
            !!minAmountCents && !payInAdvance
              ? Number(serializeAmount(minAmountCents, values.amountCurrency) || 0)
              : undefined,
          payInAdvance: payInAdvance || false,
          taxCodes: chargeTaxes?.map(({ code }) => code) || [],
          filters: serializeFilters(filters, chargeModel),
          properties: properties
            ? {
                ...serializeProperties(properties as Properties, chargeModel),
              }
            : undefined,
          ...charge,
        }
      },
    ),
    ...(typeof cascadeUpdates === 'undefined' ? {} : { cascadeUpdates }),
    ...otherValues,
  }
}
