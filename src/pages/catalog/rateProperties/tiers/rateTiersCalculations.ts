import Decimal from 'decimal.js'

import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'
import { RatePercentageTierInput, RateTierInput } from '~/generated/graphql'

import { getTierLowerBound, parseDecimal } from './rateTiers'

export type GraduatedRateTiersLine = {
  units: string
  perUnit: number
  flatFee: number
  total: number
}

type GraduatedRateTiersExample = {
  totalUnits: string
  total: number
  lines: GraduatedRateTiersLine[]
}

type VolumeRateTiersExample = {
  units: string
  perUnit: number
  flatFee: number
  total: number
}

export type GraduatedPercentageRateTiersLine = {
  units: string
  rate: number
  flatAmount: number
}

const toAmount = (value: string | number | null | undefined): Decimal =>
  parseDecimal(value) ?? new Decimal(0)

const getExampleUnits = (tiers: Array<{ toValue?: string | null }>): Decimal =>
  tiers.length > 1
    ? getTierLowerBound(tiers, tiers.length - 1).plus(1)
    : new Decimal(ONE_TIER_EXAMPLE_UNITS)

const getGraduatedTierUnits = (tiers: RateTierInput[], index: number): Decimal => {
  if (tiers.length === 1) return new Decimal(ONE_TIER_EXAMPLE_UNITS)
  if (index === tiers.length - 1) return new Decimal(1)

  return toAmount(tiers[index].toValue).minus(getTierLowerBound(tiers, index))
}

export const getGraduatedRateTiersExample = (tiers: RateTierInput[]): GraduatedRateTiersExample => {
  const lines = tiers.map((tier, index) => {
    const units = getGraduatedTierUnits(tiers, index)
    const perUnit = toAmount(tier.perUnitAmount)
    const flatFee = toAmount(tier.flatAmount)

    return { units, perUnit, flatFee, total: units.mul(perUnit).plus(flatFee) }
  })

  return {
    totalUnits: getExampleUnits(tiers).toFixed(),
    total: lines.reduce((sum, line) => sum.plus(line.total), new Decimal(0)).toNumber(),
    lines: lines.map(({ units, perUnit, flatFee, total }) => ({
      units: units.toFixed(),
      perUnit: perUnit.toNumber(),
      flatFee: flatFee.toNumber(),
      total: total.toNumber(),
    })),
  }
}

export const getVolumeRateTiersExample = (tiers: RateTierInput[]): VolumeRateTiersExample => {
  const lastTier = tiers[tiers.length - 1]
  const units = getExampleUnits(tiers)
  const perUnit = toAmount(lastTier?.perUnitAmount)
  const flatFee = toAmount(lastTier?.flatAmount)

  return {
    units: units.toFixed(),
    perUnit: perUnit.toNumber(),
    flatFee: flatFee.toNumber(),
    total: units.mul(perUnit).plus(flatFee).toNumber(),
  }
}

export const getGraduatedPercentageRateTiersLines = (
  tiers: RatePercentageTierInput[],
): GraduatedPercentageRateTiersLine[] =>
  tiers.map((tier, index) => ({
    units: (index === 0 ? toAmount(tier.toValue) : getTierLowerBound(tiers, index)).toFixed(),
    rate: toAmount(tier.rate).toNumber(),
    flatAmount: toAmount(tier.flatAmount).toNumber(),
  }))
