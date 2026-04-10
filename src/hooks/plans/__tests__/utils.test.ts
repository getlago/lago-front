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
    it('THEN returns 1 (integer +1 model)', () => {
      expect(getDecimalStep([{ toValue: 1 }, { toValue: 10 }, { toValue: null }])).toBe(1)
    })
  })

  describe('GIVEN any range has a decimal toValue', () => {
    it('THEN returns 0 (adjacent model)', () => {
      expect(getDecimalStep([{ toValue: 0.1 }, { toValue: 1 }, { toValue: null }])).toBe(0)
    })
  })

  describe('GIVEN ranges with mixed integer and decimal toValues', () => {
    it('THEN returns 0 (adjacent model — any decimal triggers it)', () => {
      expect(getDecimalStep([{ toValue: 5 }, { toValue: 0.5 }, { toValue: null }])).toBe(0)
    })
  })

  describe('GIVEN decimal fromValue values but integer toValues', () => {
    it('THEN returns 1 (ignores fromValue, only checks toValue)', () => {
      expect(getDecimalStep([{ fromValue: 0.001, toValue: 1 }, { toValue: null }])).toBe(1)
    })
  })

  describe('GIVEN stale fromValue with many decimal places', () => {
    it('THEN returns 0 based on decimal toValues only', () => {
      expect(
        getDecimalStep([
          { fromValue: 0, toValue: 1 },
          { fromValue: 1.50001, toValue: 3.2 },
          { fromValue: 3.20001, toValue: 5.3 },
          { fromValue: 5.30001, toValue: null },
        ]),
      ).toBe(0)
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
    it('THEN returns fromValue + step when step is 1', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10, 1)).toBe(11)
    })

    it('THEN returns fromValue when step is 0 (adjacent model)', () => {
      expect(formataAnyToValueForChargeFormArrays(0.1, 0.3, 0)).toBe(0.3)
    })
  })

  describe('GIVEN toValue is null', () => {
    it('THEN returns null regardless of step', () => {
      expect(formataAnyToValueForChargeFormArrays(null, 10, 0)).toBeNull()
    })
  })

  describe('GIVEN toValue is greater than fromValue', () => {
    it('THEN returns toValue unchanged when step is 1', () => {
      expect(formataAnyToValueForChargeFormArrays(20, 10, 1)).toBe(20)
    })

    it('THEN returns toValue unchanged when step is 0', () => {
      expect(formataAnyToValueForChargeFormArrays(0.5, 0.3, 0)).toBe(0.5)
    })
  })
})

describe('buildRangesForAdd', () => {
  const defaults = { flatAmount: undefined, perUnitAmount: undefined }

  describe('GIVEN integer ranges', () => {
    it('THEN inserts a new range with +1 gap', () => {
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

  describe('GIVEN decimal ranges (adjacent model)', () => {
    it('THEN inserts a new range with adjacent from and +1 default toValue', () => {
      const ranges = [
        { fromValue: 0, toValue: 0.5, flatAmount: undefined, perUnitAmount: undefined },
        { fromValue: 0.5, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
      ]
      const result = buildRangesForAdd(ranges, defaults)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 0.5 })
      // Adjacent: new from = previous to = 0.5, new to = 0.5 + 1 = 1.5
      expect(result[1]).toMatchObject({ fromValue: 0.5, toValue: 1.5 })
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
  describe('GIVEN ranges with stale fromValues from backend', () => {
    describe('WHEN editing a decimal toValue to integer', () => {
      it('THEN uses adjacent model (step=0) since other toValues are still decimal', () => {
        const ranges = [
          { fromValue: 0, toValue: 1.5 },
          { fromValue: 1.50001, toValue: 3.2 },
          { fromValue: 3.20001, toValue: 5.3 },
          { fromValue: 5.30001, toValue: null },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 1)

        // step=0 (adjacent) because toValues 1, 3.2, 5.3 still have decimals
        expect(result[0].toValue).toBe(1)
        expect(result[1].fromValue).toBe(1) // adjacent: from = previous to
        expect(result[1].toValue).toBe(3.2)
        expect(result[2].fromValue).toBe(3.2)
        expect(result[2].toValue).toBe(5.3)
        expect(result[3].fromValue).toBe(5.3)
        expect(result[3].toValue).toBeNull()
      })
    })
  })

  describe('GIVEN integer ranges updated to decimal', () => {
    describe('WHEN changing toValue from integer to decimal', () => {
      it('THEN switches to adjacent model (step=0)', () => {
        const ranges = [
          { fromValue: 0, toValue: 1 },
          { fromValue: 2, toValue: null },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 1.5)

        expect(result[0].toValue).toBe(1.5)
        expect(result[1].fromValue).toBe(1.5) // adjacent: from = previous to
      })
    })
  })

  describe('GIVEN decimal ranges changed back to integer', () => {
    describe('WHEN all toValues become integers', () => {
      it('THEN switches back to integer model (step=1)', () => {
        const ranges = [
          { fromValue: 0, toValue: 1.5 },
          { fromValue: 1.5, toValue: null },
        ]
        const result = buildRangesForToValueUpdate(ranges, 0, 2)

        expect(result[0].toValue).toBe(2)
        expect(result[1].fromValue).toBe(3) // integer: from = previous to + 1
      })
    })
  })

  describe('GIVEN editing the last decimal (step changes) with ranges before', () => {
    it('THEN should recompute fromValues for ALL ranges using new step', () => {
      const ranges = [
        { fromValue: 0, toValue: 1 },
        { fromValue: 1, toValue: 3 },
        { fromValue: 3, toValue: 5 },
        { fromValue: 5, toValue: 5.3 },
        { fromValue: 5.3, toValue: null },
      ]
      // Edit range 3 to=5.3→5 → all toValues integers → step=1
      const result = buildRangesForToValueUpdate(ranges, 3, 5)

      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 1 })
      expect(result[1].fromValue).toBe(2) // was 1, now recomputed: 1+1=2
      expect(result[1].toValue).toBe(3)
      expect(result[2].fromValue).toBe(4) // was 3, now recomputed: 3+1=4
      expect(result[2].toValue).toBe(5)
      expect(result[3].fromValue).toBe(6) // recomputed: 5+1=6
      expect(result[3].toValue).toBe(5) // user's raw value accepted (no auto-fill)
    })
  })

  describe('GIVEN the edited range is range 0', () => {
    it('THEN should always keep fromValue as 0', () => {
      const ranges = [
        { fromValue: 0, toValue: 5 },
        { fromValue: 6, toValue: null },
      ]
      const result = buildRangesForToValueUpdate(ranges, 0, 3)

      expect(result[0].fromValue).toBe(0)
      expect(result[0].toValue).toBe(3)
    })
  })

  describe('GIVEN editing a middle range where toValue is still valid', () => {
    it('THEN should keep the user value when toValue > recomputed fromValue', () => {
      const ranges = [
        { fromValue: 0, toValue: 2 },
        { fromValue: 2, toValue: 6.3 },
        { fromValue: 6.3, toValue: null },
      ]
      // User changes range 1 toValue from 6.3 to 5 → all integers → step=1
      const result = buildRangesForToValueUpdate(ranges, 1, 5)

      expect(result[1].fromValue).toBe(3)
      expect(result[1].toValue).toBe(5)
    })
  })

  describe('GIVEN the user clears a cell', () => {
    it('THEN should accept 0 without auto-filling', () => {
      const ranges = [
        { fromValue: 0, toValue: 5 },
        { fromValue: 6, toValue: 10 },
        { fromValue: 11, toValue: null },
      ]
      const result = buildRangesForToValueUpdate(ranges, 1, '')

      expect(result[1].toValue).toBe(0)
    })
  })

  describe('GIVEN the backend-matching adjacent format', () => {
    it('THEN should produce ranges the backend accepts', () => {
      // Simulate creating ranges with decimal toValues
      const ranges = [
        { fromValue: 0, toValue: 1.1 },
        { fromValue: 1.1, toValue: 3.1 },
        { fromValue: 3.1, toValue: 5 },
        { fromValue: 5, toValue: null },
      ]
      // Edit range 0 to keep 1.1 — verify adjacent fromValues
      const result = buildRangesForToValueUpdate(ranges, 0, 1.1)

      // Adjacent model: from[i+1] = to[i]
      expect(result[0]).toMatchObject({ fromValue: 0, toValue: 1.1 })
      expect(result[1].fromValue).toBe(1.1)
      expect(result[2].fromValue).toBe(3.1)
      expect(result[3].fromValue).toBe(5)
    })
  })
})

describe('buildRangesForDelete', () => {
  describe('GIVEN integer ranges with 3 tiers', () => {
    describe('WHEN deleting the middle tier', () => {
      it('THEN recomputes fromValues with integer step', () => {
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
          { fromValue: 5, toValue: 5.5, flatAmount: undefined, perUnitAmount: undefined },
          { fromValue: 5.5, toValue: null, flatAmount: undefined, perUnitAmount: undefined },
        ]
        const result = buildRangesForDelete(ranges, 1)

        expect(result[0].toValue).toBe(5)
        expect(result[1].fromValue).toBe(6) // integer step: 5+1=6
        expect(result[1].toValue).toBeNull()
      })
    })
  })
})
