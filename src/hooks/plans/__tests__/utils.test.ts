import {
  buildRangesForAdd,
  buildRangesForDelete,
  buildRangesForToValueUpdate,
  formataAnyToValueForChargeFormArrays,
  getDecimalStep,
} from '../utils'

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

describe('buildRangesForAdd', () => {
  const defaults = { flatAmount: undefined, perUnitAmount: undefined }

  describe('GIVEN integer ranges', () => {
    it('THEN inserts a new range with step 1 before the last row', () => {
      const ranges = [
        { fromValue: 0, toValue: 1, flatAmount: undefined, perUnitAmount: undefined },
        { fromValue: 2, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
      ]
      const result = buildRangesForAdd(ranges, defaults)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 1 })
      expect(result[1]).toMatchObject({ fromValue: 2, toValue: 3 })
      expect(result[2]).toMatchObject({ fromValue: 4, toValue: null })
    })
  })

  describe('GIVEN decimal ranges with 1 decimal place', () => {
    it('THEN inserts a new range with step 0.1', () => {
      const ranges = [
        { fromValue: 0, toValue: 0.5, flatAmount: undefined, perUnitAmount: undefined },
        { fromValue: 0.6, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
      ]
      const result = buildRangesForAdd(ranges, defaults)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 0.5 })
      expect(result[1]).toMatchObject({ fromValue: 0.6, toValue: 0.7 })
      expect(result[2]).toMatchObject({ fromValue: 0.8, toValue: null })
    })
  })

  describe('GIVEN a single range (addIndex === 0)', () => {
    it('THEN creates new range starting from 0', () => {
      const ranges = [
        { fromValue: 0, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
      ]
      const result = buildRangesForAdd(ranges, defaults)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 1 })
      expect(result[1]).toMatchObject({ fromValue: 2, toValue: null })
    })
  })
})

describe('buildRangesForToValueUpdate', () => {
  describe('GIVEN ranges with stale fromValues from backend (bug regression)', () => {
    describe('WHEN editing a decimal toValue to integer', () => {
      it('THEN ignores stale fromValue precision and uses toValue-based step', () => {
        const ranges = [
          { fromValue: 0, toValue: 1.5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 1.50001, toValue: 3.2, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 3.20001, toValue: 5.3, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 5.30001, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 1)

        expect(result[0].toValue).toBe(1)
        expect(result[1].fromValue).toBe(1.1)
        expect(result[1].toValue).toBe(3.2)
        expect(result[2].fromValue).toBe(3.3)
        expect(result[2].toValue).toBe(5.3)
        expect(result[3].fromValue).toBe(5.4)
        expect(result[3].toValue).toBeNull()
      })
    })
  })

  describe('GIVEN integer ranges updated to decimal', () => {
    describe('WHEN changing toValue from integer to decimal', () => {
      it('THEN switches to decimal step for downstream ranges', () => {
        const ranges = [
          { fromValue: 0, toValue: 1, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 2, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 1.5)

        expect(result[0].toValue).toBe(1.5)
        expect(result[1].fromValue).toBe(1.6)
      })
    })
  })

  describe('GIVEN decimal ranges changed back to integer', () => {
    describe('WHEN all toValues become integers', () => {
      it('THEN switches back to step 1', () => {
        const ranges = [
          { fromValue: 0, toValue: 1.5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 1.6, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 2)

        expect(result[0].toValue).toBe(2)
        expect(result[1].fromValue).toBe(3)
      })
    })
  })
})

describe('buildRangesForDelete', () => {
  describe('GIVEN integer ranges with 3 tiers', () => {
    describe('WHEN deleting the middle tier', () => {
      it('THEN recomputes fromValues and sets last toValue to null', () => {
        const ranges = [
          { fromValue: 0, toValue: 5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 6, toValue: 10, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 11, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForDelete(ranges, 1)

        expect(result).toStrictEqual([
          { fromValue: 0, toValue: 5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 6, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ])
      })
    })
  })

  describe('GIVEN ranges where deleting removes the only decimal toValue', () => {
    describe('WHEN the deleted range had the only decimal toValue', () => {
      it('THEN step reverts to 1 for remaining integer ranges', () => {
        const ranges = [
          { fromValue: 0, toValue: 5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 5.1, toValue: 5.5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 5.6, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForDelete(ranges, 1)

        expect(result[0].toValue).toBe(5)
        expect(result[1].fromValue).toBe(6)
        expect(result[1].toValue).toBeNull()
      })
    })
  })
})
