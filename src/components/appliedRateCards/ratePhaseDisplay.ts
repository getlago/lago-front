import { generatePath } from 'react-router'

import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { OverrideDiffField } from './overrideDiff'

// The rate a phase bills with: its override, or the rate card's active rate.
export type RatePhaseRate =
  | { isOverridden: true; rate: RateOverrideInput; overriddenFields: Set<OverrideDiffField> }
  | { isOverridden: false; rate: RateOverrideInput; effectiveFrom: string }

export type RatePhaseForDetails = {
  name: string
  code: string
  position: number
  // `null` runs forever.
  billingIntervalCycleCount: number | null
}

const DURATION_BY_UNIT_KEY: Record<RateCardRateBillingIntervalUnitEnum, string> = {
  [RateCardRateBillingIntervalUnitEnum.Day]: 'text_1791838459983pbylbvgfd34',
  [RateCardRateBillingIntervalUnitEnum.Week]: 'text_17918384599834l3c40rdguv',
  [RateCardRateBillingIntervalUnitEnum.Month]: 'text_1791838459983q6n44o5fdd4',
  [RateCardRateBillingIntervalUnitEnum.Year]: 'text_1791838459983d5nh38p5el6',
}

const UNIT_ADJECTIVE_KEY: Record<RateCardRateBillingIntervalUnitEnum, string> = {
  [RateCardRateBillingIntervalUnitEnum.Day]: 'text_1792805607611liqqm55m4tx',
  [RateCardRateBillingIntervalUnitEnum.Week]: 'text_1792805607611szr9xumw4xy',
  [RateCardRateBillingIntervalUnitEnum.Month]: 'text_1792805607611xb205ke9yxd',
  [RateCardRateBillingIntervalUnitEnum.Year]: 'text_1792805607611hzs13fujmao',
}

const FOREVER_KEY = 'text_63c83a3476e46bc6ab9d85d6'
const CYCLES_OF_KEY = 'text_1792805607611jqwgpebsjt0'
const FOREVER_IN_KEY = 'text_1792805607611z33he0lep1w'
const CYCLE_COUNT_KEY = 'text_17928056076110dccmhrqkag'
const CYCLES_KEY = 'text_1791485670326auwsxq3x83b'
const PHASE_POSITION_KEY = 'text_1792503533806fhiu57zr6an'

export const formatIntervalDuration = (
  count: number,
  unit: RateCardRateBillingIntervalUnitEnum,
  translate: TranslateFunc,
): string => translate(DURATION_BY_UNIT_KEY[unit], { count }, count)

export const formatRateBillingInterval = (
  rate: RateOverrideInput,
  translate: TranslateFunc,
): string =>
  translate('text_17918384599832tqq2f0ezu9', {
    duration: formatIntervalDuration(
      rate.billingIntervalCount ?? 1,
      rate.billingIntervalUnit ?? RateCardRateBillingIntervalUnitEnum.Month,
      translate,
    ),
  })

export const formatConversionRateAmount = (amount: number, currency: CurrencyEnum): string =>
  intlFormatNumber(amount, {
    currencyDisplay: 'symbol',
    currency,
    maximumFractionDigits: 15,
  })

export const formatSpendingMinimum = (
  rate: Pick<RateOverrideInput, 'minAmountCents'>,
  currency: CurrencyEnum,
  pricingUnitShortName: string | undefined,
): string => {
  // A rate saved without one stores 0, which would read as a configured zero floor.
  const minAmountCents = Number(rate.minAmountCents ?? 0)

  if (minAmountCents <= 0) return '-'

  return intlFormatNumber(deserializeAmount(minAmountCents, currency), {
    currencyDisplay: 'symbol',
    currency,
    pricingUnitShortName,
    maximumFractionDigits: 15,
  })
}

export const getRateHistoryPath = (
  rateCardId: string,
  organizationSlug: string | undefined,
): string =>
  prependOrgSlug(
    generatePath(RATE_CARD_DETAILS_ROUTE, {
      rateCardId,
      tab: RateCardDetailsTabsOptionsEnum.rates,
    }),
    organizationSlug,
  )

// No unit conversion: 1 cycle of 14 days reads "14 days", 2 cycles of 1 week "2 weeks".
export const formatPhaseDuration = (
  cycleCount: number | null,
  rate: RateOverrideInput | undefined,
  translate: TranslateFunc,
): string => {
  if (cycleCount === null) return translate(FOREVER_KEY)
  if (!rate?.billingIntervalCount || !rate.billingIntervalUnit) {
    return `${cycleCount} ${translate(CYCLES_KEY)}`
  }

  return formatIntervalDuration(
    cycleCount * rate.billingIntervalCount,
    rate.billingIntervalUnit,
    translate,
  )
}

const formatTimelineDuration = (
  cycleCount: number | null,
  rate: RateOverrideInput | undefined,
  translate: TranslateFunc,
): string => {
  const interval =
    rate?.billingIntervalCount && rate.billingIntervalUnit
      ? { count: rate.billingIntervalCount, unit: rate.billingIntervalUnit }
      : undefined

  if (cycleCount === null) {
    if (!interval) return translate(FOREVER_KEY)

    return translate(FOREVER_IN_KEY, {
      duration: translate(UNIT_ADJECTIVE_KEY[interval.unit], { count: interval.count }),
    })
  }

  if (!interval) return translate(CYCLE_COUNT_KEY, { count: cycleCount }, cycleCount)

  return translate(
    CYCLES_OF_KEY,
    {
      count: cycleCount,
      duration: formatIntervalDuration(interval.count, interval.unit, translate),
    },
    cycleCount,
  )
}

export const formatPhaseTimeline = (
  phase: RatePhaseForDetails,
  rate: RateOverrideInput | undefined,
  translate: TranslateFunc,
): string =>
  translate(
    phase.position === 1 ? 'text_1791838459983033k4czt8tl' : 'text_1791838459983owffqxt3lov',
    {
      duration: formatTimelineDuration(phase.billingIntervalCycleCount, rate, translate),
    },
  )

export const formatRatePhaseName = (
  phase: { name?: string | null; position: number },
  translate: TranslateFunc,
): string => phase.name || translate(PHASE_POSITION_KEY, { position: phase.position })
