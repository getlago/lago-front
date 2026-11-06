import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'

import { RateCardForRatePhaseFields } from '../drawers/ratePhase/types'
import { getServerPhaseRate } from '../ratePhaseRate'

const rateCard: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: {
    __typename: 'RateCardRate',
    id: 'active-rate',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
    minAmountCents: '0',
    appliedPricingUnitConversionRate: null,
    rateProperties: { __typename: 'RateProperties', amount: '10' },
  },
}

const override: NonNullable<RatePhaseForDrawerFragment['rateOverride']> = {
  __typename: 'RateOverride',
  rateModel: RateCardRateModelEnum.Standard,
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
  minAmountCents: '0',
  pricingUnitConversionRate: null,
  rateProperties: { __typename: 'RateProperties', amount: '25' },
}

const phase: RatePhaseForDrawerFragment = {
  __typename: 'RatePhase',
  id: 'phase-1',
  code: 'intro',
  name: 'Intro',
  position: 1,
  billingIntervalCycleCount: 3,
  rateOverride: override,
}

describe('getServerPhaseRate', () => {
  it('GIVEN a phase without override on a card with an active rate THEN returns the active rate with its effective date', () => {
    expect(getServerPhaseRate({ ...phase, rateOverride: null }, rateCard)).toMatchObject({
      isOverridden: false,
      effectiveFrom: rateCard.activeRate?.effectiveFrom,
    })
  })

  it('GIVEN an override with a count but no unit THEN inherits the unit from the active rate', () => {
    const result = getServerPhaseRate(
      {
        ...phase,
        rateOverride: { ...override, billingIntervalCount: 2, billingIntervalUnit: null },
      },
      rateCard,
    )

    expect(result?.rate.billingIntervalUnit).toBe(RateCardRateBillingIntervalUnitEnum.Week)
    expect(result?.rate.billingIntervalCount).toBe(2)
  })

  it('GIVEN no override and no active rate THEN returns null', () => {
    expect(
      getServerPhaseRate({ ...phase, rateOverride: null }, { ...rateCard, activeRate: null }),
    ).toBeNull()
  })

  it('GIVEN an override without billing interval and no active rate THEN the interval stays unset', () => {
    const result = getServerPhaseRate(
      {
        ...phase,
        rateOverride: { ...override, billingIntervalCount: null, billingIntervalUnit: null },
      },
      { ...rateCard, activeRate: null },
    )

    expect(result?.rate.billingIntervalCount).toBeNull()
    expect(result?.rate.billingIntervalUnit).toBeNull()
  })

  it('GIVEN an override and no active rate THEN is overridden with no highlighted field', () => {
    const result = getServerPhaseRate(phase, { ...rateCard, activeRate: null })

    expect(result?.isOverridden).toBe(true)
    expect(result?.isOverridden && result.overriddenFields.size).toBe(0)
  })
})
