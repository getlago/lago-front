import { CurrencyEnum } from '~/generated/graphql'

import {
  applySoldPlanChange,
  formatFreeCredits,
  formatTopupRange,
  getSoldPlanName,
  SoldPlan,
} from '../utils'

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

  describe('GIVEN getSoldPlanName', () => {
    it.each([
      [
        'the invoice display name when set',
        createSoldPlan({ plan: { ...usdPlan, invoiceDisplayName: 'Count calls' } }),
        'Count calls',
      ],
      [
        'the plan name when no invoice display name',
        createSoldPlan({ plan: { ...usdPlan, invoiceDisplayName: null } }),
        'Count',
      ],
      ['the plan code when the plan was deleted', createSoldPlan({ plan: null }), 'count'],
    ])('THEN should return %s', (_, soldPlan, expected) => {
      expect(getSoldPlanName(soldPlan)).toBe(expected)
    })
  })

  describe('GIVEN applySoldPlanChange', () => {
    const planA = createSoldPlan({
      planCode: 'a',
      minimumTopupCents: 100,
      maximumTopupCents: 500,
      freeCreditsCents: null,
    })
    const planB = createSoldPlan({
      planCode: 'b',
      minimumTopupCents: 200,
      maximumTopupCents: 900,
      freeCreditsCents: 50,
    })
    const inputA = {
      planCode: 'a',
      minimumTopupCents: 100,
      maximumTopupCents: 500,
      freeCreditsCents: null,
    }
    const inputB = {
      planCode: 'b',
      minimumTopupCents: 200,
      maximumTopupCents: 900,
      freeCreditsCents: 50,
    }

    describe('WHEN selling a plan not sold yet', () => {
      it('THEN should append it after the sold plans, each with its 4 keys', () => {
        expect(
          applySoldPlanChange([planA, planB], {
            type: 'sell',
            planCode: 'c',
            amounts: { minimumTopupCents: 100, maximumTopupCents: 1000, freeCreditsCents: null },
          }),
        ).toEqual([
          inputA,
          inputB,
          {
            planCode: 'c',
            minimumTopupCents: 100,
            maximumTopupCents: 1000,
            freeCreditsCents: null,
          },
        ])
      })
    })

    describe('WHEN editing a sold plan', () => {
      it('THEN should update only that plan and keep its code', () => {
        expect(
          applySoldPlanChange([planA, planB], {
            type: 'edit',
            planCode: 'b',
            amounts: { minimumTopupCents: 300, maximumTopupCents: 900, freeCreditsCents: 0 },
          }),
        ).toEqual([
          inputA,
          { planCode: 'b', minimumTopupCents: 300, maximumTopupCents: 900, freeCreditsCents: 0 },
        ])
      })
    })

    describe('WHEN stopping a sold plan', () => {
      it('THEN should remove only that plan', () => {
        expect(applySoldPlanChange([planA, planB], { type: 'stop', planCode: 'a' })).toEqual([
          inputB,
        ])
      })

      it('THEN should return an empty list when it was the last one', () => {
        expect(applySoldPlanChange([planA], { type: 'stop', planCode: 'a' })).toEqual([])
      })
    })

    describe('WHEN the change breaks a guardrail', () => {
      const amounts = { minimumTopupCents: 1, maximumTopupCents: 2, freeCreditsCents: null }

      it.each([
        ['selling an already sold plan', { type: 'sell' as const, planCode: 'a', amounts }],
        ['editing a plan not sold', { type: 'edit' as const, planCode: 'z', amounts }],
        ['stopping a plan not sold', { type: 'stop' as const, planCode: 'z' }],
      ])('THEN should return null for %s', (_, change) => {
        expect(applySoldPlanChange([planA, planB], change)).toBeNull()
      })
    })
  })
})
