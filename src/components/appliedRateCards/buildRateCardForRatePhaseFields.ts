import {
  ProductForAppliedRateCardDrawerFragment,
  RateCardForAppliedRateCardDrawerFragment,
} from '~/generated/graphql'

import { RateCardForRatePhaseFields } from './drawers/ratePhase/types'

export const buildRateCardForRatePhaseFields = (
  product: ProductForAppliedRateCardDrawerFragment,
  rateCard: RateCardForAppliedRateCardDrawerFragment,
): RateCardForRatePhaseFields | undefined => {
  if (!product.productType) return undefined

  return {
    productType: product.productType,
    aggregationType: product.billableMetric?.aggregationType,
    recurring: product.billableMetric?.recurring,
    currency: rateCard.currency,
    billingTiming: rateCard.billingTiming,
    proration: rateCard.proration,
    appliedPricingUnitCode: rateCard.appliedPricingUnitCode,
    activeRate: rateCard.activeRate,
  }
}
