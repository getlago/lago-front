import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  PropertiesForRateCardRateFragment,
  RateCardBillingTimingEnum,
  RateCardForRateDetailsFragment,
  RateCardForRateDrawerFragment,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateForListFragment,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'

export const buildRateProperties = (
  overrides: Partial<PropertiesForRateCardRateFragment> = {},
): PropertiesForRateCardRateFragment => ({
  __typename: 'RateProperties',
  amount: '10',
  rate: null,
  packageSize: null,
  pricingGroupKeys: null,
  freeUnits: null,
  fixedAmount: null,
  freeUnitsPerEvents: null,
  freeUnitsPerTotalAggregation: null,
  perTransactionMinAmount: null,
  perTransactionMaxAmount: null,
  customProperties: null,
  graduatedRanges: null,
  volumeRanges: null,
  graduatedPercentageRanges: null,
  ...overrides,
})

type RateTierRows<T extends 'graduatedRanges' | 'volumeRanges' | 'graduatedPercentageRanges'> =
  NonNullable<PropertiesForRateCardRateFragment[T]>

export const buildGraduatedRanges = (): RateTierRows<'graduatedRanges'> => [
  { __typename: 'RateTier', toValue: '10', perUnitAmount: '5', flatAmount: '1' },
  { __typename: 'RateTier', toValue: null, perUnitAmount: '2', flatAmount: '0' },
]

export const buildVolumeRanges = (): RateTierRows<'volumeRanges'> => [
  { __typename: 'RateTier', toValue: '100', perUnitAmount: '1', flatAmount: '0' },
  { __typename: 'RateTier', toValue: null, perUnitAmount: '0.5', flatAmount: '2' },
]

export const buildGraduatedPercentageRanges = (): RateTierRows<'graduatedPercentageRanges'> => [
  { __typename: 'RatePercentageTier', toValue: '10000', rate: '0.1', flatAmount: '1' },
  { __typename: 'RatePercentageTier', toValue: null, rate: '0.05', flatAmount: '0.5' },
]

export const buildRateCardForRateDrawer = (
  overrides: Partial<RateCardForRateDrawerFragment> = {},
): RateCardForRateDrawerFragment => ({
  __typename: 'RateCard',
  id: 'rc-1',
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  proration: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'product-1',
    productType: ProductTypeEnum.Metered,
    billableMetric: {
      __typename: 'BillableMetric',
      id: 'bm-1',
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: false,
    },
  },
  activeRate: null,
  ...overrides,
})

export const buildRateCardForRateDetails = (
  overrides: Partial<RateCardForRateDetailsFragment> = {},
): RateCardForRateDetailsFragment => ({
  __typename: 'RateCard',
  id: 'rc-1',
  name: 'Enterprise rate card',
  code: 'enterprise_rate_card',
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  product: {
    __typename: 'Product',
    id: 'product-1',
    name: 'API calls',
    productCategory: {
      __typename: 'ProductCategory',
      id: 'pcategory-1',
      name: 'Platform',
    },
  },
  productFilter: null,
  ...overrides,
})

export const buildRateCardRate = (
  overrides: Partial<RateCardRateForListFragment> = {},
): RateCardRateForListFragment => ({
  __typename: 'RateCardRate',
  id: 'rate-1',
  code: 'rate_01_24_2026',
  status: RateCardRateStatusEnum.Pending,
  effectiveFrom: '2026-01-24T00:00:00.000Z',
  createdAt: '2026-01-20T00:00:00.000Z',
  rateModel: RateCardRateModelEnum.Standard,
  minAmountCents: '0',
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  appliedPricingUnitConversionRate: null,
  rateProperties: buildRateProperties(),
  ...overrides,
})
