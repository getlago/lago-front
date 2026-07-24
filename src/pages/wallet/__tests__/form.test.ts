import { CurrencyEnum } from '~/generated/graphql'
import { topUpAmountError } from '~/pages/wallet/form'

const translate = jest.fn((key: string) => `translated_${key}`)

describe('topUpAmountError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no rate or no paid credits', () => {
    describe('WHEN rateAmount is missing', () => {
      it('THEN should return undefined', () => {
        expect(
          topUpAmountError({ paidCredits: '10', paidTopUpMaxAmountCents: '100' }),
        ).toBeUndefined()
      })
    })

    describe('WHEN paidCredits is empty or zero', () => {
      it.each([[''], [undefined], ['0']])('THEN should return undefined for %p', (paidCredits) => {
        expect(
          topUpAmountError({
            rateAmount: '1',
            paidCredits,
            paidTopUpMaxAmountCents: '100',
          }),
        ).toBeUndefined()
      })
    })
  })

  describe('GIVEN the skip flag is set', () => {
    describe('WHEN the amount is out of bounds', () => {
      it('THEN should return undefined', () => {
        expect(
          topUpAmountError({
            skip: true,
            rateAmount: '1',
            paidCredits: '200',
            paidTopUpMinAmountCents: '10',
            paidTopUpMaxAmountCents: '100',
          }),
        ).toBeUndefined()
      })
    })
  })

  describe('GIVEN both min and max bounds', () => {
    describe('WHEN the amount is out of range', () => {
      it('THEN should return the not-between error', () => {
        const result = topUpAmountError({
          rateAmount: '1',
          paidCredits: '200',
          paidTopUpMinAmountCents: '10',
          paidTopUpMaxAmountCents: '100',
          currency: CurrencyEnum.Usd,
          translate,
        })

        expect(result?.error).toBe('top-up-not-between')
        expect(result?.label).toEqual(expect.any(String))
      })
    })

    describe('WHEN the amount is within range', () => {
      it('THEN should return null', () => {
        expect(
          topUpAmountError({
            rateAmount: '1',
            paidCredits: '50',
            paidTopUpMinAmountCents: '10',
            paidTopUpMaxAmountCents: '100',
            currency: CurrencyEnum.Usd,
          }),
        ).toBeNull()
      })
    })
  })

  describe('GIVEN only a min bound', () => {
    describe('WHEN the amount is below the minimum', () => {
      it('THEN should return the below-min error', () => {
        const result = topUpAmountError({
          rateAmount: '1',
          paidCredits: '5',
          paidTopUpMinAmountCents: '10',
          currency: CurrencyEnum.Usd,
          translate,
        })

        expect(result?.error).toBe('top-up-below-min')
      })
    })
  })

  describe('GIVEN only a max bound', () => {
    describe('WHEN the amount is above the maximum', () => {
      it('THEN should return the above-max error', () => {
        const result = topUpAmountError({
          rateAmount: '1',
          paidCredits: '200',
          paidTopUpMaxAmountCents: '100',
          currency: CurrencyEnum.Usd,
          translate,
        })

        expect(result?.error).toBe('top-up-above-max')
      })
    })
  })

  describe('GIVEN the rate multiplies the credits', () => {
    describe('WHEN rate is 2 and credits amount exceeds the max', () => {
      it('THEN should compare credits × rate against the bounds', () => {
        // 60 credits × rate 2 = 120 > max 100
        const result = topUpAmountError({
          rateAmount: '2',
          paidCredits: '60',
          paidTopUpMaxAmountCents: '100',
          currency: CurrencyEnum.Usd,
        })

        expect(result?.error).toBe('top-up-above-max')
      })
    })
  })
})
