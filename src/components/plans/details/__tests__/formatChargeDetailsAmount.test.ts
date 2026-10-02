import { CurrencyEnum } from '~/generated/graphql'

import { formatChargeDetailsAmount } from '../formatChargeDetailsAmount'

describe('formatChargeDetailsAmount', () => {
  describe('GIVEN an amount in a currency', () => {
    describe('WHEN it is formatted with the defaults', () => {
      it('THEN keeps at least two decimals', () => {
        expect(formatChargeDetailsAmount(12.5, { currency: CurrencyEnum.Usd })).toBe('$12.50')
      })
    })

    describe('WHEN a custom pricing unit is set', () => {
      it('THEN suffixes the unit short name', () => {
        expect(
          formatChargeDetailsAmount(12.5, {
            currency: CurrencyEnum.Usd,
            pricingUnitShortName: 'tok',
          }),
        ).toBe('12.50 tok')
      })
    })

    describe('WHEN fraction digits are given', () => {
      it('THEN applies them', () => {
        expect(
          formatChargeDetailsAmount(12.5, { currency: CurrencyEnum.Usd, minimumFractionDigits: 0 }),
        ).toBe('$12.5')
      })
    })
  })
})
