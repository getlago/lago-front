import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { RateModelConfiguration } from '~/pages/catalog/utils/rateModelAvailability'

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
      isLastPosition: boolean
      position: number
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'plan'
      mode: 'edit'
      planAppliedRateCardId: string
      isLastPosition: boolean
      phase: RatePhaseForDrawerFragment
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'contract'
      mode: 'create'
      contractAppliedRateCardId: string
      isLastPosition: boolean
      position: number
      rateCard: RateCardForRatePhaseFields
    }
  | {
      context: 'contract'
      mode: 'edit'
      contractAppliedRateCardId: string
      isLastPosition: boolean
      phase: RatePhaseForDrawerFragment
      rateCard: RateCardForRatePhaseFields
    }
