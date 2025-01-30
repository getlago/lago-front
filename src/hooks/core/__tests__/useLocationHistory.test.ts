import { act, renderHook } from '@testing-library/react'

import { locationHistoryVar } from '~/core/apolloClient'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'

const mockNavigate = jest.fn()

const FALLBACK_URL = '/fallback'
const MOCK_HISTORY_VAR = [
  {
    pathname: '/add-ons',
    search: '',
    hash: '',
    state: {
      connectorType: 'source',
      displayConnectionTypeSelector: true,
    },
    key: '8yl13l',
  },
  {
    pathname: '/developers/webhooks',
    search: '',
    hash: '',
    key: 'hq5vj9',
    state: undefined,
  },
  {
    pathname: '/settings',
    search: '',
    hash: '',
    key: '0in8tx',
    state: undefined,
  },
  {
    pathname: '/billable-metrics',
    search: '',
    hash: '',
    key: 'b3ita6',
    state: undefined,
  },
]

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
    loading: false,
    currentUser: {
      id: '1',
      email: 'currentUser@mail.com',
      premium: false,
    },
  }),
}))

describe('useLocationHistory()', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('goBack()', () => {
    describe('when there is no history', () => {
      beforeEach(() => {
        locationHistoryVar([])
      })

      it('should go to the fallback URL if no option', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => {
          result.current.goBack(FALLBACK_URL)
        })

        expect(mockNavigate).toHaveBeenCalledWith(FALLBACK_URL)
        expect(locationHistoryVar()).toEqual([])
      })

      it('should go to the fallback URL if previous count is specified', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => {
          result.current.goBack(FALLBACK_URL, { previousCount: -3 })
        })

        expect(mockNavigate).toHaveBeenCalledWith(FALLBACK_URL)
        expect(locationHistoryVar()).toEqual([])
      })

      it('should go to the fallback URL even if it is excluded', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => {
          result.current.goBack(FALLBACK_URL, { exclude: FALLBACK_URL })
        })

        expect(mockNavigate).toHaveBeenCalledWith(FALLBACK_URL)
        expect(locationHistoryVar()).toEqual([])
      })
    })

    describe('when there is an history', () => {
      beforeEach(() => {
        locationHistoryVar(MOCK_HISTORY_VAR)
      })

      it('it should redirect to the last visited if no options are specified', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => result.current.goBack(FALLBACK_URL))

        expect(mockNavigate).toHaveBeenCalledWith(MOCK_HISTORY_VAR[1])
        expect(locationHistoryVar()).toEqual(MOCK_HISTORY_VAR.slice(2))
      })

      it('should redirect to the last visited according to the previousCount', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => result.current.goBack(FALLBACK_URL, { previousCount: -2 }))

        expect(mockNavigate).toHaveBeenCalledWith(MOCK_HISTORY_VAR[2])
        expect(locationHistoryVar()).toEqual(MOCK_HISTORY_VAR.slice(3))
      })

      it('should redirect to the last visited that is not excluded', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() => result.current.goBack(FALLBACK_URL, { exclude: MOCK_HISTORY_VAR[1].pathname }))

        expect(mockNavigate).toHaveBeenCalledWith(MOCK_HISTORY_VAR[2])
        expect(locationHistoryVar()).toEqual(MOCK_HISTORY_VAR.slice(3))
      })

      it('should redirect to the last visited when several are excluded', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() =>
          result.current.goBack(FALLBACK_URL, {
            exclude: [MOCK_HISTORY_VAR[1].pathname, MOCK_HISTORY_VAR[2].pathname],
          }),
        )

        expect(mockNavigate).toHaveBeenCalledWith(MOCK_HISTORY_VAR[3])
        expect(locationHistoryVar()).toEqual(MOCK_HISTORY_VAR.slice(4))
      })

      it('should redirect to fallback if all remaining history is excluded', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() =>
          result.current.goBack(FALLBACK_URL, {
            exclude: [
              MOCK_HISTORY_VAR[1].pathname,
              MOCK_HISTORY_VAR[2].pathname,
              MOCK_HISTORY_VAR[3].pathname,
            ],
          }),
        )

        expect(mockNavigate).toHaveBeenCalledWith(FALLBACK_URL)
        expect(locationHistoryVar()).toEqual([])
      })

      it('should redirect to fallback if previousCount excite history length', () => {
        const { result } = renderHook(() => useLocationHistory())

        act(() =>
          result.current.goBack(FALLBACK_URL, {
            previousCount: -5,
          }),
        )

        expect(mockNavigate).toHaveBeenCalledWith(FALLBACK_URL)
        expect(locationHistoryVar()).toEqual([])
      })
    })
  })
})
