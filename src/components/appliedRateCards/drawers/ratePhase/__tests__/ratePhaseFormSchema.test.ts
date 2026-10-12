import {
  CurrencyEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

import {
  buildPhaseInput,
  buildRatePhaseFormSchema,
  getInsertIndex,
  getPositionDefaults,
  isPlacedLast,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
  RatePhaseReference,
} from '../ratePhaseFormSchema'

const baseValues: RatePhaseFormValues = {
  ...RATE_PHASE_FORM_DEFAULTS,
  code: 'phase-1',
  name: 'Phase 1',
  durationType: 'forever',
  durationCycleCount: '',
}

const OTHER_PHASES: RatePhaseReference[] = [
  { code: 'trial', name: 'Trial' },
  { code: 'standard', name: 'Standard' },
]

const baseContext: RatePhaseFormSchemaContext = {
  otherPhases: [],
  billingTiming: RateCardBillingTimingEnum.Arrears,
  hasPricingUnit: false,
  rateModelConfiguration: undefined,
}

const withOtherPhases: RatePhaseFormSchemaContext = { ...baseContext, otherPhases: OTHER_PHASES }

describe('buildRatePhaseFormSchema', () => {
  it('GIVEN no other phase AND durationType finite THEN accepts, the parent drawer warns instead', () => {
    const schema = buildRatePhaseFormSchema(() => baseContext)
    const result = schema.safeParse({
      ...baseValues,
      durationType: 'finite',
      durationCycleCount: '3',
    })

    expect(result.success).toBe(true)
  })

  it('GIVEN a phase placed before another one AND durationType forever THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => withOtherPhases)
    const result = schema.safeParse({
      ...baseValues,
      positionMode: 'before',
      positionReferenceCode: 'standard',
      durationType: 'forever',
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN a phase placed after the last one AND durationType forever THEN accepts', () => {
    const schema = buildRatePhaseFormSchema(() => withOtherPhases)
    const result = schema.safeParse({
      ...baseValues,
      positionMode: 'after',
      positionReferenceCode: 'standard',
      durationType: 'forever',
    })

    expect(result.success).toBe(true)
  })

  it('GIVEN other phases AND no position picked THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => withOtherPhases)
    const result = schema.safeParse({
      ...baseValues,
      durationType: 'finite',
      durationCycleCount: '3',
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN a code already used by another phase THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => withOtherPhases)
    const result = schema.safeParse({
      ...baseValues,
      code: 'trial',
      positionMode: 'before',
      positionReferenceCode: 'standard',
      durationType: 'finite',
      durationCycleCount: '3',
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN durationType finite with a blank count THEN rejects', () => {
    const schema = buildRatePhaseFormSchema(() => baseContext)
    const result = schema.safeParse({
      ...baseValues,
      durationType: 'finite',
      durationCycleCount: '',
    })

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

describe('phase position helpers', () => {
  it('GIVEN no other phase THEN the phase is placed last at index 0 with no default position', () => {
    expect(isPlacedLast({ positionMode: '', positionReferenceCode: '' }, [])).toBe(true)
    expect(getInsertIndex({ positionMode: '', positionReferenceCode: '' }, [])).toBe(0)
    expect(getPositionDefaults([])).toEqual({ positionMode: '', positionReferenceCode: '' })
  })

  it('GIVEN a new phase THEN it defaults to just before the last phase', () => {
    const defaults = getPositionDefaults(OTHER_PHASES)

    expect(defaults).toEqual({ positionMode: 'before', positionReferenceCode: 'standard' })
    expect(getInsertIndex(defaults, OTHER_PHASES)).toBe(1)
    expect(isPlacedLast(defaults, OTHER_PHASES)).toBe(false)
  })

  it('GIVEN after the last phase THEN it is placed last at the end', () => {
    const values = { positionMode: 'after' as const, positionReferenceCode: 'standard' }

    expect(isPlacedLast(values, OTHER_PHASES)).toBe(true)
    expect(getInsertIndex(values, OTHER_PHASES)).toBe(2)
  })

  it('GIVEN an edited phase THEN its position seeds from its neighbours', () => {
    expect(getPositionDefaults(OTHER_PHASES, 0)).toEqual({
      positionMode: 'before',
      positionReferenceCode: 'trial',
    })
    expect(getPositionDefaults(OTHER_PHASES, 2)).toEqual({
      positionMode: 'after',
      positionReferenceCode: 'standard',
    })
  })
})

describe('buildPhaseInput', () => {
  it('GIVEN overrideEnabled false THEN omits rateOverride entirely', () => {
    const input = buildPhaseInput(
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
    const input = buildPhaseInput(
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
    const input = buildPhaseInput(
      {
        ...baseValues,
        position: 1,
        overrideEnabled: true,
        rateModel: RateCardRateModelEnum.Standard,
        properties: { amount: '10' },
        overrideBillingIntervalCount: '1',
        overrideBillingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
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
    const input = buildPhaseInput(
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
    const input = buildPhaseInput(
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
})
