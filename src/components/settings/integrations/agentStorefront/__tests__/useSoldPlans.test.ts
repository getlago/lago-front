import { renderHook } from '@testing-library/react'

import {
  AgentStorefrontSoldPlansFragment,
  AgentStorefrontSoldPlansFragmentDoc,
  CurrencyEnum,
  LagoApiError,
} from '~/generated/graphql'

import { useSoldPlans } from '../useSoldPlans'

const mockReadFragment = jest.fn()
const mockIdentify = jest.fn()
const mockUpdateSoldPlans = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({
    readFragment: mockReadFragment,
    cache: { identify: mockIdentify },
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateAgentStorefrontSoldPlansMutation: () => [mockUpdateSoldPlans],
}))

type SoldPlan = AgentStorefrontSoldPlansFragment['plans'][number]

const createSoldPlan = (planCode: string, overrides: Partial<SoldPlan> = {}): SoldPlan => ({
  __typename: 'AgentStorefrontPlan',
  planCode,
  minimumTopupCents: 100,
  maximumTopupCents: 500,
  freeCreditsCents: null,
  plan: {
    __typename: 'Plan',
    id: `plan-${planCode}`,
    name: planCode,
    code: planCode,
    invoiceDisplayName: null,
    amountCurrency: CurrencyEnum.Usd,
  },
  ...overrides,
})

const PLAN_A = createSoldPlan('a')
const PLAN_B = createSoldPlan('b', {
  minimumTopupCents: 200,
  maximumTopupCents: 900,
  freeCreditsCents: 50,
})
const INPUT_A = {
  planCode: 'a',
  minimumTopupCents: 100,
  maximumTopupCents: 500,
  freeCreditsCents: null,
}
const INPUT_B = {
  planCode: 'b',
  minimumTopupCents: 200,
  maximumTopupCents: 900,
  freeCreditsCents: 50,
}

const NOT_USAGE_ONLY_CONTEXT = { silentErrorDetails: [LagoApiError.PlanNotUsageOnly] }

const mockCachedPlans = (plans: SoldPlan[] | null): void => {
  mockReadFragment.mockReturnValue(
    plans ? { __typename: 'AgentStorefrontIntegration', id: 'sf_1', plans } : null,
  )
}

const renderSoldPlans = (): ReturnType<typeof useSoldPlans> =>
  renderHook(() => useSoldPlans('sf_1')).result.current

describe('useSoldPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIdentify.mockReturnValue('AgentStorefrontIntegration:sf_1')
    mockUpdateSoldPlans.mockResolvedValue({
      data: { updateAgentStorefrontIntegration: { id: 'sf_1' } },
    })
    mockCachedPlans([PLAN_A, PLAN_B])
  })

  describe('GIVEN plans sold through the connection', () => {
    describe('WHEN any action runs', () => {
      it('THEN should read the current list from the cached connection', async () => {
        await renderSoldPlans().stopSellingPlan('a')

        expect(mockIdentify).toHaveBeenCalledWith({
          __typename: 'AgentStorefrontIntegration',
          id: 'sf_1',
        })
        expect(mockReadFragment).toHaveBeenCalledWith({
          id: 'AgentStorefrontIntegration:sf_1',
          fragment: AgentStorefrontSoldPlansFragmentDoc,
          fragmentName: 'AgentStorefrontSoldPlans',
        })
      })
    })

    describe('WHEN selling a new plan', () => {
      it('THEN should send the whole list with the new plan and silence plan_not_usage_only', async () => {
        const result = await renderSoldPlans().sellPlan('c', {
          minimumTopupCents: 100,
          maximumTopupCents: 1000,
          freeCreditsCents: null,
        })

        expect(mockUpdateSoldPlans).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'sf_1',
              plans: [
                INPUT_A,
                INPUT_B,
                {
                  planCode: 'c',
                  minimumTopupCents: 100,
                  maximumTopupCents: 1000,
                  freeCreditsCents: null,
                },
              ],
            },
          },
          context: NOT_USAGE_ONLY_CONTEXT,
        })
        expect(result).toEqual({
          reason: 'mutation',
          result: { data: { updateAgentStorefrontIntegration: { id: 'sf_1' } } },
        })
      })
    })

    describe('WHEN editing a sold plan', () => {
      it('THEN should change only that plan and keep the others as read', async () => {
        await renderSoldPlans().editPlan('b', {
          minimumTopupCents: 300,
          maximumTopupCents: 900,
          freeCreditsCents: 0,
        })

        expect(mockUpdateSoldPlans).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'sf_1',
              plans: [
                INPUT_A,
                {
                  planCode: 'b',
                  minimumTopupCents: 300,
                  maximumTopupCents: 900,
                  freeCreditsCents: 0,
                },
              ],
            },
          },
          context: NOT_USAGE_ONLY_CONTEXT,
        })
      })
    })

    describe('WHEN stopping a sold plan', () => {
      it('THEN should send the list without it and without a silencing context', async () => {
        await renderSoldPlans().stopSellingPlan('a')

        expect(mockUpdateSoldPlans).toHaveBeenCalledWith({
          variables: { input: { id: 'sf_1', plans: [INPUT_B] } },
        })
      })
    })
  })

  describe('GIVEN only one plan is sold', () => {
    describe('WHEN stopping it', () => {
      it('THEN should send an empty list, never null', async () => {
        mockCachedPlans([PLAN_A])

        await renderSoldPlans().stopSellingPlan('a')

        expect(mockUpdateSoldPlans).toHaveBeenCalledWith({
          variables: { input: { id: 'sf_1', plans: [] } },
        })
      })
    })
  })

  describe('GIVEN an action breaks a guardrail', () => {
    const amounts = { minimumTopupCents: 1, maximumTopupCents: 2, freeCreditsCents: null }

    it.each([
      [
        'selling a plan already sold',
        (hook: ReturnType<typeof useSoldPlans>) => hook.sellPlan('a', amounts),
      ],
      [
        'editing a plan not sold',
        (hook: ReturnType<typeof useSoldPlans>) => hook.editPlan('z', amounts),
      ],
      [
        'stopping a plan not sold',
        (hook: ReturnType<typeof useSoldPlans>) => hook.stopSellingPlan('z'),
      ],
    ])('THEN should resolve a guardrail without calling the mutation when %s', async (_, run) => {
      expect(await run(renderSoldPlans())).toEqual({ reason: 'guardrail' })
      expect(mockUpdateSoldPlans).not.toHaveBeenCalled()
    })

    describe('WHEN the connection is not in the cache', () => {
      it('THEN should resolve a guardrail without calling the mutation', async () => {
        mockCachedPlans(null)

        expect(await renderSoldPlans().sellPlan('c', amounts)).toEqual({ reason: 'guardrail' })
        expect(mockUpdateSoldPlans).not.toHaveBeenCalled()
      })
    })
  })
})
