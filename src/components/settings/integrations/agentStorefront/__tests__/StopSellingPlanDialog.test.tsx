import { act, renderHook } from '@testing-library/react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { CurrencyEnum, LagoApiError } from '~/generated/graphql'

import { useStopSellingPlanDialog } from '../StopSellingPlanDialog'
import { SoldPlan } from '../utils'

const mockCentralizedDialogOpen = jest.fn()
const mockStopSellingPlan = jest.fn()
const mockTranslate = jest.fn((key: string) => key)

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: mockTranslate }),
}))

jest.mock('../useSoldPlans', () => ({
  useSoldPlans: () => ({
    sellPlan: jest.fn(),
    editPlan: jest.fn(),
    stopSellingPlan: mockStopSellingPlan,
  }),
}))

const createSoldPlan = (overrides: Partial<SoldPlan> = {}): SoldPlan => ({
  __typename: 'AgentStorefrontPlan',
  planCode: 'count',
  minimumTopupCents: 500,
  maximumTopupCents: 10000,
  freeCreditsCents: null,
  plan: {
    __typename: 'Plan',
    id: 'p1',
    name: 'Count',
    code: 'count',
    invoiceDisplayName: 'Count calls',
    amountCurrency: CurrencyEnum.Usd,
  },
  ...overrides,
})

const openDialog = (soldPlan: SoldPlan = createSoldPlan()): CentralizedDialogProps => {
  const { result } = renderHook(() => useStopSellingPlanDialog('sf_1'))

  act(() => {
    result.current.openStopSellingPlanDialog(soldPlan)
  })

  return mockCentralizedDialogOpen.mock.calls[0][0]
}

describe('useStopSellingPlanDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCentralizedDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN inspecting the open payload', () => {
      it('THEN should be a danger dialog that stays open on network errors', () => {
        expect(openDialog()).toEqual(
          expect.objectContaining({
            colorVariant: 'danger',
            closeOnError: false,
            onError: onNetworkError,
            title: expect.any(String),
            description: expect.any(String),
          }),
        )
      })
    })

    describe.each([
      ['the invoice display name', createSoldPlan(), 'Count calls'],
      ['the plan code when the plan was deleted', createSoldPlan({ plan: null }), 'count'],
    ])('WHEN naming the plan in the title', (_, soldPlan, expectedName) => {
      it(`THEN should use ${_}`, () => {
        openDialog(soldPlan)

        expect(mockTranslate).toHaveBeenCalledWith(expect.any(String), { name: expectedName })
      })
    })
  })

  describe('GIVEN the user confirms', () => {
    describe('WHEN the plan stops being sold', () => {
      it('THEN should stop selling that plan code and toast success', async () => {
        mockStopSellingPlan.mockResolvedValue({
          reason: 'mutation',
          result: { data: { updateAgentStorefrontIntegration: { id: 'sf_1' } } },
        })

        await openDialog().onAction()

        expect(mockStopSellingPlan).toHaveBeenCalledWith('count')
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN the hook hits a guardrail', () => {
      it('THEN should toast the generic error', async () => {
        mockStopSellingPlan.mockResolvedValue({ reason: 'guardrail' })

        await openDialog().onAction()

        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })

    describe('WHEN the API returns an error', () => {
      it('THEN should leave the toast to the error link', async () => {
        mockStopSellingPlan.mockResolvedValue({
          reason: 'mutation',
          result: {
            data: { updateAgentStorefrontIntegration: null },
            errors: [
              {
                message: 'Unprocessable Entity',
                extensions: {
                  code: LagoApiError.UnprocessableEntity,
                  details: { plans: [LagoApiError.PlanNotUsageOnly] },
                },
              },
            ],
          },
        })

        await openDialog().onAction()

        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN another sold plan no longer resolves', () => {
      it('THEN should toast that the stale plan must be stopped first', async () => {
        mockStopSellingPlan.mockResolvedValue({
          reason: 'mutation',
          result: {
            data: { updateAgentStorefrontIntegration: null },
            errors: [
              {
                message: 'Unprocessable Entity',
                extensions: {
                  code: LagoApiError.UnprocessableEntity,
                  details: { plans: [LagoApiError.PlanNotFound] },
                },
              },
            ],
          },
        })

        await openDialog().onAction()

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should reject so the dialog stays open', async () => {
        const networkError = new Error('Network error')

        mockStopSellingPlan.mockRejectedValue(networkError)

        await expect(openDialog().onAction()).rejects.toBe(networkError)
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
