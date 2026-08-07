import { chargeModelLookupTranslation } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

export const NO_ACTIVE_RATE_KEY = 'text_1784921124069fbxxdc71pxe'
export const STANDARD_RATE_KEY = 'text_17849216157616z3booexj0f'
export const PACKAGE_RATE_KEY = 'text_1784921615761eq7kx07jutf'
export const PERCENTAGE_RATE_KEY = 'text_1784921615761os186nuphdr'
export const TIERED_RATE_KEY = 'text_17849216157617n6drir66zm'
export const FROM_TO_RATE_KEY = 'text_17863750835491khy0ht8740'
export const DYNAMIC_RATE_KEY = 'text_1786375083549cfjzje75ere'

export type ActiveRateInput = {
  rateModel: RateCardRateModelEnum
  rateProperties: unknown
  minAmountCents?: unknown
}

type FormatActiveRateArgs = {
  translate: TranslateFunc
  currency?: CurrencyEnum | null
  appliedPricingUnitCode?: string | null
}

// The active-rate cell renders two stacked labels (see the Figma rate-card list):
// `primary` = the human-readable rate value (e.g. "$10.00 per unit", "From $10.00 to
// $100.00"), `secondary` = the rate-model name (with a tier count for tiered models,
// e.g. "Graduated (5 tiers)"). The empty state ("No active rate") has no secondary.
export type FormattedActiveRate = {
  primary: string
  secondary?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getNumericProperty = (properties: unknown, key: string): number | undefined => {
  if (!isRecord(properties)) return undefined

  const value = properties[key]

  if (typeof value === 'number') return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    return Number.isNaN(parsed) ? undefined : parsed
  }

  return undefined
}

const getArrayProperty = (properties: unknown, key: string): unknown[] => {
  if (!isRecord(properties)) return []

  const value = properties[key]

  return Array.isArray(value) ? value : []
}

const formatAmount = (
  amount: number,
  {
    currency,
    appliedPricingUnitCode,
  }: Pick<FormatActiveRateArgs, 'currency' | 'appliedPricingUnitCode'>,
): string =>
  intlFormatNumber(amount, {
    currency: currency ?? undefined,
    pricingUnitShortName: appliedPricingUnitCode ?? undefined,
  })

// Tiered models (graduated / volume) show the per-unit amount of the first tier
// through the last, e.g. "From $10.00 to $100.00" — the range order is kept as-is
// (volume typically descends, matching the design).
const formatAmountRange = (
  ranges: unknown[],
  key: string,
  amountArgs: Pick<FormatActiveRateArgs, 'currency' | 'appliedPricingUnitCode'>,
  translate: TranslateFunc,
): string => {
  const min = getNumericProperty(ranges[0], key) ?? 0
  const max = getNumericProperty(ranges[ranges.length - 1], key) ?? 0

  return translate(FROM_TO_RATE_KEY, {
    min: formatAmount(min, amountArgs),
    max: formatAmount(max, amountArgs),
  })
}

export const formatActiveRate = (
  activeRate: ActiveRateInput | null | undefined,
  { translate, currency, appliedPricingUnitCode }: FormatActiveRateArgs,
): FormattedActiveRate => {
  if (!activeRate) return { primary: translate(NO_ACTIVE_RATE_KEY) }

  const { rateModel, rateProperties } = activeRate
  const modelLabel = translate(chargeModelLookupTranslation[rateModel])
  const amountArgs = { currency, appliedPricingUnitCode }

  switch (rateModel) {
    case RateCardRateModelEnum.Standard: {
      const amount = getNumericProperty(rateProperties, 'amount') ?? 0

      return {
        primary: translate(STANDARD_RATE_KEY, { amount: formatAmount(amount, amountArgs) }),
        secondary: modelLabel,
      }
    }

    case RateCardRateModelEnum.Package: {
      const amount = getNumericProperty(rateProperties, 'amount') ?? 0
      const packageSize = getNumericProperty(rateProperties, 'packageSize') ?? 0

      return {
        primary: translate(PACKAGE_RATE_KEY, {
          amount: formatAmount(amount, amountArgs),
          count: packageSize,
        }),
        secondary: modelLabel,
      }
    }

    case RateCardRateModelEnum.Percentage: {
      const rate = getNumericProperty(rateProperties, 'rate') ?? 0

      return { primary: translate(PERCENTAGE_RATE_KEY, { rate }), secondary: modelLabel }
    }

    case RateCardRateModelEnum.Graduated: {
      const ranges = getArrayProperty(rateProperties, 'graduatedRanges')

      return {
        primary: formatAmountRange(ranges, 'perUnitAmount', amountArgs, translate),
        secondary: translate(TIERED_RATE_KEY, { label: modelLabel, count: ranges.length }),
      }
    }

    case RateCardRateModelEnum.Volume: {
      const ranges = getArrayProperty(rateProperties, 'volumeRanges')

      return {
        primary: formatAmountRange(ranges, 'perUnitAmount', amountArgs, translate),
        secondary: translate(TIERED_RATE_KEY, { label: modelLabel, count: ranges.length }),
      }
    }

    case RateCardRateModelEnum.GraduatedPercentage: {
      const ranges = getArrayProperty(rateProperties, 'graduatedPercentageRanges')
      const min = getNumericProperty(ranges[0], 'rate') ?? 0
      const max = getNumericProperty(ranges[ranges.length - 1], 'rate') ?? 0

      return {
        primary: translate(FROM_TO_RATE_KEY, {
          min: translate(PERCENTAGE_RATE_KEY, { rate: min }),
          max: translate(PERCENTAGE_RATE_KEY, { rate: max }),
        }),
        secondary: translate(TIERED_RATE_KEY, { label: modelLabel, count: ranges.length }),
      }
    }

    case RateCardRateModelEnum.Dynamic:
      return { primary: translate(DYNAMIC_RATE_KEY), secondary: modelLabel }

    // Custom (and any future model) has no value copy in the design: show the model
    // name alone as a single label.
    case RateCardRateModelEnum.Custom:
    default:
      return { primary: modelLabel }
  }
}
