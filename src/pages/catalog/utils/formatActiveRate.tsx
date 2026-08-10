import { chargeModelLookupTranslation } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

export const NO_ACTIVE_RATE_KEY = 'text_1784921124069fbxxdc71pxe'
export const STANDARD_RATE_KEY = 'text_17849216157616z3booexj0f'
export const PACKAGE_RATE_KEY = 'text_1784921615761eq7kx07jutf'
export const PERCENTAGE_RATE_KEY = 'text_1784921615761os186nuphdr'
export const TIERED_RATE_KEY = 'text_17849216157617n6drir66zm'

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

export const formatActiveRate = (
  activeRate: ActiveRateInput | null | undefined,
  { translate, currency, appliedPricingUnitCode }: FormatActiveRateArgs,
): string => {
  if (!activeRate) return translate(NO_ACTIVE_RATE_KEY)

  const { rateModel, rateProperties } = activeRate
  const label = translate(chargeModelLookupTranslation[rateModel])
  const amountArgs = { currency, appliedPricingUnitCode }

  switch (rateModel) {
    case RateCardRateModelEnum.Standard: {
      const amount = getNumericProperty(rateProperties, 'amount') ?? 0

      return translate(STANDARD_RATE_KEY, { amount: formatAmount(amount, amountArgs) })
    }

    case RateCardRateModelEnum.Package: {
      const amount = getNumericProperty(rateProperties, 'amount') ?? 0
      const packageSize = getNumericProperty(rateProperties, 'packageSize') ?? 0

      return translate(PACKAGE_RATE_KEY, {
        amount: formatAmount(amount, amountArgs),
        count: packageSize,
      })
    }

    case RateCardRateModelEnum.Percentage: {
      const rate = getNumericProperty(rateProperties, 'rate') ?? 0

      return translate(PERCENTAGE_RATE_KEY, { rate })
    }

    case RateCardRateModelEnum.Graduated: {
      const count = getArrayProperty(rateProperties, 'graduatedRanges').length

      return translate(TIERED_RATE_KEY, { label, count })
    }

    case RateCardRateModelEnum.GraduatedPercentage: {
      const count = getArrayProperty(rateProperties, 'graduatedPercentageRanges').length

      return translate(TIERED_RATE_KEY, { label, count })
    }

    case RateCardRateModelEnum.Volume: {
      const count = getArrayProperty(rateProperties, 'volumeRanges').length

      return translate(TIERED_RATE_KEY, { label, count })
    }

    case RateCardRateModelEnum.Dynamic:
      return label

    case RateCardRateModelEnum.Custom:
      return label

    default:
      return label
  }
}
