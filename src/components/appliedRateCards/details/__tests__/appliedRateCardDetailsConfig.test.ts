import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { RatePhaseDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'

import { APPLIED_RATE_CARD_DETAILS_CONFIG } from '../appliedRateCardDetailsConfig'

describe('APPLIED_RATE_CARD_DETAILS_CONFIG buildPhasePath', () => {
  const pathParams = { parentId: 'p-1', appliedRateCardId: 'arc-1', phaseId: 'ph-1' }

  it.each<[AppliedRateCardContext, string]>([
    ['plan', '/plan-pricing/p-1/rate-cards/arc-1/phases/ph-1'],
    ['contract', '/contracts/p-1/rate-cards/arc-1/phases/ph-1'],
  ])('GIVEN the %s entry and no tab THEN builds the bare phase path', (context, expected) => {
    expect(APPLIED_RATE_CARD_DETAILS_CONFIG[context].buildPhasePath(pathParams)).toBe(expected)
  })

  it.each<[AppliedRateCardContext, string]>([
    ['plan', '/plan-pricing/p-1/rate-cards/arc-1/phases/ph-1/activity-logs'],
    ['contract', '/contracts/p-1/rate-cards/arc-1/phases/ph-1/activity-logs'],
  ])('GIVEN the %s entry and a tab THEN builds the phase tab path', (context, expected) => {
    expect(
      APPLIED_RATE_CARD_DETAILS_CONFIG[context].buildPhasePath({
        ...pathParams,
        tab: RatePhaseDetailsTabsOptionsEnum.activityLogs,
      }),
    ).toBe(expected)
  })
})
