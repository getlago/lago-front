import { formatCityStateZipcodeString } from '~/core/formats/formatAddress'
import { LocaleEnum } from '~/core/translations'

describe('formatCityStateZipcodeString', () => {
  describe('German locale (de)', () => {
    it('should format with zipcode first, then city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Berlin',
        state: 'Berlin',
        zipcode: '10115',
        locale: LocaleEnum.de,
      })

      expect(result).toBe('10115 Berlin')
    })

    it('should handle missing zipcode', () => {
      const result = formatCityStateZipcodeString({
        city: 'Munich',
        state: 'Bavaria',
        zipcode: null,
        locale: LocaleEnum.de,
      })

      expect(result).toBe('Munich')
    })

    it('should handle missing city', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: 'Bavaria',
        zipcode: '80331',
        locale: LocaleEnum.de,
      })

      expect(result).toBe('80331')
    })
  })

  describe('English locale (en)', () => {
    it('should format with city, comma, state, and zipcode', () => {
      const result = formatCityStateZipcodeString({
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        locale: LocaleEnum.en,
      })

      expect(result).toBe('New York, NY 10001')
    })

    it('should handle missing state - comma should appear', () => {
      const result = formatCityStateZipcodeString({
        city: 'Boston',
        state: null,
        zipcode: '02101',
        locale: LocaleEnum.en,
      })

      expect(result).toBe('Boston, 02101')
    })

    it('should handle missing zipcode - comma should still appear', () => {
      const result = formatCityStateZipcodeString({
        city: 'Chicago',
        state: 'IL',
        zipcode: null,
        locale: LocaleEnum.en,
      })

      expect(result).toBe('Chicago, IL')
    })

    it('should handle only city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Seattle',
        state: null,
        zipcode: null,
        locale: LocaleEnum.en,
      })

      expect(result).toBe('Seattle')
    })
  })

  describe('French locale (fr)', () => {
    it('should format with zipcode first, then city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Paris',
        state: 'Île-de-France',
        zipcode: '75001',
        locale: LocaleEnum.fr,
      })

      expect(result).toBe('75001 Paris')
    })
  })

  describe('Italian locale (it)', () => {
    it('should format with zipcode first, then city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Rome',
        state: 'Lazio',
        zipcode: '00118',
        locale: LocaleEnum.it,
      })

      expect(result).toBe('00118 Rome')
    })
  })

  describe('Norwegian locale (nb)', () => {
    it('should format with zipcode first, then city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Oslo',
        state: 'Oslo',
        zipcode: '0150',
        locale: LocaleEnum.nb,
      })

      expect(result).toBe('0150 Oslo')
    })
  })

  describe('Brazilian Portuguese locale (pt_BR)', () => {
    it('should format with city, hyphen, state, comma, zipcode', () => {
      const result = formatCityStateZipcodeString({
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01310-100',
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('São Paulo - SP, 01310-100')
    })

    it('should handle missing state - hyphen should appear and no comma should appear', () => {
      const result = formatCityStateZipcodeString({
        city: 'Rio de Janeiro',
        state: null,
        zipcode: '20040-020',
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('Rio de Janeiro - 20040-020')
    })

    it('should handle missing city - no hyphen should appear and comma should appear', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: 'SP',
        zipcode: '01310-100',
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('SP, 01310-100')
    })

    it('should handle missing zipcode - hyphen should still appear', () => {
      const result = formatCityStateZipcodeString({
        city: 'Brasília',
        state: 'DF',
        zipcode: null,
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('Brasília - DF')
    })

    it('should handle missing state and zipcode', () => {
      const result = formatCityStateZipcodeString({
        city: 'Salvador',
        state: null,
        zipcode: null,
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('Salvador')
    })

    it('should handle missing city and state - no hyphen and no comma should appear', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: null,
        zipcode: '01310-100',
        locale: LocaleEnum.pt_BR,
      })

      expect(result).toBe('01310-100')
    })
  })

  describe('Spanish locale (es)', () => {
    it('should format with zipcode, city, comma, state', () => {
      const result = formatCityStateZipcodeString({
        city: 'Madrid',
        state: 'Madrid',
        zipcode: '28001',
        locale: LocaleEnum.es,
      })

      expect(result).toBe('28001 Madrid, Madrid')
    })

    it('should handle missing state - no comma should appear', () => {
      const result = formatCityStateZipcodeString({
        city: 'Barcelona',
        state: null,
        zipcode: '08001',
        locale: LocaleEnum.es,
      })

      expect(result).toBe('08001 Barcelona')
    })
  })

  describe('Swedish locale (sv)', () => {
    it('should format with zipcode first, then city', () => {
      const result = formatCityStateZipcodeString({
        city: 'Stockholm',
        state: 'Stockholm',
        zipcode: '11122',
        locale: LocaleEnum.sv,
      })

      expect(result).toBe('11122 Stockholm')
    })
  })

  describe('edge cases', () => {
    it('should handle all null values', () => {
      const result = formatCityStateZipcodeString({
        city: null,
        state: null,
        zipcode: null,
      })

      expect(result).toBe('')
    })

    it('should handle all undefined values', () => {
      const result = formatCityStateZipcodeString({
        city: undefined,
        state: undefined,
        zipcode: undefined,
      })

      expect(result).toBe('')
    })

    it('should handle empty strings', () => {
      const result = formatCityStateZipcodeString({
        city: '',
        state: '',
        zipcode: '',
      })

      expect(result).toBe('')
    })

    it('should handle whitespace-only strings', () => {
      const result = formatCityStateZipcodeString({
        city: '   ',
        state: '  ',
        zipcode: ' ',
      })

      expect(result).toBe('')
    })

    it('should handle mixed empty and valid values', () => {
      const result = formatCityStateZipcodeString({
        city: '',
        state: 'CA',
        zipcode: '90210',
      })

      expect(result).toBe('CA 90210')
    })

    it('should handle special characters in city names', () => {
      const result = formatCityStateZipcodeString({
        city: "St. John's",
        state: 'NL',
        zipcode: 'A1A 1A1',
      })

      expect(result).toBe("St. John's, NL A1A 1A1")
    })

    it('should clean up extra spaces', () => {
      const result = formatCityStateZipcodeString({
        city: '  New York  ',
        state: '  NY  ',
        zipcode: '  10001  ',
      })

      expect(result).toBe('New York, NY 10001')
    })
  })
})
