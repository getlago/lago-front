import { formatAnyToValueForChargeFormArrays } from '../utils'

describe('formattedToValue', () => {
  describe('GIVEN toValue is null', () => {
    it('THEN returns null', () => {
      expect(formatAnyToValueForChargeFormArrays(null, 10)).toBeNull()
    })
  })

  describe('GIVEN toValue is less than fromValue', () => {
    it('THEN returns fromValue + 1', () => {
      expect(formatAnyToValueForChargeFormArrays(5, 10)).toBe(11)
    })

    it('THEN handles string toValue', () => {
      expect(formatAnyToValueForChargeFormArrays('5', 10)).toBe(11)
    })
  })

  describe('GIVEN toValue equals fromValue', () => {
    it('THEN returns fromValue + 1', () => {
      expect(formatAnyToValueForChargeFormArrays(10, 10)).toBe(11)
    })

    it('THEN handles string toValue', () => {
      expect(formatAnyToValueForChargeFormArrays('10', 10)).toBe(11)
    })
  })

  describe('GIVEN toValue is greater than fromValue', () => {
    it('THEN returns toValue as a number', () => {
      expect(formatAnyToValueForChargeFormArrays(15, 10)).toBe(15)
    })

    it('THEN handles string toValue', () => {
      expect(formatAnyToValueForChargeFormArrays('15', 10)).toBe(15)
    })
  })

  describe('GIVEN edge cases', () => {
    it('THEN handles undefined toValue', () => {
      expect(formatAnyToValueForChargeFormArrays(undefined, 10)).toBe(11)
    })

    it('THEN handles empty string as toValue', () => {
      expect(formatAnyToValueForChargeFormArrays('', 10)).toBe(11)
    })

    it('THEN handles 0 as toValue when fromValue is 0', () => {
      expect(formatAnyToValueForChargeFormArrays(0, 0)).toBe(1)
    })

    it('THEN handles 0 as toValue when fromValue is greater', () => {
      expect(formatAnyToValueForChargeFormArrays(0, 5)).toBe(6)
    })

    it('THEN handles negative numbers', () => {
      expect(formatAnyToValueForChargeFormArrays(-5, 10)).toBe(11)
    })

    it('THEN handles negative fromValue', () => {
      expect(formatAnyToValueForChargeFormArrays(5, -10)).toBe(5)
    })

    it('THEN handles decimal numbers', () => {
      expect(formatAnyToValueForChargeFormArrays(10.5, 10)).toBe(10.5)
    })

    it('THEN handles decimal numbers when toValue <= fromValue', () => {
      expect(formatAnyToValueForChargeFormArrays(10.5, 11)).toBe(12)
    })

    it('THEN handles string fromValue', () => {
      expect(formatAnyToValueForChargeFormArrays(5, '10')).toBe(11)
    })
  })
})
