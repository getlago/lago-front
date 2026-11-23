import { CurrencyEnum, ProductTypeEnum } from '~/generated/graphql'

import { RATE_PHASE_FORM_DEFAULTS } from '../../ratePhase/ratePhaseFormSchema'
import {
  APPLIED_RATE_CARD_FORM_DEFAULTS,
  buildAppliedRateCardFormSchema,
  mapFromFormToApi,
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

  it('GIVEN a fixed product AND units is left blank THEN validation rejects', () => {
    const schema = buildAppliedRateCardFormSchema()
    const result = schema.safeParse({
      ...APPLIED_RATE_CARD_FORM_DEFAULTS,
      productId: 'p1',
      productType: ProductTypeEnum.Fixed,
      rateCardId: 'rc1',
      units: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('GIVEN a fixed product AND units is set THEN validation passes', () => {
    const schema = buildAppliedRateCardFormSchema()
    const result = schema.safeParse({
      ...APPLIED_RATE_CARD_FORM_DEFAULTS,
      productId: 'p1',
      productType: ProductTypeEnum.Fixed,
      rateCardId: 'rc1',
      units: '5',
    })

    expect(result.success).toBe(true)
  })

  it('GIVEN a metered product AND units is left blank THEN validation still passes', () => {
    const schema = buildAppliedRateCardFormSchema()
    const result = schema.safeParse({
      ...APPLIED_RATE_CARD_FORM_DEFAULTS,
      productId: 'p1',
      productType: ProductTypeEnum.Metered,
      rateCardId: 'rc1',
      units: '',
    })

    expect(result.success).toBe(true)
  })
})

describe('mapFromFormToApi', () => {
  it('GIVEN an empty local phases array THEN omits ratePhases from the input entirely', () => {
    const input = mapFromFormToApi(
      { ...APPLIED_RATE_CARD_FORM_DEFAULTS, productId: 'p1', rateCardId: 'rc1', ratePhases: [] },
      CurrencyEnum.Usd,
    )

    expect(input).toEqual({ rateCardCode: 'rc1' })
  })

  it('GIVEN a non-empty local phases array THEN maps each phase with its position', () => {
    const input = mapFromFormToApi(
      {
        ...APPLIED_RATE_CARD_FORM_DEFAULTS,
        productId: 'p1',
        rateCardId: 'rc1',
        ratePhases: [{ ...RATE_PHASE_FORM_DEFAULTS, code: 'a' }],
      },
      CurrencyEnum.Usd,
    )

    expect(input.ratePhases).toEqual([expect.objectContaining({ code: 'a', position: 1 })])
  })

  it('GIVEN units is blank THEN omits units from the input entirely', () => {
    const input = mapFromFormToApi(
      { ...APPLIED_RATE_CARD_FORM_DEFAULTS, productId: 'p1', rateCardId: 'rc1', units: '   ' },
      CurrencyEnum.Usd,
    )

    expect(input).not.toHaveProperty('units')
  })

  it('GIVEN units has surrounding whitespace THEN sends it trimmed and converted to a number', () => {
    const input = mapFromFormToApi(
      { ...APPLIED_RATE_CARD_FORM_DEFAULTS, productId: 'p1', rateCardId: 'rc1', units: '  5  ' },
      CurrencyEnum.Usd,
    )

    expect(input.units).toBe(5)
  })

  it('GIVEN an overridden phase THEN serializes its spending minimum in the given currency', () => {
    const input = mapFromFormToApi(
      {
        ...APPLIED_RATE_CARD_FORM_DEFAULTS,
        productId: 'p1',
        rateCardId: 'rc1',
        ratePhases: [
          {
            ...RATE_PHASE_FORM_DEFAULTS,
            code: 'a',
            overrideEnabled: true,
            properties: { amount: '10' },
            minAmountCents: '5',
          },
        ],
      },
      CurrencyEnum.Jpy,
    )

    expect(input.ratePhases?.[0].rateOverride?.minAmountCents).toBe(5)
  })
})
