import { CurrencyEnum } from '~/generated/graphql'

import { intlFormatNumber } from '../intlFormatNumber'

describe('Currency tools', () => {
  describe('intlFormatNumber()', () => {
    it('should return the amount formatted according to currency', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('EUR')

      const formattedUSD = intlFormatNumber(150050, { currency: CurrencyEnum.Usd })

      expect(formattedUSD).toMatch('USD')
      expect(formattedUSD).toMatch('1,500.50')
    })

    it('should return the amount formatted according to the unit', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('EUR')

      const formattedEURCent = intlFormatNumber(150050, {
        initialUnit: 'standard',
        currency: CurrencyEnum.Eur,
      })

      expect(formattedEURCent).toMatch('150,050.00')
      expect(formattedEURCent).toMatch('EUR')
    })
  })
})
