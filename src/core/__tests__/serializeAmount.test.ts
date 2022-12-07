import { CurrencyEnum } from '~/generated/graphql'

import {
  deserializeAmount,
  getCurrencyPrecision,
  serializeAmount,
} from '../serializers/serializeAmount'

describe('getCurrencyPrecision()', () => {
  describe('with currency JPY', () => {
    it('returns the currect precision', () => {
      const precision = getCurrencyPrecision(CurrencyEnum.Jpy)

      expect(precision).toBe(0)
    })
  })

  describe('with currency Usd', () => {
    it('returns the currect precision', () => {
      const precision = getCurrencyPrecision(CurrencyEnum.Usd)

      expect(precision).toBe(2)
    })
  })

  describe('with currency BHD', () => {
    it('returns the currect precision', () => {
      const precision = getCurrencyPrecision('BHD' as CurrencyEnum) // This currency is not in our CurrencyEnum bu handled by the helper

      expect(precision).toBe(3)
    })
  })
})

describe('serializeAmount()', () => {
  describe('with multipe inputs', () => {
    it('returns the currect serialization', () => {
      const stringWithJpy = serializeAmount('100', CurrencyEnum.Jpy)
      const numberWithJpy = serializeAmount(100, CurrencyEnum.Jpy)
      const stringWithUsd = serializeAmount('100', CurrencyEnum.Usd)
      const numberWithUsd = serializeAmount(100, CurrencyEnum.Usd)
      const stringWithBhd = serializeAmount('100', 'BHD' as CurrencyEnum)
      const numberWithBhd = serializeAmount(100, 'BHD' as CurrencyEnum)

      expect(stringWithJpy).toBe(100)
      expect(numberWithJpy).toBe(100)
      expect(stringWithUsd).toBe(10000)
      expect(numberWithUsd).toBe(10000)
      expect(stringWithBhd).toBe(100000)
      expect(numberWithBhd).toBe(100000)
    })
  })
})
describe('deserializeAmount()', () => {
  describe('with multipe inputs', () => {
    it('returns the currect serialization', () => {
      const stringWithJpy = deserializeAmount('100', CurrencyEnum.Jpy)
      const numberWithJpy = deserializeAmount(100, CurrencyEnum.Jpy)
      const stringWithUsd = deserializeAmount('100', CurrencyEnum.Usd)
      const numberWithUsd = deserializeAmount(100, CurrencyEnum.Usd)
      const stringWithBhd = deserializeAmount('100', 'BHD' as CurrencyEnum)
      const numberWithBhd = deserializeAmount(100, 'BHD' as CurrencyEnum)

      expect(stringWithJpy).toBe(100)
      expect(numberWithJpy).toBe(100)
      expect(stringWithUsd).toBe(1.0)
      expect(numberWithUsd).toBe(1.0)
      expect(stringWithBhd).toBe(0.1)
      expect(numberWithBhd).toBe(0.1)
    })
  })
})
