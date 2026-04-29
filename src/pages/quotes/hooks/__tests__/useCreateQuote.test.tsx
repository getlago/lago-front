import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { OrderTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useCreateQuote } from '../useCreateQuote'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  generatePath: jest.fn((route: string, params: Record<string, string>) =>
    route.replace(':quoteId', params.quoteId).replace(':tab', params.tab),
  ),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

let capturedMutationOnCompleted: ((data: Record<string, unknown>) => void) | undefined
const mockCreateQuote = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateQuoteMutation: (options?: { onCompleted?: (data: Record<string, unknown>) => void }) => {
    capturedMutationOnCompleted = options?.onCompleted
    return [mockCreateQuote, { loading: false }]
  },
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

describe('useCreateQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedMutationOnCompleted = undefined
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN it returns', () => {
      it('THEN should return loading and onSave', () => {
        const { result } = renderHook(() => useCreateQuote(), { wrapper })

        expect(result.current.loading).toBe(false)
        expect(typeof result.current.onSave).toBe('function')
      })
    })
  })

  describe('GIVEN onSave is called', () => {
    describe('WHEN called with a one-off quote without subscriptionId', () => {
      it('THEN should call createQuote mutation with correct variables', async () => {
        mockCreateQuote.mockResolvedValue({ data: { createQuote: { id: 'quote-1' } } })

        const { result } = renderHook(() => useCreateQuote(), { wrapper })

        await act(async () => {
          await result.current.onSave({
            customerId: 'customer-123',
            orderType: OrderTypeEnum.OneOff,
          })
        })

        expect(mockCreateQuote).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'customer-123',
              orderType: OrderTypeEnum.OneOff,
              subscriptionId: undefined,
              owners: undefined,
            },
          },
        })
      })
    })

    describe('WHEN called with a subscription amendment and subscriptionId', () => {
      it('THEN should call createQuote mutation with subscriptionId', async () => {
        mockCreateQuote.mockResolvedValue({ data: { createQuote: { id: 'quote-2' } } })

        const { result } = renderHook(() => useCreateQuote(), { wrapper })

        await act(async () => {
          await result.current.onSave({
            customerId: 'customer-456',
            orderType: OrderTypeEnum.SubscriptionAmendment,
            subscriptionId: 'sub-789',
          })
        })

        expect(mockCreateQuote).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'customer-456',
              orderType: OrderTypeEnum.SubscriptionAmendment,
              subscriptionId: 'sub-789',
              owners: undefined,
            },
          },
        })
      })
    })

    describe('WHEN called with owners', () => {
      it('THEN should pass owners array in mutation variables', async () => {
        mockCreateQuote.mockResolvedValue({ data: { createQuote: { id: 'quote-3' } } })

        const { result } = renderHook(() => useCreateQuote(), { wrapper })

        await act(async () => {
          await result.current.onSave({
            customerId: 'customer-789',
            orderType: OrderTypeEnum.OneOff,
            owners: ['user-1', 'user-2'],
          })
        })

        expect(mockCreateQuote).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'customer-789',
              orderType: OrderTypeEnum.OneOff,
              subscriptionId: undefined,
              owners: ['user-1', 'user-2'],
            },
          },
        })
      })
    })

    describe('WHEN called without owners', () => {
      it('THEN should pass undefined owners in mutation variables', async () => {
        mockCreateQuote.mockResolvedValue({ data: { createQuote: { id: 'quote-4' } } })

        const { result } = renderHook(() => useCreateQuote(), { wrapper })

        await act(async () => {
          await result.current.onSave({
            customerId: 'customer-789',
            orderType: OrderTypeEnum.OneOff,
          })
        })

        expect(mockCreateQuote).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'customer-789',
              orderType: OrderTypeEnum.OneOff,
              subscriptionId: undefined,
              owners: undefined,
            },
          },
        })
      })
    })
  })

  describe('GIVEN the mutation completes successfully', () => {
    describe('WHEN onCompleted is triggered with a created quote', () => {
      it('THEN should show a success toast', () => {
        renderHook(() => useCreateQuote(), { wrapper })

        act(() => {
          capturedMutationOnCompleted?.({
            createQuote: { id: 'quote-new' },
          })
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should navigate to the quote details page', () => {
        renderHook(() => useCreateQuote(), { wrapper })

        act(() => {
          capturedMutationOnCompleted?.({
            createQuote: { id: 'quote-new' },
          })
        })

        expect(mockNavigate).toHaveBeenCalledWith('/quote/quote-new/overview')
      })
    })

    describe('WHEN onCompleted is triggered with null result', () => {
      it('THEN should not show a toast or navigate', () => {
        renderHook(() => useCreateQuote(), { wrapper })

        act(() => {
          capturedMutationOnCompleted?.({
            createQuote: null,
          })
        })

        expect(addToast).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })
})
