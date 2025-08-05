import { formatCityStateZipcodeString } from '~/core/formats/formatAddress'

describe('formatCityStateZipcodeString', () => {
  describe('when all parameters are provided', () => {
    it('should format city, state, and zipcode correctly', () => {
      const result = formatCityStateZipcodeString({
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
      })

      expect(result).toBe('New York, NY 10001')
    })
  })

  describe('when only city is provided', () => {
    it('should return only the city', () => {
      const result = formatCityStateZipcodeString({
        city: 'New York',
        state: null,
        zipcode: undefined,
      })

      expect(result).toBe('New York')
    })
  })

  describe('when only state is provided', () => {
    it('should return only the state', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: 'NY',
        zipcode: undefined,
      })

      expect(result).toBe('NY')
    })
  })

  describe('when only zipcode is provided', () => {
    it('should return only the zipcode', () => {
      const result = formatCityStateZipcodeString({
        city: undefined,
        state: null,
        zipcode: '10001',
      })

      expect(result).toBe('10001')
    })
  })

  describe('when city and state are provided', () => {
    it('should format city and state correctly', () => {
      const result = formatCityStateZipcodeString({
        city: 'Los Angeles',
        state: 'CA',
        zipcode: null,
      })

      expect(result).toBe('Los Angeles, CA')
    })
  })

  describe('when city and zipcode are provided', () => {
    it('should format city and zipcode correctly', () => {
      const result = formatCityStateZipcodeString({
        city: 'Chicago',
        state: undefined,
        zipcode: '60601',
      })

      expect(result).toBe('Chicago, 60601')
    })
  })

  describe('when state and zipcode are provided', () => {
    it('should format state and zipcode correctly', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: 'TX',
        zipcode: '75001',
      })

      expect(result).toBe('TX 75001')
    })
  })

  describe('when no parameters are provided', () => {
    it('should return an empty string', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: null,
        zipcode: null,
      })

      expect(result).toBe('')
    })

    it('should return an empty string for undefined values', () => {
      const result = formatCityStateZipcodeString({
        city: undefined,
        state: undefined,
        zipcode: undefined,
      })

      expect(result).toBe('')
    })
  })

  describe('when empty strings are provided', () => {
    it('should treat empty strings as falsy and not include them', () => {
      const result = formatCityStateZipcodeString({
        city: '',
        state: '',
        zipcode: '',
      })

      expect(result).toBe('')
    })

    it('should handle mixed empty strings and valid values', () => {
      const result = formatCityStateZipcodeString({
        city: '',
        state: 'FL',
        zipcode: '33101',
      })

      expect(result).toBe('FL 33101')
    })
  })

  describe('edge cases', () => {
    it('should handle city with special characters', () => {
      const result = formatCityStateZipcodeString({
        city: "St. John's",
        state: 'NL',
        zipcode: 'A1A 1A1',
      })

      expect(result).toBe("St. John's, NL A1A 1A1")
    })

    it('should handle only whitespace strings as falsy', () => {
      const result = formatCityStateZipcodeString({
        city: '   ',
        state: 'CA',
        zipcode: '90210',
      })

      expect(result).toBe('CA 90210')
    })
  })
})
