import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

import { mapFromApiToForm, mapFromFormToApi } from '../mappers'
import { RATE_PHASE_FORM_DEFAULTS, RatePhaseFormValues } from '../ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from '../types'

const baseValues: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  code: 'phase-1',
  name: 'Phase 1',
  durationType: 'forever',
  durationCycleCount: '',
}

describe('mapFromFormToApi', () => {
  it('GIVEN overrideEnabled false THEN omits rateOverride entirely', () => {
    const input = mapFromFormToApi(
      { ...baseValues, position: 1, overrideEnabled: false },
      CurrencyEnum.Usd,
    )

    expect(input).toEqual({
      code: 'phase-1',
      name: 'Phase 1',
      position: 1,
      billingIntervalCycleCount: null,
    })
  })

  it('GIVEN durationType finite THEN sends the parsed cycle count', () => {
    const input = mapFromFormToApi(
      {
        ...baseValues,
        durationType: 'finite',
        durationCycleCount: '3',
        position: 1,
        overrideEnabled: false,
      },
      CurrencyEnum.Usd,
    )

    expect(input.billingIntervalCycleCount).toBe(3)
  })

  it('GIVEN overrideEnabled true THEN serializes rateOverride with the mapped conversion-rate field name', () => {
    const input = mapFromFormToApi(
      {
        ...baseValues,
        position: 1,
        overrideEnabled: true,
        rateModel: RateCardRateModelEnum.Standard,
        properties: { amount: '10' },
        billingIntervalCount: '1',
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        minAmountCents: '5',
        conversionRate: '1.5',
      },
      CurrencyEnum.Usd,
    )

    expect(input.rateOverride).toMatchObject({
      rateModel: RateCardRateModelEnum.Standard,
      billingIntervalCount: 1,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: 500,
      pricingUnitConversionRate: 1.5,
    })
  })

  it('GIVEN minAmountCents blank (the only state the schema allows under advance billing) THEN the payload never carries a numeric minAmountCents', () => {
    const input = mapFromFormToApi(
      {
        ...baseValues,
        position: 1,
        overrideEnabled: true,
        rateModel: RateCardRateModelEnum.Standard,
        properties: { amount: '10' },
        minAmountCents: '',
      },
      CurrencyEnum.Usd,
    )

    expect(input.rateOverride?.minAmountCents).toBeUndefined()
  })

  it('GIVEN minAmountCents a decimal display amount THEN serializeAmount converts it to the currency smallest unit', () => {
    const input = mapFromFormToApi(
      {
        ...baseValues,
        position: 1,
        overrideEnabled: true,
        rateModel: RateCardRateModelEnum.Standard,
        properties: { amount: '10' },
        minAmountCents: '12.50',
      },
      CurrencyEnum.Usd,
    )

    expect(input.rateOverride?.minAmountCents).toBe(1250)
  })

  it('GIVEN a blank name THEN sends null so an update clears it', () => {
    const input = mapFromFormToApi(
      { ...baseValues, name: '', position: 1, overrideEnabled: false },
      CurrencyEnum.Usd,
    )

    expect(input.name).toBeNull()
  })
})

describe('mapFromApiToForm', () => {
  const rateCard: RateCardForRatePhaseFields = {
    productType: ProductTypeEnum.Metered,
    currency: CurrencyEnum.Usd,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    appliedPricingUnitCode: null,
    proration: false,
    activeRate: null,
  }

  it('GIVEN a phase without override THEN seeds a forever phase with the override off', () => {
    const values = mapFromApiToForm(
      {
        id: 'phase-id',
        code: 'phase-1',
        name: null,
        position: 1,
        billingIntervalCycleCount: null,
        rateOverride: null,
      },
      rateCard,
    )

    expect(values).toMatchObject({
      code: 'phase-1',
      name: '',
      durationType: 'forever',
      durationCycleCount: '',
      overrideEnabled: false,
    })
  })

  it('GIVEN an override with a spending minimum THEN deserializes it to a display amount', () => {
    const values = mapFromApiToForm(
      {
        id: 'phase-id',
        code: 'phase-1',
        name: 'Phase 1',
        position: 1,
        billingIntervalCycleCount: 3,
        rateOverride: {
          rateModel: RateCardRateModelEnum.Standard,
          rateProperties: { amount: '10' },
          billingIntervalCount: 2,
          billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
          minAmountCents: '1250',
          pricingUnitConversionRate: null,
        },
      },
      rateCard,
    )

    expect(values).toMatchObject({
      durationType: 'finite',
      durationCycleCount: '3',
      overrideEnabled: true,
      billingIntervalCount: '2',
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
      minAmountCents: '12.5',
    })
  })
})
