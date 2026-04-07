import { formataAnyToValueForChargeFormArrays, getDecimalStep } from '../utils'

describe('formattedToValue', () => {
  describe('GIVEN toValue is null', () => {
    it('THEN returns null', () => {
      expect(formataAnyToValueForChargeFormArrays(null, 10)).toBeNull()
    })
  })

  describe('GIVEN toValue is less than fromValue', () => {
    it('THEN returns fromValue + 1 (default step)', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10)).toBe(11)
    })

    it('THEN handles string toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('5', 10)).toBe(11)
    })
  })

  describe('GIVEN toValue equals fromValue', () => {
    it('THEN returns fromValue + 1 (default step)', () => {
      expect(formataAnyToValueForChargeFormArrays(10, 10)).toBe(11)
    })

    it('THEN handles string toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('10', 10)).toBe(11)
    })
  })

  describe('GIVEN toValue is greater than fromValue', () => {
    it('THEN returns toValue as a number', () => {
      expect(formataAnyToValueForChargeFormArrays(15, 10)).toBe(15)
    })

    it('THEN handles string toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('15', 10)).toBe(15)
    })
  })

  describe('GIVEN edge cases', () => {
    it('THEN handles undefined toValue', () => {
      expect(formataAnyToValueForChargeFormArrays(undefined, 10)).toBe(11)
    })

    it('THEN handles empty string as toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('', 10)).toBe(11)
    })

    it('THEN handles 0 as toValue when fromValue is 0', () => {
      expect(formataAnyToValueForChargeFormArrays(0, 0)).toBe(1)
    })

    it('THEN handles 0 as toValue when fromValue is greater', () => {
      expect(formataAnyToValueForChargeFormArrays(0, 5)).toBe(6)
    })

    it('THEN handles negative numbers', () => {
      expect(formataAnyToValueForChargeFormArrays(-5, 10)).toBe(11)
    })

    it('THEN handles negative fromValue', () => {
      expect(formataAnyToValueForChargeFormArrays(5, -10)).toBe(5)
    })

    it('THEN handles decimal numbers', () => {
      expect(formataAnyToValueForChargeFormArrays(10.5, 10)).toBe(10.5)
    })

    it('THEN handles decimal numbers when toValue <= fromValue', () => {
      expect(formataAnyToValueForChargeFormArrays(10.5, 11)).toBe(12)
    })

    it('THEN handles string fromValue', () => {
      expect(formataAnyToValueForChargeFormArrays(5, '10')).toBe(11)
    })
  })
})

describe('getDecimalStep', () => {
  describe('GIVEN integer-only ranges', () => {
    it('THEN returns 1', () => {
      expect(getDecimalStep([{ toValue: 1 }, { toValue: 10 }, { toValue: null }])).toBe(1)
    })
  })

  describe('GIVEN ranges with 1 decimal place', () => {
    it('THEN returns 0.1', () => {
      expect(getDecimalStep([{ toValue: 0.1 }, { toValue: 1 }, { toValue: null }])).toBe(0.1)
    })
  })

  describe('GIVEN ranges with 2 decimal places', () => {
    it('THEN returns 0.01', () => {
      expect(getDecimalStep([{ toValue: 0.01 }, { toValue: 0.02 }, { toValue: null }])).toBe(0.01)
    })
  })

  describe('GIVEN ranges with 3 decimal places', () => {
    it('THEN returns 0.001', () => {
      expect(getDecimalStep([{ toValue: 0.001 }, { toValue: 0.002 }, { toValue: null }])).toBe(
        0.001,
      )
    })
  })

  describe('GIVEN ranges with mixed decimal places', () => {
    it('THEN returns the smallest step based on max precision', () => {
      expect(getDecimalStep([{ toValue: 0.1 }, { toValue: 0.02 }, { toValue: null }])).toBe(0.01)
    })
  })

  describe('GIVEN decimal fromValue values but integer toValues', () => {
    it('THEN ignores fromValue precision (derived values should not affect step)', () => {
      expect(getDecimalStep([{ fromValue: 0.001, toValue: 1 }, { toValue: null }])).toBe(1)
    })
  })

  describe('GIVEN stale fromValue with many decimal places', () => {
    it('THEN step is based only on toValue precision', () => {
      expect(
        getDecimalStep([
          { fromValue: 0, toValue: 1 },
          { fromValue: 1.50001, toValue: 3.2 },
          { fromValue: 3.20001, toValue: 5.3 },
          { fromValue: 5.30001, toValue: null },
        ]),
      ).toBe(0.1)
    })
  })

  describe('GIVEN an empty array', () => {
    it('THEN returns 1', () => {
      expect(getDecimalStep([])).toBe(1)
    })
  })

  describe('GIVEN all toValues are null', () => {
    it('THEN returns 1', () => {
      expect(getDecimalStep([{ toValue: null }, { toValue: null }])).toBe(1)
    })
  })
})

describe('formattedToValue with step parameter', () => {
  describe('GIVEN toValue is less than fromValue', () => {
    it('THEN returns fromValue + 1 when step is 1', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10, 1)).toBe(11)
    })

    it('THEN returns fromValue + 0.1 when step is 0.1', () => {
      expect(formataAnyToValueForChargeFormArrays(0.1, 0.3, 0.1)).toBe(0.4)
    })

    it('THEN returns fromValue + 0.01 when step is 0.01', () => {
      expect(formataAnyToValueForChargeFormArrays(0.01, 0.03, 0.01)).toBe(0.04)
    })
  })

  describe('GIVEN toValue is null', () => {
    it('THEN returns null regardless of step', () => {
      expect(formataAnyToValueForChargeFormArrays(null, 10, 0.1)).toBeNull()
    })
  })

  describe('GIVEN toValue is greater than fromValue', () => {
    it('THEN returns toValue unchanged when step is 1', () => {
      expect(formataAnyToValueForChargeFormArrays(20, 10, 1)).toBe(20)
    })

    it('THEN returns toValue unchanged when step is 0.1', () => {
      expect(formataAnyToValueForChargeFormArrays(0.5, 0.3, 0.1)).toBe(0.5)
    })
  })
})
