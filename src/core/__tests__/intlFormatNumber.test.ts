import { CurrencyEnum } from '~/generated/graphql'

import { intlFormatNumber, getCurrencySymbol } from '../intlFormatNumber'

describe('Currency tools', () => {
  describe('intlFormatNumber()', () => {
    it('should return the amount formatted according to currency', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('€')

      const formattedUSD = intlFormatNumber(150050, { currency: CurrencyEnum.Usd })

      expect(formattedUSD).toMatch('$')
      expect(formattedUSD).toMatch('1,500.50')
    })

    it('should return the amount formatted according to the unit', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('€')

      const formattedEURCent = intlFormatNumber(150050, {
        initialUnit: 'standard',
        currency: CurrencyEnum.Eur,
      })

      expect(formattedEURCent).toMatch('150,050.00')
      expect(formattedEURCent).toMatch('€')
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return only currency synbol', () => {
      expect(getCurrencySymbol(CurrencyEnum.Usd)).toBe('$')
      expect(getCurrencySymbol(CurrencyEnum.Yer)).toMatch('YER')
      expect(getCurrencySymbol(CurrencyEnum.Gbp)).toBe('£')
      expect(getCurrencySymbol(CurrencyEnum.Eur)).toBe('€')
    })
  })
})
