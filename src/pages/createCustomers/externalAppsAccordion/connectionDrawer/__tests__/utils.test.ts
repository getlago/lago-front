import { getSubsidiaryLabel } from '../utils'

describe('getSubsidiaryLabel', () => {
  describe('GIVEN a subsidiary with an external name', () => {
    describe('WHEN building the label', () => {
      it('THEN should combine the name with the id in parentheses', () => {
        expect(getSubsidiaryLabel({ externalName: 'Sub EU', externalId: 'SUB-1' })).toBe(
          'Sub EU (SUB-1)',
        )
      })
    })
  })

  describe('GIVEN a subsidiary without an external name', () => {
    describe('WHEN building the label', () => {
      it.each([
        ['null name', null],
        ['undefined name', undefined],
        ['empty name', ''],
      ])('THEN should fall back to the id alone for a %s', (_, externalName) => {
        expect(getSubsidiaryLabel({ externalName, externalId: 'SUB-1' })).toBe('SUB-1')
      })
    })
  })
})
