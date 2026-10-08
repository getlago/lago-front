import { RateCardRateBillingIntervalUnitEnum, RateCardRateModelEnum } from '~/generated/graphql'

import { getOverriddenFields } from '../overrideDiff'

const activeRate = {
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: { amount: '10' },
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: 0,
  appliedPricingUnitConversionRate: null,
}

describe('getOverriddenFields', () => {
  it('GIVEN no override WHEN diffing THEN returns an empty set', () => {
    expect(getOverriddenFields(activeRate, null)).toEqual(new Set())
    expect(getOverriddenFields(activeRate, undefined)).toEqual(new Set())
  })

  it('GIVEN an override present but identical to the active rate THEN returns an empty set', () => {
    const override = {
      rateModel: RateCardRateModelEnum.Standard,
      rateProperties: { amount: '10' },
      billingIntervalCount: 1,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: 0,
      pricingUnitConversionRate: null,
    }

    expect(getOverriddenFields(activeRate, override)).toEqual(new Set())
  })

  it('GIVEN only rateProperties differs THEN flags only rateProperties', () => {
    const override = {
      rateModel: RateCardRateModelEnum.Standard,
      rateProperties: { amount: '20' },
      billingIntervalCount: 1,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: 0,
      pricingUnitConversionRate: null,
    }

    expect(getOverriddenFields(activeRate, override)).toEqual(new Set(['rateProperties']))
  })

  it('GIVEN appliedPricingUnitConversionRate/pricingUnitConversionRate differ across their different names THEN flags pricingUnitConversionRate', () => {
    const override = {
      rateModel: RateCardRateModelEnum.Standard,
      rateProperties: { amount: '10' },
      billingIntervalCount: 1,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: 0,
      pricingUnitConversionRate: 1.5,
    }

    expect(getOverriddenFields(activeRate, override)).toEqual(
      new Set(['pricingUnitConversionRate']),
    )
  })

  it('GIVEN rateModel, billingIntervalCount, billingIntervalUnit, minAmountCents all differ THEN flags all four', () => {
    const override = {
      rateModel: RateCardRateModelEnum.Package,
      rateProperties: { amount: '10' },
      billingIntervalCount: 3,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Year,
      minAmountCents: 500,
      pricingUnitConversionRate: null,
    }

    expect(getOverriddenFields(activeRate, override)).toEqual(
      new Set(['rateModel', 'billingIntervalCount', 'billingIntervalUnit', 'minAmountCents']),
    )
  })
})
