import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'

import {
  bigNumberShortenNotationFormater,
  getCurrencySymbol,
  intlFormatNumber,
} from '../intlFormatNumber'

describe('Currency tools', () => {
  describe('intlFormatNumber()', () => {
    it('should return the amount formatted according to currency', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('100,050.00')
      expect(formattedEUR).toMatch('€')

      const formattedUSD = intlFormatNumber(150050, { currency: CurrencyEnum.Usd })

      expect(formattedUSD).toMatch('$')
      expect(formattedUSD).toMatch('150,050.00')

      const formattedJPY = intlFormatNumber(150050, { currency: CurrencyEnum.Jpy })

      expect(formattedJPY).toMatch('¥')
      expect(formattedJPY).toMatch('150,050')
    })

    it('should return the amount formatted according to the unit', () => {
      const formattedEUR = intlFormatNumber(100050, { currency: CurrencyEnum.Eur })

      // Needs to be done that way as whitespaces breaks the tests
      expect(formattedEUR).toMatch('100,050.00')
      expect(formattedEUR).toMatch('€')

      const formattedEURCent = intlFormatNumber(150050, {
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
      expect(getCurrencySymbol(CurrencyEnum.Jpy)).toBe('¥')
    })
  })

  describe('bigNumberShortenNotationFormater()', () => {
    it('should return amount formatted according to currency', () => {
      expect(bigNumberShortenNotationFormater(1)).toBe('$1')
      expect(bigNumberShortenNotationFormater(1, { currency: CurrencyEnum.Eur })).toBe('€1')
      expect(bigNumberShortenNotationFormater(1.1, { currency: CurrencyEnum.Eur })).toBe('€1')
      expect(bigNumberShortenNotationFormater(1.01, { currency: CurrencyEnum.Eur })).toBe('€1')
      expect(bigNumberShortenNotationFormater(10, { currency: CurrencyEnum.Eur })).toBe('€10')
      expect(bigNumberShortenNotationFormater(100, { currency: CurrencyEnum.Eur })).toBe('€100')
      expect(bigNumberShortenNotationFormater(100.01, { currency: CurrencyEnum.Eur })).toBe('€100')
      expect(bigNumberShortenNotationFormater(1_000, { currency: CurrencyEnum.Eur })).toBe('€1k')
      expect(bigNumberShortenNotationFormater(1_000.01, { currency: CurrencyEnum.Eur })).toBe('€1k')
      expect(bigNumberShortenNotationFormater(1_010, { currency: CurrencyEnum.Eur })).toBe('€1k')
      expect(bigNumberShortenNotationFormater(1_100, { currency: CurrencyEnum.Eur })).toBe('€1.1k')
      expect(bigNumberShortenNotationFormater(1_111, { currency: CurrencyEnum.Eur })).toBe('€1.1k')
      expect(bigNumberShortenNotationFormater(10_000, { currency: CurrencyEnum.Eur })).toBe('€10k')
      expect(bigNumberShortenNotationFormater(100_000, { currency: CurrencyEnum.Eur })).toBe(
        '€100k'
      )
      expect(bigNumberShortenNotationFormater(1_000_000, { currency: CurrencyEnum.Eur })).toBe(
        '€1M'
      )
      expect(bigNumberShortenNotationFormater(10_000_000, { currency: CurrencyEnum.Eur })).toBe(
        '€10M'
      )
      expect(bigNumberShortenNotationFormater(100_000_000, { currency: CurrencyEnum.Eur })).toBe(
        '€100M'
      )
      expect(bigNumberShortenNotationFormater(1_000_000_000, { currency: CurrencyEnum.Eur })).toBe(
        '€1B'
      )
      expect(bigNumberShortenNotationFormater(10_000_000_000, { currency: CurrencyEnum.Eur })).toBe(
        '€10B'
      )
      expect(
        bigNumberShortenNotationFormater(100_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€100B')
      expect(
        bigNumberShortenNotationFormater(1_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€1T')
      expect(
        bigNumberShortenNotationFormater(10_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€10T')
      expect(
        bigNumberShortenNotationFormater(100_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€100T')
      expect(
        bigNumberShortenNotationFormater(1_000_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€1Q')
      expect(
        bigNumberShortenNotationFormater(
          deserializeAmount(100_000_000_000_000_000, CurrencyEnum.Eur),
          { currency: CurrencyEnum.Eur }
        )
      ).toBe('€1Q')
      expect(
        bigNumberShortenNotationFormater(10_000_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€10Q')
      expect(
        bigNumberShortenNotationFormater(100_000_000_000_000_000, { currency: CurrencyEnum.Eur })
      ).toBe('€100Q')
      expect(bigNumberShortenNotationFormater(100_000_000_000_000_000)).toBe('$100Q')
    })
  })
})
