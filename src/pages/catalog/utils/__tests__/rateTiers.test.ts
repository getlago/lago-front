import { buildRateProperties } from '../../__tests__/fixtures'
import { toChargeProperties, toRatePropertiesInput } from '../rateTiers'

describe('toChargeProperties', () => {
  describe('GIVEN rate tiers that only name their upper bound', () => {
    describe('WHEN they are handed to the shared charge components', () => {
      it('THEN each tier starts where the previous one ends', () => {
        const properties = toChargeProperties(
          buildRateProperties({
            graduatedRanges: [
              { __typename: 'RateTier', toValue: '10', flatAmount: '1', perUnitAmount: '2' },
              { __typename: 'RateTier', toValue: null, flatAmount: '0', perUnitAmount: '1' },
            ],
          }),
        )

        expect(properties.__typename).toBe('Properties')
        expect(properties.graduatedRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '1', perUnitAmount: '2' },
          { fromValue: 10, toValue: null, flatAmount: '0', perUnitAmount: '1' },
        ])
      })
    })
  })
})

describe('toRatePropertiesInput', () => {
  describe('GIVEN form ranges carrying both bounds', () => {
    describe('WHEN they are sent to the API', () => {
      it('THEN only the upper bound is kept, as a string', () => {
        const input = toRatePropertiesInput({
          amount: '1',
          graduatedPercentageRanges: [
            { fromValue: 0, toValue: 0.5, flatAmount: '0', rate: '1' },
            { fromValue: 0.5, toValue: null, flatAmount: '0', rate: '2' },
          ],
        })

        expect(input.amount).toBe('1')
        expect(input.graduatedPercentageRanges).toEqual([
          { toValue: '0.5', flatAmount: '0', rate: '1' },
          { toValue: null, flatAmount: '0', rate: '2' },
        ])
        expect(input.graduatedRanges).toBeUndefined()
      })
    })
  })
})
