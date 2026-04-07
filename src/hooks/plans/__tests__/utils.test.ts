import { formataAnyToValueForChargeFormArrays, getTrialPeriod, isAdjacentModel } from '../utils'

describe('formattedToValue', () => {
  describe('GIVEN toValue is null', () => {
    it('THEN returns null', () => {
      expect(formataAnyToValueForChargeFormArrays(null, 10)).toBeNull()
    })
  })

  describe('GIVEN toValue is less than fromValue', () => {
    it('THEN returns fromValue + 1', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10)).toBe(11)
    })

    it('THEN handles string toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('5', 10)).toBe(11)
    })
  })

  describe('GIVEN toValue equals fromValue', () => {
    it('THEN returns fromValue + 1', () => {
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

describe('getTrialPeriod', () => {
  describe('WHEN trialPeriod is null', () => {
    it('THEN returns 0 when isEdition is true', () => {
      const result = getTrialPeriod(null, true)

      expect(result).toBe(0)
    })

    it('THEN returns undefined when isEdition is false', () => {
      const result = getTrialPeriod(null, false)

      expect(result).toBeUndefined()
    })
  })

  describe('WHEN trialPeriod is undefined', () => {
    it('THEN returns 0 when isEdition is true', () => {
      const result = getTrialPeriod(undefined, true)

      expect(result).toBe(0)
    })

    it('THEN returns undefined when isEdition is false', () => {
      const result = getTrialPeriod(undefined, false)

      expect(result).toBeUndefined()
    })
  })

  describe('WHEN trialPeriod is a number', () => {
    it('THEN returns the trialPeriod value when isEdition is true', () => {
      const result = getTrialPeriod(30, true)

      expect(result).toBe(30)
    })

    it('THEN returns the trialPeriod value when isEdition is false', () => {
      const result = getTrialPeriod(30, false)

      expect(result).toBe(30)
    })

    it('THEN returns 0 when trialPeriod is 0', () => {
      const result = getTrialPeriod(0, true)

      expect(result).toBe(0)
    })

    it('THEN returns positive numbers correctly', () => {
      const result = getTrialPeriod(15, false)

      expect(result).toBe(15)
    })
  })
})

describe('isAdjacentModel', () => {
  describe('GIVEN integer-only ranges', () => {
    it('THEN returns false', () => {
      expect(isAdjacentModel([{ toValue: 1 }, { toValue: 10 }, { toValue: null }])).toBe(false)
    })
  })

  describe('GIVEN any range has a decimal toValue', () => {
    it('THEN returns true', () => {
      expect(isAdjacentModel([{ toValue: 0.1 }, { toValue: 1 }, { toValue: null }])).toBe(true)
    })
  })

  describe('GIVEN an empty array', () => {
    it('THEN returns false', () => {
      expect(isAdjacentModel([])).toBe(false)
    })
  })

  describe('GIVEN all toValues are null', () => {
    it('THEN returns false', () => {
      expect(isAdjacentModel([{ toValue: null }, { toValue: null }])).toBe(false)
    })
  })
})

describe('formattedToValue with adjacent parameter', () => {
  describe('GIVEN toValue is less than fromValue', () => {
    it('THEN returns fromValue + 1 when adjacent is false', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10, false)).toBe(11)
    })

    it('THEN returns fromValue when adjacent is true', () => {
      expect(formataAnyToValueForChargeFormArrays(5, 10, true)).toBe(10)
    })
  })

  describe('GIVEN toValue is null', () => {
    it('THEN returns null regardless of adjacent', () => {
      expect(formataAnyToValueForChargeFormArrays(null, 10, true)).toBeNull()
    })
  })

  describe('GIVEN toValue is greater than fromValue', () => {
    it('THEN returns toValue unchanged when adjacent is false', () => {
      expect(formataAnyToValueForChargeFormArrays(20, 10, false)).toBe(20)
    })

    it('THEN returns toValue unchanged when adjacent is true', () => {
      expect(formataAnyToValueForChargeFormArrays(20, 10, true)).toBe(20)
    })
  })
})

describe('getTrialPeriod', () => {
  describe('WHEN trialPeriod is null', () => {
    it('THEN returns 0 when isEdition is true', () => {
      const result = getTrialPeriod(null, true)

      expect(result).toBe(0)
    })

    it('THEN returns undefined when isEdition is false', () => {
      const result = getTrialPeriod(null, false)

      expect(result).toBeUndefined()
    })
  })

  describe('WHEN trialPeriod is undefined', () => {
    it('THEN returns 0 when isEdition is true', () => {
      const result = getTrialPeriod(undefined, true)

      expect(result).toBe(0)
    })

    it('THEN returns undefined when isEdition is false', () => {
      const result = getTrialPeriod(undefined, false)

      expect(result).toBeUndefined()
    })
  })

  describe('WHEN trialPeriod is a number', () => {
    it('THEN returns the trialPeriod value when isEdition is true', () => {
      const result = getTrialPeriod(30, true)

      expect(result).toBe(30)
    })

    it('THEN returns the trialPeriod value when isEdition is false', () => {
      const result = getTrialPeriod(30, false)

      expect(result).toBe(30)
    })

    it('THEN returns 0 when trialPeriod is 0', () => {
      const result = getTrialPeriod(0, true)

      expect(result).toBe(0)
    })

    it('THEN returns positive numbers correctly', () => {
      const result = getTrialPeriod(15, false)

      expect(result).toBe(15)
    })
  })
})
