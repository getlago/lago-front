import { formataAnyToValueForChargeFormArrays, getTrialPeriod } from '../utils'

describe('formattedToValue', () => {
  describe('when toValue is null', () => {
    it('returns null', () => {
      expect(formataAnyToValueForChargeFormArrays(null, '10')).toBeNull()
    })
  })

  describe('when toValue is less than fromValue', () => {
    it('returns fromValue + 1 as a string', () => {
      expect(formataAnyToValueForChargeFormArrays(5, '10')).toBe('11')
    })

    it('handles string numbers', () => {
      expect(formataAnyToValueForChargeFormArrays('5', '10')).toBe('11')
    })
  })

  describe('when toValue equals fromValue', () => {
    it('returns fromValue + 1 as a string', () => {
      expect(formataAnyToValueForChargeFormArrays(10, '10')).toBe('11')
    })

    it('handles string numbers', () => {
      expect(formataAnyToValueForChargeFormArrays('10', '10')).toBe('11')
    })
  })

  describe('when toValue is greater than fromValue', () => {
    it('returns toValue as a string', () => {
      expect(formataAnyToValueForChargeFormArrays(15, '10')).toBe('15')
    })

    it('handles string numbers', () => {
      expect(formataAnyToValueForChargeFormArrays('15', '10')).toBe('15')
    })
  })

  describe('edge cases', () => {
    it('handles undefined toValue', () => {
      expect(formataAnyToValueForChargeFormArrays(undefined, '10')).toBe('11')
    })

    it('handles empty string as toValue', () => {
      expect(formataAnyToValueForChargeFormArrays('', '10')).toBe('11')
    })

    it('handles 0 as toValue when fromValue is 0', () => {
      expect(formataAnyToValueForChargeFormArrays(0, '0')).toBe('1')
    })

    it('handles 0 as toValue when fromValue is greater', () => {
      expect(formataAnyToValueForChargeFormArrays(0, '5')).toBe('6')
    })

    it('handles negative numbers', () => {
      expect(formataAnyToValueForChargeFormArrays(-5, '10')).toBe('11')
    })

    it('handles negative fromValue', () => {
      expect(formataAnyToValueForChargeFormArrays(5, '-10')).toBe('5')
    })

    it('handles decimal numbers', () => {
      expect(formataAnyToValueForChargeFormArrays(10.5, '10')).toBe('10.5')
    })

    it('handles decimal numbers when toValue <= fromValue', () => {
      expect(formataAnyToValueForChargeFormArrays(10.5, '11')).toBe('12')
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
