import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'

import { mapRateOverrideFromFormToApi } from '../drawers/ratePhase/mappers'
import {
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
} from '../drawers/ratePhase/ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from '../drawers/ratePhase/types'
import { ActiveRateForDiff, getOverriddenFields, hasRateOverride } from '../overrideDiff'

const apolloActiveRate: ActiveRateForDiff = {
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: {
    __typename: 'RateProperties',
    amount: '10',
    packageSize: null,
    freeUnits: null,
    pricingGroupKeys: null,
    presentationGroupKeys: null,
    graduatedRanges: null,
    graduatedPercentageRanges: null,
    volumeRanges: null,
  },
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '500',
  appliedPricingUnitConversionRate: 1.5,
}

const formValuesMatchingActiveRate: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  code: 'intro',
  overrideEnabled: true,
  rateModel: RateCardRateModelEnum.Standard,
  properties: getRatePropertiesShape(apolloActiveRate.rateProperties),
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '5.00',
  conversionRate: '1.5',
}

const toOverride = (values: Partial<RatePhaseFormValues>): RateOverrideInput =>
  mapRateOverrideFromFormToApi({ ...formValuesMatchingActiveRate, ...values }, CurrencyEnum.Usd)

describe('getOverriddenFields', () => {
  it('GIVEN no override WHEN diffing THEN returns an empty set', () => {
    expect(getOverriddenFields(apolloActiveRate, null)).toEqual(new Set())
    expect(getOverriddenFields(apolloActiveRate, undefined)).toEqual(new Set())
  })

  it('GIVEN an Apollo-shaped active rate and an equal override from the form THEN returns an empty set', () => {
    // Regression: `__typename` and cents vs display amounts flagged every overridden phase.
    expect(getOverriddenFields(apolloActiveRate, toOverride({}))).toEqual(new Set())
  })

  it('GIVEN a numeric property typed back as a string THEN it is not flagged', () => {
    const override = toOverride({
      properties: {
        ...formValuesMatchingActiveRate.properties,
        packageSize: '10',
        amount: '10.00',
      },
    })

    expect(getOverriddenFields(apolloActiveRate, override)).toEqual(new Set())
  })

  it('GIVEN graduated tiers equal to the active rate ones THEN returns an empty set', () => {
    const graduatedActiveRate: ActiveRateForDiff = {
      ...apolloActiveRate,
      rateModel: RateCardRateModelEnum.Graduated,
      rateProperties: {
        __typename: 'RateProperties',
        graduatedRanges: [
          { __typename: 'RateTier', toValue: '100', perUnitAmount: '1', flatAmount: '0' },
          { __typename: 'RateTier', toValue: null, perUnitAmount: '0.5', flatAmount: '2' },
        ],
      },
    }

    const override = toOverride({
      rateModel: RateCardRateModelEnum.Graduated,
      properties: getRatePropertiesShape(graduatedActiveRate.rateProperties),
    })

    expect(getOverriddenFields(graduatedActiveRate, override)).toEqual(new Set())
  })

  it('GIVEN only the amount differs THEN flags only rateProperties', () => {
    const override = toOverride({
      properties: { ...formValuesMatchingActiveRate.properties, amount: '20' },
    })

    expect(getOverriddenFields(apolloActiveRate, override)).toEqual(new Set(['rateProperties']))
  })

  it('GIVEN appliedPricingUnitConversionRate/pricingUnitConversionRate differ across their different names THEN flags pricingUnitConversionRate', () => {
    expect(getOverriddenFields(apolloActiveRate, toOverride({ conversionRate: '2' }))).toEqual(
      new Set(['pricingUnitConversionRate']),
    )
  })

  it('GIVEN billingIntervalCount, billingIntervalUnit and minAmountCents differ THEN flags those three', () => {
    const override = toOverride({
      billingIntervalCount: '3',
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Year,
      minAmountCents: '7',
    })

    expect(getOverriddenFields(apolloActiveRate, override)).toEqual(
      new Set(['billingIntervalCount', 'billingIntervalUnit', 'minAmountCents']),
    )
  })

  it('GIVEN another rate model THEN flags rateModel and its rateProperties', () => {
    const override = toOverride({
      rateModel: RateCardRateModelEnum.Package,
      properties: { ...formValuesMatchingActiveRate.properties, packageSize: 5 },
    })

    expect(getOverriddenFields(apolloActiveRate, override)).toEqual(
      new Set(['rateModel', 'rateProperties']),
    )
  })
})

describe('hasRateOverride', () => {
  const rateCard: RateCardForRatePhaseFields = {
    productType: ProductTypeEnum.Metered,
    currency: CurrencyEnum.Usd,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    appliedPricingUnitCode: 'CR',
    proration: false,
    activeRate: {
      ...apolloActiveRate,
      __typename: 'RateCardRate',
      id: 'rate-1',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
    },
  }

  it('GIVEN the override is off THEN there is none', () => {
    expect(
      hasRateOverride({ ...formValuesMatchingActiveRate, overrideEnabled: false }, rateCard),
    ).toBe(false)
  })

  it('GIVEN the override is on but matches the active rate THEN there is none', () => {
    expect(hasRateOverride(formValuesMatchingActiveRate, rateCard)).toBe(false)
  })

  it('GIVEN the override changes a value THEN there is one', () => {
    expect(
      hasRateOverride({ ...formValuesMatchingActiveRate, minAmountCents: '7' }, rateCard),
    ).toBe(true)
  })

  it('GIVEN no active rate to compare with THEN an enabled override is kept', () => {
    expect(hasRateOverride(formValuesMatchingActiveRate, { ...rateCard, activeRate: null })).toBe(
      true,
    )
  })
})
