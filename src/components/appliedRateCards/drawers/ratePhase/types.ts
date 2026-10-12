import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { RateModelConfiguration } from '~/pages/catalog/utils/rateModelAvailability'

import { RatePhaseReference } from './ratePhaseFormSchema'

export type RateCardForRatePhaseFields = {
  productType: ProductTypeEnum
  currency: CurrencyEnum
  billingTiming: RateCardBillingTimingEnum
  appliedPricingUnitCode: string | null | undefined
  rateModelConfiguration: RateModelConfiguration | undefined
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
