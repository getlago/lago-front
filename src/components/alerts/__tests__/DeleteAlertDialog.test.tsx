import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { DestroyContractAlertDocument, DestroySubscriptionAlertDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { useDeleteAlertDialog } from '../DeleteAlertDialog'

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const buildMocks = (onContract: jest.Mock, onSubscription: jest.Mock): TestMocksType => [
  {
    request: { query: DestroyContractAlertDocument, variables: { input: { id: 'a1' } } },
    result: () => {
      onContract()

      return { data: { destroyContractAlert: { __typename: 'ContractAlert', id: 'a1' } } }
    },
  },
  {
    request: { query: DestroySubscriptionAlertDocument, variables: { input: { id: 'a1' } } },
    result: () => {
      onSubscription()

      return { data: { destroySubscriptionAlert: { __typename: 'Alert', id: 'a1' } } }
    },
  },
]

const renderDialogHook = (mocks: TestMocksType) =>
  renderHook(() => useDeleteAlertDialog(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllTheProviders mocks={mocks}>{children}</AllTheProviders>
    ),
  })

const getLastDialogArgs = (): CentralizedDialogProps => mockDialogOpen.mock.calls.at(-1)?.[0]

describe('useDeleteAlertDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([
    { alertKind: 'contract' as const, expectedContractCalls: 1, expectedSubscriptionCalls: 0 },
    { alertKind: 'subscription' as const, expectedContractCalls: 0, expectedSubscriptionCalls: 1 },
  ])(
    'GIVEN a $alertKind alert',
    ({ alertKind, expectedContractCalls, expectedSubscriptionCalls }) => {
      describe('WHEN the deletion is confirmed', () => {
        it('THEN should send only the matching mutation and show a success toast', async () => {
          const onContract = jest.fn()
          const onSubscription = jest.fn()
          const { result } = renderDialogHook(buildMocks(onContract, onSubscription))

          act(() => result.current.openDeleteAlertDialog({ alertKind, id: 'a1' }))

          const args = getLastDialogArgs()

          expect(args).toEqual(expect.objectContaining({ colorVariant: 'danger' }))

          await act(async () => {
            await args.onAction()
          })

          expect(onContract).toHaveBeenCalledTimes(expectedContractCalls)
          expect(onSubscription).toHaveBeenCalledTimes(expectedSubscriptionCalls)
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
      })
    },
  )

  describe('GIVEN both alert kinds', () => {
    describe('WHEN their dialogs open', () => {
      it('THEN should share the title but use kind-specific description and action', () => {
        const { result } = renderDialogHook([])

        act(() => result.current.openDeleteAlertDialog({ alertKind: 'contract', id: 'a1' }))
        const contractArgs = getLastDialogArgs()

        act(() => result.current.openDeleteAlertDialog({ alertKind: 'subscription', id: 'a1' }))
        const subscriptionArgs = getLastDialogArgs()

        expect(contractArgs.title).toBe(subscriptionArgs.title)
        expect(contractArgs.description).not.toBe(subscriptionArgs.description)
        expect(contractArgs.actionText).not.toBe(subscriptionArgs.actionText)
      })
    })
  })

  describe('GIVEN the delete request fails on the network', () => {
    describe('WHEN the deletion is confirmed', () => {
      it('THEN should keep the dialog open and show a danger toast instead of a success one', async () => {
        const { result } = renderDialogHook([
          {
            request: { query: DestroyContractAlertDocument, variables: { input: { id: 'a1' } } },
            error: new Error('Network error'),
          },
        ])

        act(() => result.current.openDeleteAlertDialog({ alertKind: 'contract', id: 'a1' }))

        const args = getLastDialogArgs()

        expect(args.closeOnError).toBe(false)

        let caughtError: Error | undefined

        await act(async () => {
          try {
            await args.onAction()
          } catch (error) {
            caughtError = error as Error
          }
        })

        expect(caughtError).toBeDefined()
        expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))

        act(() => args.onError?.(caughtError as Error))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })
})
