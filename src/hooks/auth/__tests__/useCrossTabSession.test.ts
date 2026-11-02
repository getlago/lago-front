import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { renderHook } from '@testing-library/react'

import { useCrossTabSession } from '../useCrossTabSession'

const mockListenToSessionChanges = jest.fn()
const mockReconcileSession = jest.fn()
const mockCaptureException = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  listenToSessionChanges: (...args: unknown[]) => mockListenToSessionChanges(...args),
  reconcileSession: (...args: unknown[]) => mockReconcileSession(...args),
}))

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

const client = {} as ApolloClient<NormalizedCacheObject>

const triggerSessionChange = (): void => mockListenToSessionChanges.mock.calls[0][0]()

describe('useCrossTabSession', () => {
  let stopListening: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    stopListening = jest.fn()
    mockListenToSessionChanges.mockReturnValue(stopListening)
    mockReconcileSession.mockResolvedValue(undefined)
  })

  describe('GIVEN no Apollo client yet', () => {
    it('THEN should neither reconcile nor listen', () => {
      renderHook(() => useCrossTabSession(null))

      expect(mockReconcileSession).not.toHaveBeenCalled()
      expect(mockListenToSessionChanges).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN an Apollo client', () => {
    describe('WHEN the app mounts', () => {
      // A logout in another tab during boot was never seen by this tab.
      it('THEN should reconcile once right away', () => {
        renderHook(() => useCrossTabSession(client))

        expect(mockReconcileSession).toHaveBeenCalledTimes(1)
        expect(mockReconcileSession).toHaveBeenCalledWith(client)
      })
    })

    describe('WHEN the session changes in another tab', () => {
      it('THEN should reconcile again', () => {
        renderHook(() => useCrossTabSession(client))

        triggerSessionChange()

        expect(mockReconcileSession).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN the reconcile rejects', () => {
      it('THEN should report it instead of leaving the rejection unhandled', async () => {
        const error = new Error('clearStore failed')

        mockReconcileSession.mockRejectedValue(error)
        renderHook(() => useCrossTabSession(client))

        await Promise.resolve()

        expect(mockCaptureException).toHaveBeenCalledWith(error)
      })
    })

    describe('WHEN the app unmounts', () => {
      it('THEN should stop listening', () => {
        const { unmount } = renderHook(() => useCrossTabSession(client))

        unmount()

        expect(stopListening).toHaveBeenCalled()
      })
    })
  })
})
