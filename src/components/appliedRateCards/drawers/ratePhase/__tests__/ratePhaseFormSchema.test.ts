import { RateCardBillingTimingEnum, RateCardRateModelEnum } from '~/generated/graphql'

import {
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

  it.each([[''], ['0']])(
    'GIVEN overrideEnabled true AND billingIntervalCount %p THEN rejects it',
    (billingIntervalCount) => {
      const schema = buildRatePhaseFormSchema(() => baseContext)
      const result = schema.safeParse({
        ...baseValues,
        overrideEnabled: true,
        rateModel: RateCardRateModelEnum.Standard,
        properties: { amount: '10' },
        billingIntervalCount,
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
        'billingIntervalCount',
      ])
    },
  )

  it('GIVEN overrideEnabled false AND a blank billingIntervalCount THEN accepts, it is not sent', () => {
    const schema = buildRatePhaseFormSchema(() => baseContext)
    const result = schema.safeParse({ ...baseValues, billingIntervalCount: '' })

    expect(result.success).toBe(true)
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
