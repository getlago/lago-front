import { RatePhaseForDrawerFragment } from '~/generated/graphql'

import { mapFromApiToForm, mapRateOverrideFromFormToApi } from './drawers/ratePhase/mappers'
import { RatePhaseFormValues } from './drawers/ratePhase/ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './drawers/ratePhase/types'
import { activeRateToOverrideInput, getOverriddenFields } from './overrideDiff'
import { RatePhaseForDetails, RatePhaseRate } from './ratePhaseDisplay'

export const getFormPhaseRate = (
  phase: RatePhaseFormValues,
  rateCard: RateCardForRatePhaseFields,
): RatePhaseRate | null => {
  const { activeRate } = rateCard

  if (phase.overrideEnabled) {
    const rate = mapRateOverrideFromFormToApi(phase, rateCard.currency)

    return {
      isOverridden: true,
      rate,
      overriddenFields: activeRate ? getOverriddenFields(activeRate, rate) : new Set(),
    }
  }

  if (!activeRate) return null

  return {
    isOverridden: false,
    rate: activeRateToOverrideInput(activeRate),
    effectiveFrom: activeRate.effectiveFrom,
  }
}

// Not the form round trip alone: it fills an unset override interval with the form default, while
// without an active rate it has nothing to inherit and the duration must count cycles.
export const getServerPhaseRate = (
  phase: RatePhaseForDrawerFragment,
  rateCard: RateCardForRatePhaseFields,
): RatePhaseRate | null => {
  const phaseRate = getFormPhaseRate(mapFromApiToForm(phase, rateCard), rateCard)

  if (!phaseRate?.isOverridden || rateCard.activeRate) return phaseRate

  return {
    ...phaseRate,
    rate: {
      ...phaseRate.rate,
      billingIntervalCount: phase.rateOverride?.billingIntervalCount ?? null,
      billingIntervalUnit: phase.rateOverride?.billingIntervalUnit ?? null,
    },
  }
}

export const toServerPhaseForDetails = (
  phase: RatePhaseForDrawerFragment,
): RatePhaseForDetails => ({
  name: phase.name ?? '',
  code: phase.code,
  position: phase.position,
  billingIntervalCycleCount: phase.billingIntervalCycleCount ?? null,
})
