import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import { useCloneQuote } from '../useCloneQuote'

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({
    open: mockDialogOpen,
  }),
}))

const mockCloneQuote = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCloneQuoteMutation: () => [mockCloneQuote],
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

describe('useCloneQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return openCloneDialog and cloneQuote functions', () => {
        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        expect(typeof result.current.openCloneDialog).toBe('function')
        expect(typeof result.current.cloneQuote).toBe('function')
      })
    })
  })

  describe('GIVEN openCloneDialog is called', () => {
    describe('WHEN called with a quoteId and quoteNumberAndVersion', () => {
      it('THEN should open the dialog with title, description, and actionText', () => {
        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        act(() => {
          result.current.openCloneDialog('quote-123', 'QT-001 - v1')
        })

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
            description: expect.any(String),
            actionText: expect.any(String),
          }),
        )
      })
    })

    describe('WHEN onAction is triggered and clone succeeds', () => {
      it('THEN should call cloneQuote mutation with correct ID', async () => {
        mockCloneQuote.mockResolvedValueOnce({
          data: { cloneQuote: { id: 'cloned-quote-789' } },
        })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        act(() => {
          result.current.openCloneDialog('quote-456', 'QT-002 - v2')
        })

        const onAction = mockDialogOpen.mock.calls[0][0].onAction

        await act(async () => {
          await onAction()
        })

        expect(mockCloneQuote).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { input: { id: 'quote-456' } },
          }),
        )
      })

      it('THEN should show toast and navigate on successful clone', async () => {
        mockCloneQuote.mockResolvedValueOnce({
          data: { cloneQuote: { id: 'cloned-quote-789' } },
        })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        act(() => {
          result.current.openCloneDialog('quote-456', 'QT-002 - v2')
        })

        const onAction = mockDialogOpen.mock.calls[0][0].onAction

        await act(async () => {
          await onAction()
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/cloned-quote-789/edit')
      })

      it('THEN should return success reason', async () => {
        mockCloneQuote.mockResolvedValueOnce({
          data: { cloneQuote: { id: 'cloned-quote-789' } },
        })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        act(() => {
          result.current.openCloneDialog('quote-456', 'QT-002 - v2')
        })

        const onAction = mockDialogOpen.mock.calls[0][0].onAction

        let actionResult: { reason: string } | undefined

        await act(async () => {
          actionResult = await onAction()
        })

        expect(actionResult).toEqual({ reason: 'success' })
      })

      it('THEN should not show toast or navigate when mutation returns null', async () => {
        mockCloneQuote.mockResolvedValueOnce({
          data: { cloneQuote: null },
        })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        act(() => {
          result.current.openCloneDialog('quote-456', 'QT-002 - v2')
        })

        const onAction = mockDialogOpen.mock.calls[0][0].onAction

        await act(async () => {
          await onAction()
        })

        expect(addToast).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the raw cloneQuote function', () => {
    describe('WHEN called with a quoteId', () => {
      it('THEN should call the mutation and return the cloned quote', async () => {
        mockCloneQuote.mockResolvedValueOnce({
          data: { cloneQuote: { id: 'cloned-quote-789' } },
        })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        let cloneResult: { id: string } | null | undefined

        await act(async () => {
          cloneResult = await result.current.cloneQuote('quote-456')
        })

        expect(mockCloneQuote).toHaveBeenCalledWith({
          variables: { input: { id: 'quote-456' } },
        })
        expect(cloneResult).toEqual({ id: 'cloned-quote-789' })
      })

      it('THEN should return null when mutation returns no data', async () => {
        mockCloneQuote.mockResolvedValueOnce({ data: { cloneQuote: null } })

        const { result } = renderHook(() => useCloneQuote(), { wrapper })

        let cloneResult: { id: string } | null | undefined

        await act(async () => {
          cloneResult = await result.current.cloneQuote('quote-456')
        })

        expect(cloneResult).toBeNull()
      })
    })
  })
})
