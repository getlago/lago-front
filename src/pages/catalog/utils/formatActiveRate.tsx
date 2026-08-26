import { gql } from '@apollo/client'

import { chargeModelLookupTranslation } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CurrencyEnum,
  PropertiesForActiveRateFragment,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

gql`
  fragment PropertiesForActiveRate on Properties {
    amount
    rate
    packageSize
    graduatedRanges {
      perUnitAmount
    }
    volumeRanges {
      perUnitAmount
    }
    graduatedPercentageRanges {
      rate
    }
  }
`

export const NO_ACTIVE_RATE_KEY = 'text_1784921124069fbxxdc71pxe'
export const STANDARD_RATE_KEY = 'text_17849216157616z3booexj0f'
export const PACKAGE_RATE_KEY = 'text_1784921615761eq7kx07jutf'
export const PERCENTAGE_RATE_KEY = 'text_1784921615761os186nuphdr'
export const TIERED_RATE_KEY = 'text_17849216157617n6drir66zm'
export const FROM_TO_RATE_KEY = 'text_17863750835491khy0ht8740'
export const DYNAMIC_RATE_KEY = 'text_1786375083549cfjzje75ere'

export type ActiveRateInput = {
  rateModel: RateCardRateModelEnum
  rateProperties: PropertiesForActiveRateFragment
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

const toNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return 0

  const parsed = Number(value)

  return Number.isNaN(parsed) ? 0 : parsed
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
  ranges: Array<{ perUnitAmount: string }>,
  amountArgs: Pick<FormatActiveRateArgs, 'currency' | 'appliedPricingUnitCode'>,
  translate: TranslateFunc,
): string => {
  const min = toNumber(ranges[0]?.perUnitAmount)
  const max = toNumber(ranges[ranges.length - 1]?.perUnitAmount)

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
      const amount = toNumber(rateProperties.amount)

      return {
        primary: translate(STANDARD_RATE_KEY, { amount: formatAmount(amount, amountArgs) }),
        secondary: modelLabel,
      }
    }

    case RateCardRateModelEnum.Package: {
      const amount = toNumber(rateProperties.amount)
      const packageSize = toNumber(rateProperties.packageSize)

      return {
        primary: translate(PACKAGE_RATE_KEY, {
          amount: formatAmount(amount, amountArgs),
          count: packageSize,
        }),
        secondary: modelLabel,
      }
    }

    case RateCardRateModelEnum.Percentage: {
      const rate = toNumber(rateProperties.rate)

      return { primary: translate(PERCENTAGE_RATE_KEY, { rate }), secondary: modelLabel }
    }

    case RateCardRateModelEnum.Graduated: {
      const ranges = rateProperties.graduatedRanges ?? []

      return {
        primary: formatAmountRange(ranges, amountArgs, translate),
        secondary: translate(TIERED_RATE_KEY, { label: modelLabel, count: ranges.length }),
      }
    }

    case RateCardRateModelEnum.Volume: {
      const ranges = rateProperties.volumeRanges ?? []

      return {
        primary: formatAmountRange(ranges, amountArgs, translate),
        secondary: translate(TIERED_RATE_KEY, { label: modelLabel, count: ranges.length }),
      }
    }

    case RateCardRateModelEnum.GraduatedPercentage: {
      const ranges = rateProperties.graduatedPercentageRanges ?? []
      const min = toNumber(ranges[0]?.rate)
      const max = toNumber(ranges[ranges.length - 1]?.rate)

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
