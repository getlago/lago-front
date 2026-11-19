import { AgentStorefrontIntegrationDetailsFragment, CurrencyEnum } from '~/generated/graphql'

import { formatFreeCredits, formatTopupRange } from '../utils'

type SoldPlan = AgentStorefrontIntegrationDetailsFragment['plans'][number]

const usdPlan: NonNullable<SoldPlan['plan']> = {
  __typename: 'Plan',
  id: 'plan-count',
  name: 'Count',
  code: 'count',
  amountCurrency: CurrencyEnum.Usd,
}

const createSoldPlan = (overrides: Partial<SoldPlan> = {}): SoldPlan => ({
  __typename: 'AgentStorefrontPlan',
  planCode: 'count',
  minimumTopupCents: 500,
  maximumTopupCents: 10000,
  freeCreditsCents: 1000,
  plan: usdPlan,
  ...overrides,
})

describe('agentStorefront utils', () => {
  describe('GIVEN formatTopupRange', () => {
    describe('WHEN the plan is in USD', () => {
      it.each([
        ['both bounds', { minimumTopupCents: 500, maximumTopupCents: 10000 }, '$5.00 – $100.00'],
        ['only a minimum', { minimumTopupCents: 500, maximumTopupCents: null }, '$5.00 – -'],
        ['only a maximum', { minimumTopupCents: null, maximumTopupCents: 10000 }, '- – $100.00'],
        ['no bound', { minimumTopupCents: null, maximumTopupCents: null }, '-'],
        ['a zero minimum', { minimumTopupCents: 0, maximumTopupCents: 10000 }, '$0.00 – $100.00'],
        [
          'string BigInt bounds',
          { minimumTopupCents: '500', maximumTopupCents: '10000' },
          '$5.00 – $100.00',
        ],
      ])('THEN should format %s', (_, bounds, expected) => {
        expect(formatTopupRange(createSoldPlan(bounds))).toBe(expected)
      })
    })

    describe('WHEN the plan was deleted', () => {
      it('THEN should return a dash even with bounds set', () => {
        expect(formatTopupRange(createSoldPlan({ plan: null }))).toBe('-')
      })
    })

    describe('WHEN the plan currency has no decimals', () => {
      it('THEN should not divide the amounts by 100', () => {
        expect(
          formatTopupRange(
            createSoldPlan({
              minimumTopupCents: 500,
              maximumTopupCents: 1000,
              plan: { ...usdPlan, amountCurrency: CurrencyEnum.Jpy },
            }),
          ),
        ).toBe('¥500 – ¥1,000')
      })
    })
  })

  describe('GIVEN formatFreeCredits', () => {
    describe('WHEN the plan is in USD', () => {
      it.each([
        ['an amount', 1000, '$10.00'],
        ['zero', 0, '$0.00'],
        ['a string BigInt', '2500', '$25.00'],
        ['no free credits', null, '-'],
      ])('THEN should format %s', (_, freeCreditsCents, expected) => {
        expect(formatFreeCredits(createSoldPlan({ freeCreditsCents }))).toBe(expected)
      })
    })

    describe('WHEN the plan was deleted', () => {
      it('THEN should return a dash even with free credits set', () => {
        expect(formatFreeCredits(createSoldPlan({ plan: null }))).toBe('-')
      })
    })

    describe('WHEN the plan currency has no decimals', () => {
      it('THEN should not divide the amount by 100', () => {
        expect(
          formatFreeCredits(
            createSoldPlan({
              freeCreditsCents: 500,
              plan: { ...usdPlan, amountCurrency: CurrencyEnum.Jpy },
            }),
          ),
        ).toBe('¥500')
      })
    })
  })
})
