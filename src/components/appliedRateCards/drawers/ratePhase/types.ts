import { gql } from '@apollo/client'

import {
  ActiveRateForRatePhaseFragment,
  PropertiesForRateCardRateFragmentDoc,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { RateCardRateDrawerRateCard } from '~/pages/catalog/drawers/rateCardRate/RateCardRateFieldGroups'

import { RatePhaseReference } from './ratePhaseFormSchema'

gql`
  fragment ActiveRateForRatePhase on RateCardRate {
    id
    effectiveFrom
    rateModel
    billingIntervalCount
    billingIntervalUnit
    minAmountCents
    appliedPricingUnitConversionRate
    rateProperties {
      ...PropertiesForRateCardRate
    }
  }

  ${PropertiesForRateCardRateFragmentDoc}
`

export type RateCardForRatePhaseFields = RateCardRateDrawerRateCard & {
  // A phase without an override runs on it, so the drawer shows its values read-only.
  activeRate: ActiveRateForRatePhaseFragment | null | undefined
}

export type RatePhaseDrawerProps =
  | {
      context: 'plan'
      mode: 'create'
      planAppliedRateCardId: string
      otherPhases: RatePhaseReference[]
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'plan'
      mode: 'edit'
      planAppliedRateCardId: string
      otherPhases: RatePhaseReference[]
      phase: RatePhaseForDrawerFragment
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'contract'
      mode: 'create'
      contractAppliedRateCardId: string
      otherPhases: RatePhaseReference[]
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'contract'
      mode: 'edit'
      contractAppliedRateCardId: string
      otherPhases: RatePhaseReference[]
      phase: RatePhaseForDrawerFragment
      rateCard: RateCardForRatePhaseFields
    }
