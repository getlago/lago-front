import { CurrencyEnum, ProductTypeEnum, RateCardBillingTimingEnum } from '~/generated/graphql'
import { RateModelConfiguration } from '~/pages/catalog/utils/rateModelAvailability'

export type RateCardForRatePhaseFields = {
  productType: ProductTypeEnum
  currency: CurrencyEnum
  billingTiming: RateCardBillingTimingEnum
  appliedPricingUnitCode: string | null | undefined
  rateModelConfiguration: RateModelConfiguration | undefined
}
