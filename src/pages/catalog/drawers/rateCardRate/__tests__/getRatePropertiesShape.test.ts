import { buildGraduatedRanges, buildRateProperties } from '../../../__tests__/fixtures'
import { getRatePropertiesShape } from '../getRatePropertiesShape'

describe('getRatePropertiesShape', () => {
  describe('GIVEN rate properties loaded from the API', () => {
    describe('WHEN they are shaped for the form', () => {
      it('THEN tiers keep their upper bound and lose their typename', () => {
        const shape = getRatePropertiesShape(
          buildRateProperties({ graduatedRanges: buildGraduatedRanges() }),
        )

        expect(shape.graduatedRanges).toEqual([
          { toValue: '10', perUnitAmount: '5', flatAmount: '1' },
          { toValue: null, perUnitAmount: '2', flatAmount: '0' },
        ])
        expect(shape).not.toHaveProperty('__typename')
      })

      it('THEN non-tier fields keep the shared defaults', () => {
        const shape = getRatePropertiesShape(buildRateProperties({ amount: '10' }))

        expect(shape.amount).toBe('10')
        expect(shape.packageSize).toBe(10)
        expect(shape.pricingGroupKeys).toEqual([])
      })
    })
  })

  describe('GIVEN no rate properties', () => {
    describe('WHEN the empty shape is built', () => {
      it('THEN every tier list is left unset', () => {
        const shape = getRatePropertiesShape()

        expect(shape.graduatedRanges).toBeUndefined()
        expect(shape.volumeRanges).toBeUndefined()
        expect(shape.graduatedPercentageRanges).toBeUndefined()
      })
    })
  })
})
