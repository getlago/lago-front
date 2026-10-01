import { RateCardRateModelEnum } from '~/generated/graphql'

import { buildGraduatedRanges, buildRateProperties } from '../../../__tests__/fixtures'
import { getRatePropertiesShape } from '../getRatePropertiesShape'
import { serializeRateProperties } from '../serializeRateProperties'

describe('serializeRateProperties', () => {
  describe('GIVEN a graduated rate', () => {
    describe('WHEN its tiers are serialized', () => {
      it('THEN each tier only carries its upper bound and its amounts', () => {
        const payload = serializeRateProperties(
          {
            graduatedRanges: [
              { toValue: '10', perUnitAmount: '5', flatAmount: '' },
              { toValue: null, perUnitAmount: '2', flatAmount: '1e-7' },
            ],
          },
          RateCardRateModelEnum.Graduated,
        )

        expect(payload.graduatedRanges).toEqual([
          { toValue: '10', perUnitAmount: '5', flatAmount: '0' },
          { toValue: null, perUnitAmount: '2', flatAmount: '0.0000001' },
        ])
        expect(payload.graduatedRanges?.[0]).not.toHaveProperty('fromValue')
      })
    })

    describe('WHEN an upper bound is in a transient or long form', () => {
      it.each([
        ['10.50', '10.5'],
        ['10.', '10'],
        ['123456789012345678', '123456789012345678'],
        ['', null],
      ])('THEN %p is sent as %p', (toValue, expected) => {
        const payload = serializeRateProperties(
          {
            graduatedRanges: [
              { toValue, perUnitAmount: '1', flatAmount: '0' },
              { toValue: null, perUnitAmount: '1', flatAmount: '0' },
            ],
          },
          RateCardRateModelEnum.Graduated,
        )

        expect(payload.graduatedRanges?.[0].toValue).toBe(expected)
      })
    })
  })

  describe('GIVEN tier lists left over from another rate model', () => {
    describe('WHEN a volume rate is serialized', () => {
      // A model switch must never ship the previous model's tiers.
      it('THEN only the volume tiers are sent', () => {
        const payload = serializeRateProperties(
          {
            graduatedRanges: [{ toValue: null, perUnitAmount: '1', flatAmount: '0' }],
            volumeRanges: [{ toValue: null, perUnitAmount: '2', flatAmount: '0' }],
          },
          RateCardRateModelEnum.Volume,
        )

        expect(payload.graduatedRanges).toBeUndefined()
        expect(payload.graduatedPercentageRanges).toBeUndefined()
        expect(payload.volumeRanges).toEqual([
          { toValue: null, perUnitAmount: '2', flatAmount: '0' },
        ])
      })
    })
  })

  describe('GIVEN a rate saved before upper-bound-only tiers', () => {
    describe('WHEN it is opened and saved untouched', () => {
      it('THEN the payload carries the loaded upper bounds unchanged', () => {
        const payload = serializeRateProperties(
          getRatePropertiesShape(buildRateProperties({ graduatedRanges: buildGraduatedRanges() })),
          RateCardRateModelEnum.Graduated,
        )

        expect(payload.graduatedRanges).toEqual([
          { toValue: '10', perUnitAmount: '5', flatAmount: '1' },
          { toValue: null, perUnitAmount: '2', flatAmount: '0' },
        ])
      })
    })
  })

  describe('GIVEN a standard rate', () => {
    describe('WHEN it is serialized', () => {
      it('THEN its non-tier fields serialize as the shared serializer does', () => {
        const payload = serializeRateProperties(
          { amount: '12', pricingGroupKeys: ['region'] },
          RateCardRateModelEnum.Standard,
        )

        expect(payload).toMatchObject({ amount: '12', pricingGroupKeys: ['region'] })
        expect(payload.graduatedRanges).toBeUndefined()
      })
    })
  })
})
