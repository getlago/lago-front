import {
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
  RateCardRateBillingIntervalUnitEnum,
} from '~/generated/graphql'

import {
  buildPhaseInput,
  buildRatePhaseFormSchema,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
} from '../ratePhaseFormSchema'

const baseValues: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  code: 'phase-1',
  name: 'Phase 1',
  durationType: 'forever',
  durationCycleCount: '',
}

const baseContext = {
  isLastPosition: true,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  hasPricingUnit: false,
  rateModelConfiguration: undefined,
}

describe('buildRatePhaseFormSchema', () => {
  it('GIVEN isLastPosition true AND durationType finite THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => baseContext)
    const result = schema.safeParse({ ...baseValues, durationType: 'finite', durationCycleCount: '3' })

    expect(result.success).toBe(false)
  })

  it('GIVEN isLastPosition false AND durationType forever THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => ({ ...baseContext, isLastPosition: false }))
    const result = schema.safeParse({ ...baseValues, durationType: 'forever' })

    expect(result.success).toBe(false)
  })

  it('GIVEN isLastPosition false AND durationType finite with a blank count THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => ({ ...baseContext, isLastPosition: false }))
    const result = schema.safeParse({ ...baseValues, durationType: 'finite', durationCycleCount: '' })

    expect(result.success).toBe(false)
  })

  it('GIVEN overrideEnabled false THEN never requires rate-model/properties validity', () => {
    const schema = buildRatePhaseFormSchema(() => baseContext)
    const result = schema.safeParse({ ...baseValues, overrideEnabled: false })

    expect(result.success).toBe(true)
  })

  it('GIVEN overrideEnabled true AND billingTiming advance THEN a non-zero minAmountCents is rejected', () => {
    const schema = buildRatePhaseFormSchema(() => ({
      ...baseContext,
      billingTiming: RateCardBillingTimingEnum.Advance,
    }))
    const result = schema.safeParse({
      ...baseValues,
      overrideEnabled: true,
      rateModel: RateCardRateModelEnum.Standard,
      properties: { amount: '10' },
      minAmountCents: '500',
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN overrideEnabled true AND hasPricingUnit true AND blank conversionRate THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => ({ ...baseContext, hasPricingUnit: true }))
    const result = schema.safeParse({
      ...baseValues,
      overrideEnabled: true,
      rateModel: RateCardRateModelEnum.Standard,
      properties: { amount: '10' },
      conversionRate: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('buildPhaseInput', () => {
  it('GIVEN overrideEnabled false THEN omits rateOverride entirely', () => {
    const input = buildPhaseInput({ ...baseValues, position: 1, overrideEnabled: false })

    expect(input).toEqual({
      code: 'phase-1',
      name: 'Phase 1',
      position: 1,
      billingIntervalCycleCount: null,
    })
  })

  it('GIVEN durationType finite THEN sends the parsed cycle count', () => {
    const input = buildPhaseInput({
      ...baseValues,
      durationType: 'finite',
      durationCycleCount: '3',
      position: 1,
      overrideEnabled: false,
    })

    expect(input.billingIntervalCycleCount).toBe(3)
  })

  it('GIVEN overrideEnabled true THEN serializes rateOverride with the mapped conversion-rate field name', () => {
    const input = buildPhaseInput({
      ...baseValues,
      position: 1,
      overrideEnabled: true,
      rateModel: RateCardRateModelEnum.Standard,
      properties: { amount: '10' },
      overrideBillingIntervalCount: '1',
      overrideBillingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: '0',
      conversionRate: '1.5',
    })

    expect(input.rateOverride).toMatchObject({
      rateModel: RateCardRateModelEnum.Standard,
      billingIntervalCount: 1,
      billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
      minAmountCents: 0,
      pricingUnitConversionRate: 1.5,
    })
  })

  it('GIVEN minAmountCents blank (the only state the schema allows under advance billing) THEN the payload never carries a numeric minAmountCents', () => {
    const input = buildPhaseInput({
      ...baseValues,
      position: 1,
      overrideEnabled: true,
      rateModel: RateCardRateModelEnum.Standard,
      properties: { amount: '10' },
      minAmountCents: '',
    })

    expect(input.rateOverride?.minAmountCents).toBeUndefined()
  })
})
