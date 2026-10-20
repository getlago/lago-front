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

export const getServerPhaseRate = (
  phase: RatePhaseForDrawerFragment,
  rateCard: RateCardForRatePhaseFields,
): RatePhaseRate | null => getFormPhaseRate(mapFromApiToForm(phase, rateCard), rateCard)

export const toServerPhaseForDetails = (
  phase: RatePhaseForDrawerFragment,
): RatePhaseForDetails => ({
  name: phase.name ?? '',
  code: phase.code,
  position: phase.position,
  billingIntervalCycleCount: phase.billingIntervalCycleCount ?? null,
})
