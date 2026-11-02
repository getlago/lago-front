import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductForAppliedRateCardDrawerFragment,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardForAppliedRateCardDrawerFragment,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

import { buildRateCardForRatePhaseFields } from '../buildRateCardForRatePhaseFields'

const product: ProductForAppliedRateCardDrawerFragment = {
  __typename: 'Product',
  id: 'product-1',
  name: 'Seats',
  code: 'seats',
  invoiceDisplayName: null,
  productType: ProductTypeEnum.Metered,
  productCategory: null,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'metric-1',
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: true,
  },
}

const rateCard: RateCardForAppliedRateCardDrawerFragment = {
  __typename: 'RateCard',
  currency: CurrencyEnum.Eur,
  billingTiming: RateCardBillingTimingEnum.Advance,
  appliedPricingUnitCode: 'CR',
  proration: true,
  activeRate: {
    __typename: 'RateCardRate',
    id: 'active-rate',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
    minAmountCents: '0',
    appliedPricingUnitConversionRate: null,
    rateProperties: { __typename: 'RateProperties', amount: '10' },
  },
}

describe('buildRateCardForRatePhaseFields', () => {
  it('GIVEN a product with a billable metric THEN copies type, aggregation and recurring next to the rate card fields', () => {
    expect(buildRateCardForRatePhaseFields(product, rateCard)).toEqual({
      productType: ProductTypeEnum.Metered,
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: true,
      currency: CurrencyEnum.Eur,
      billingTiming: RateCardBillingTimingEnum.Advance,
      proration: true,
      appliedPricingUnitCode: 'CR',
      activeRate: rateCard.activeRate,
    })
  })

  it('GIVEN a product without a billable metric THEN leaves aggregation and recurring undefined', () => {
    expect(
      buildRateCardForRatePhaseFields(
        { ...product, productType: ProductTypeEnum.Fixed, billableMetric: null },
        rateCard,
      ),
    ).toMatchObject({
      productType: ProductTypeEnum.Fixed,
      aggregationType: undefined,
      recurring: undefined,
    })
  })

  it('GIVEN a product without product type THEN returns undefined', () => {
    expect(
      buildRateCardForRatePhaseFields(
        { ...product, productType: undefined as unknown as ProductTypeEnum },
        rateCard,
      ),
    ).toBeUndefined()
  })
})
