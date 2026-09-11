import {
  AggregationTypeEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

export const NO_AVAILABLE_RATE_MODELS_KEY = 'text_1789033674097sd7erhjfvp5'
export const RATE_MODEL_UNAVAILABLE_KEY = 'text_1789033674097g9f5muxpeon'
export const RATE_MODEL_AVAILABILITY_LOADING_KEY = 'text_1789033796306gu724up7qa2'

export type RateModelProduct = {
  productType?: ProductTypeEnum
  aggregationType?: AggregationTypeEnum | null
  recurring?: boolean | null
}

export type RateModelConfiguration = RateModelProduct & {
  billingTiming: RateCardBillingTimingEnum
  proration: boolean
}

export const isRateCardProrationSupported = (product: RateModelProduct): boolean | undefined => {
  if (product.productType === ProductTypeEnum.Fixed) return true
  if (
    product.productType !== ProductTypeEnum.Usage ||
    !product.aggregationType ||
    typeof product.recurring !== 'boolean'
  ) {
    return undefined
  }

  return product.recurring && product.aggregationType !== AggregationTypeEnum.WeightedSumAgg
}

export const getAvailableRateModels = (
  configuration?: RateModelConfiguration,
): RateCardRateModelEnum[] | undefined => {
  if (!configuration) return undefined

  const supportsProration = isRateCardProrationSupported(configuration)

  if (supportsProration === undefined) return undefined

  const { productType, aggregationType, billingTiming, proration } = configuration
  const isAdvance = billingTiming === RateCardBillingTimingEnum.Advance

  if (
    productType === ProductTypeEnum.Usage &&
    isAdvance &&
    (aggregationType === AggregationTypeEnum.LatestAgg ||
      aggregationType === AggregationTypeEnum.MaxAgg ||
      aggregationType === AggregationTypeEnum.WeightedSumAgg)
  ) {
    return []
  }

  const proratedModels = [
    RateCardRateModelEnum.Graduated,
    RateCardRateModelEnum.Standard,
    RateCardRateModelEnum.Volume,
  ]

  if (proration) {
    if (!supportsProration) return []

    return isAdvance ? [RateCardRateModelEnum.Standard] : proratedModels
  }

  if (productType === ProductTypeEnum.Fixed) {
    return isAdvance
      ? [RateCardRateModelEnum.Graduated, RateCardRateModelEnum.Standard]
      : proratedModels
  }

  return [
    RateCardRateModelEnum.Custom,
    RateCardRateModelEnum.Dynamic,
    RateCardRateModelEnum.Graduated,
    RateCardRateModelEnum.GraduatedPercentage,
    RateCardRateModelEnum.Package,
    RateCardRateModelEnum.Percentage,
    RateCardRateModelEnum.Standard,
    RateCardRateModelEnum.Volume,
  ].filter((model) => {
    if (model === RateCardRateModelEnum.Custom)
      return aggregationType === AggregationTypeEnum.CustomAgg
    if (model === RateCardRateModelEnum.Dynamic)
      return aggregationType === AggregationTypeEnum.SumAgg
    if (model === RateCardRateModelEnum.Volume && isAdvance) return false

    return (
      aggregationType !== AggregationTypeEnum.LatestAgg ||
      (model !== RateCardRateModelEnum.GraduatedPercentage &&
        model !== RateCardRateModelEnum.Percentage)
    )
  })
}
