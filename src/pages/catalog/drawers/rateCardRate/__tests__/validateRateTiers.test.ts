import { z } from 'zod'

import { RateCardRateModelEnum, RatePropertiesInput } from '~/generated/graphql'

import { RATE_TIER_UP_TO_ERROR_KEY, TieredRateModel } from '../../../rateProperties/tiers/rateTiers'
import { VALUE_REQUIRED_KEY } from '../constants'
import { validateRateTiers } from '../validateRateTiers'

const parse = (rateModel: TieredRateModel, properties: RatePropertiesInput | undefined) =>
  z
    .custom<RatePropertiesInput | undefined>()
    .superRefine((value, ctx) => validateRateTiers(rateModel, value, ctx))
    .safeParse(properties)

const issues = (result: ReturnType<typeof parse>): string[][] =>
  result.success ? [] : result.error.issues.map((issue) => [issue.path.join('.'), issue.message])

const graduated = (...toValues: (string | null)[]): RatePropertiesInput => ({
  graduatedRanges: toValues.map((toValue) => ({ toValue, perUnitAmount: '1', flatAmount: '0' })),
})

describe('validateRateTiers', () => {
  describe('GIVEN graduated tiers', () => {
    describe('WHEN every upper bound rises', () => {
      it('THEN accepts decimals and a trailing dot', () => {
        expect(parse(RateCardRateModelEnum.Graduated, graduated('10.', '20.5', null)).success).toBe(
          true,
        )
      })
    })

    describe('WHEN the list is empty', () => {
      it('THEN flags the list', () => {
        expect(issues(parse(RateCardRateModelEnum.Graduated, { graduatedRanges: [] }))).toEqual([
          ['properties.graduatedRanges', VALUE_REQUIRED_KEY],
        ])
      })
    })

    describe('WHEN a bound is not above the previous one', () => {
      it.each([
        ['0', '20', 0],
        ['10', '10', 1],
        ['10', '5', 1],
      ])('THEN %p then %p flags tier %p', (first, second, flaggedIndex) => {
        expect(
          issues(parse(RateCardRateModelEnum.Graduated, graduated(first, second, null))),
        ).toEqual([
          [`properties.graduatedRanges.${flaggedIndex}.toValue`, RATE_TIER_UP_TO_ERROR_KEY],
        ])
      })
    })

    describe('WHEN a bound is empty or not a number', () => {
      it.each(['', '.'])('THEN %p is flagged without throwing', (toValue) => {
        expect(issues(parse(RateCardRateModelEnum.Graduated, graduated(toValue, null)))).toEqual([
          ['properties.graduatedRanges.0.toValue', RATE_TIER_UP_TO_ERROR_KEY],
        ])
      })
    })

    describe('WHEN a tier has neither a per unit amount nor a flat fee', () => {
      it('THEN flags both amounts', () => {
        expect(
          issues(
            parse(RateCardRateModelEnum.Graduated, {
              graduatedRanges: [{ toValue: null, perUnitAmount: '', flatAmount: '' }],
            }),
          ),
        ).toEqual([
          ['properties.graduatedRanges.0.perUnitAmount', VALUE_REQUIRED_KEY],
          ['properties.graduatedRanges.0.flatAmount', VALUE_REQUIRED_KEY],
        ])
      })
    })
  })

  describe('GIVEN volume tiers', () => {
    describe('WHEN a bound repeats', () => {
      it('THEN flags it on the volume list', () => {
        expect(
          issues(
            parse(RateCardRateModelEnum.Volume, {
              volumeRanges: [
                { toValue: '10', perUnitAmount: '1', flatAmount: '0' },
                { toValue: '10', perUnitAmount: '1', flatAmount: '0' },
                { toValue: null, perUnitAmount: '1', flatAmount: '0' },
              ],
            }),
          ),
        ).toEqual([['properties.volumeRanges.1.toValue', RATE_TIER_UP_TO_ERROR_KEY]])
      })
    })
  })

  describe('GIVEN graduated percentage tiers', () => {
    describe('WHEN a rate is missing', () => {
      it('THEN flags the rate only', () => {
        expect(
          issues(
            parse(RateCardRateModelEnum.GraduatedPercentage, {
              graduatedPercentageRanges: [
                { toValue: '10', rate: '', flatAmount: '' },
                { toValue: null, rate: '2', flatAmount: '' },
              ],
            }),
          ),
        ).toEqual([['properties.graduatedPercentageRanges.0.rate', VALUE_REQUIRED_KEY]])
      })
    })
  })
})
