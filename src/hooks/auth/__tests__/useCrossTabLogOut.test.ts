import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { renderHook } from '@testing-library/react'

import { useCrossTabLogOut } from '../useCrossTabLogOut'

const mockListenToCrossTabLogOut = jest.fn()
const mockLogOutFromOtherTab = jest.fn()
const mockCaptureException = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  listenToCrossTabLogOut: (...args: unknown[]) => mockListenToCrossTabLogOut(...args),
  logOutFromOtherTab: (...args: unknown[]) => mockLogOutFromOtherTab(...args),
}))

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

const client = {} as ApolloClient<NormalizedCacheObject>

const triggerCrossTabLogOut = (): void => mockListenToCrossTabLogOut.mock.calls[0][0]()

describe('useCrossTabLogOut', () => {
  let stopListening: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    stopListening = jest.fn()
    mockListenToCrossTabLogOut.mockReturnValue(stopListening)
    mockLogOutFromOtherTab.mockResolvedValue(undefined)
  })

  describe('GIVEN no Apollo client yet', () => {
    it('THEN should not listen', () => {
      renderHook(() => useCrossTabLogOut(null))

      expect(mockListenToCrossTabLogOut).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN an Apollo client', () => {
    describe('WHEN another tab logs out', () => {
      // `logOut` would remove the shared token, deleting a session opened while
      // this tab was still clearing its cache.
      it('THEN should tear down only this tab, leaving the shared token alone', () => {
        renderHook(() => useCrossTabLogOut(client))

        triggerCrossTabLogOut()

        expect(mockLogOutFromOtherTab).toHaveBeenCalledWith(client)
      })
    })

    describe('WHEN the logout teardown rejects', () => {
      it('THEN should report it instead of leaving the rejection unhandled', async () => {
        const error = new Error('clearStore failed')

        mockLogOutFromOtherTab.mockRejectedValue(error)
        renderHook(() => useCrossTabLogOut(client))

        triggerCrossTabLogOut()
        await Promise.resolve()

        expect(mockCaptureException).toHaveBeenCalledWith(error)
      })
    })

    describe('WHEN the app unmounts', () => {
      it('THEN should stop listening', () => {
        const { unmount } = renderHook(() => useCrossTabLogOut(client))

        unmount()

        expect(stopListening).toHaveBeenCalled()
      })
    })
  })
})
