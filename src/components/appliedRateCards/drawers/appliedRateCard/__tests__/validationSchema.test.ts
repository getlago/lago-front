import { RATE_PHASE_FORM_DEFAULTS } from '../../ratePhase/ratePhaseFormSchema'
import {
  APPLIED_RATE_CARD_FORM_DEFAULTS,
  buildAppliedRateCardFormSchema,
  buildCreateContractAppliedRateCardInput,
  buildCreatePlanAppliedRateCardInput,
} from '../validationSchema'

describe('buildAppliedRateCardFormSchema', () => {
  it('GIVEN the local phases array is non-empty and its last entry is finite THEN validation rejects', () => {
    const schema = buildAppliedRateCardFormSchema()
    const result = schema.safeParse({
      ...APPLIED_RATE_CARD_FORM_DEFAULTS,
      productId: 'p1',
      rateCardId: 'rc1',
      ratePhases: [
        { ...RATE_PHASE_FORM_DEFAULTS, code: 'a', durationType: 'finite', durationCycleCount: '3' },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN the local phases array is empty THEN validation passes (backend default-phase path)', () => {
    const schema = buildAppliedRateCardFormSchema()
    const result = schema.safeParse({
      ...APPLIED_RATE_CARD_FORM_DEFAULTS,
      productId: 'p1',
      rateCardId: 'rc1',
      ratePhases: [],
    })

    expect(result.success).toBe(true)
  })
})

describe('buildCreatePlanAppliedRateCardInput', () => {
  it('GIVEN an empty local phases array THEN omits ratePhases from the input entirely', () => {
    const input = buildCreatePlanAppliedRateCardInput(
      { ...APPLIED_RATE_CARD_FORM_DEFAULTS, productId: 'p1', rateCardId: 'rc1', ratePhases: [] },
      'plan-1',
    )

    expect(input).not.toHaveProperty('ratePhases')
    expect(input).toEqual({ planId: 'plan-1', rateCardCode: 'rc1', units: undefined })
  })

  it('GIVEN a non-empty local phases array THEN maps each phase through buildPhaseInput with its position', () => {
    const input = buildCreatePlanAppliedRateCardInput(
      {
        ...APPLIED_RATE_CARD_FORM_DEFAULTS,
        productId: 'p1',
        rateCardId: 'rc1',
        ratePhases: [{ ...RATE_PHASE_FORM_DEFAULTS, code: 'a' }],
      },
      'plan-1',
    )

    expect(input.ratePhases).toEqual([expect.objectContaining({ code: 'a', position: 1 })])
  })
})

describe('buildCreateContractAppliedRateCardInput', () => {
  it('GIVEN a billingAnchorDate THEN includes it; the input has no effectiveDate field', () => {
    const input = buildCreateContractAppliedRateCardInput(
      {
        ...APPLIED_RATE_CARD_FORM_DEFAULTS,
        productId: 'p1',
        rateCardId: 'rc1',
        billingAnchorDate: '2026-11-01',
        ratePhases: [],
      },
      'contract-1',
    )

    expect(input).toEqual({
      externalId: 'contract-1',
      rateCardCode: 'rc1',
      billingAnchorDate: '2026-11-01',
      units: undefined,
    })
    expect(input).not.toHaveProperty('effectiveDate')
  })
})
