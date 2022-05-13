import { CurrencyEnum } from '~/generated/graphql'

import { formatAmountToCurrency } from '../currencyTool'

describe('Currency tools', () => {
  describe('formatAmountToCurrency()', () => {
    it('should return the amount formatted according to currency', () => {
      const formattedEUR = formatAmountToCurrency(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('EUR')

      const formattedUSD = formatAmountToCurrency(150050, { currency: CurrencyEnum.Usd })

      expect(formattedUSD).toMatch('USD')
      expect(formattedUSD).toMatch('1,500.50')
    })

    it('should return the amount formatted according to the unit', () => {
      const formattedEUR = formatAmountToCurrency(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('1,000.50')
      expect(formattedEUR).toMatch('EUR')

      const formattedEURCent = formatAmountToCurrency(150050, {
        initialUnit: 'standard',
        currency: CurrencyEnum.Eur,
      })

      expect(formattedEURCent).toMatch('150,050.00')
      expect(formattedEURCent).toMatch('EUR')
    })
  })
})
