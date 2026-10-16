import { RateCardRateBillingIntervalUnitEnum, RateOverrideInput } from '~/generated/graphql'
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

const FOREVER_KEY = 'text_63c83a3476e46bc6ab9d85d6'
const CYCLES_KEY = 'text_1791485670326auwsxq3x83b'

export const formatIntervalDuration = (
  count: number,
  unit: RateCardRateBillingIntervalUnitEnum,
  translate: TranslateFunc,
): string => translate(DURATION_BY_UNIT_KEY[unit], { count }, count)

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

export const formatPhaseTimeline = (
  phase: RatePhaseForDetails,
  rate: RateOverrideInput | undefined,
  translate: TranslateFunc,
): string => {
  const duration =
    phase.billingIntervalCycleCount === null
      ? translate(FOREVER_KEY)
      : translate(
          'text_17918384599837xai95r4dok',
          {
            count: phase.billingIntervalCycleCount,
            duration: formatPhaseDuration(phase.billingIntervalCycleCount, rate, translate),
          },
          phase.billingIntervalCycleCount,
        )

  return translate(
    phase.position === 1 ? 'text_1791838459983033k4czt8tl' : 'text_1791838459983owffqxt3lov',
    { duration },
  )
}
