import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { renderHook } from '@testing-library/react'

import { useCrossTabLogOut } from '../useCrossTabLogOut'

const mockListenToCrossTabLogOut = jest.fn()
const mockLogOut = jest.fn()
const mockCaptureException = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  listenToCrossTabLogOut: (...args: unknown[]) => mockListenToCrossTabLogOut(...args),
  logOut: (...args: unknown[]) => mockLogOut(...args),
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
    mockLogOut.mockResolvedValue(undefined)
  })

  describe('GIVEN no Apollo client yet', () => {
    it('THEN should not listen', () => {
      renderHook(() => useCrossTabLogOut(null))

      expect(mockListenToCrossTabLogOut).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN an Apollo client', () => {
    describe('WHEN another tab logs out', () => {
      it('THEN should log out and reset the location history', () => {
        renderHook(() => useCrossTabLogOut(client))

        triggerCrossTabLogOut()

        expect(mockLogOut).toHaveBeenCalledWith(client, true)
      })
    })

    describe('WHEN the logout teardown rejects', () => {
      it('THEN should report it instead of leaving the rejection unhandled', async () => {
        const error = new Error('clearStore failed')

        mockLogOut.mockRejectedValue(error)
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
