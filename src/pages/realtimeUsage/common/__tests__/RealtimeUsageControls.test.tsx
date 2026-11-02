import { act, renderHook } from '@testing-library/react'

import { DEFAULT_TIME_RANGE, TimeRangeEnum } from '~/components/realtimeUsage/constants'
import { AllTheProviders } from '~/test-utils'

import {
  AUTO_REFRESH_SEARCH_PARAM,
  TIME_RANGE_SEARCH_PARAM,
  useRealtimeUsageControls,
} from '../useRealtimeUsageControls'

const renderControls = (search = '') => {
  window.history.replaceState({}, '', `/usage${search}`)

  return renderHook(() => useRealtimeUsageControls(), {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
  })
}

describe('useRealtimeUsageControls', () => {
  it('auto-refreshes every second and reads the last 24 hours by default', () => {
    const { result } = renderControls()

    expect(result.current.autoRefreshSeconds).toBe(1)
    expect(result.current.timeRange).toBe(DEFAULT_TIME_RANGE)
  })

  it('reads the controls from the URL', () => {
    const { result } = renderControls(
      `?${AUTO_REFRESH_SEARCH_PARAM}=5&${TIME_RANGE_SEARCH_PARAM}=${TimeRangeEnum.Last6h}`,
    )

    expect(result.current.autoRefreshSeconds).toBe(5)
    expect(result.current.timeRange).toBe(TimeRangeEnum.Last6h)
  })

  it('keeps a custom range the API serves', () => {
    const range = '2026-08-01T00:00:00.000Z,2026-08-07T23:59:59.000Z'
    const { result } = renderControls(`?${TIME_RANGE_SEARCH_PARAM}=${range}`)

    expect(result.current.timeRange).toBe(range)
  })

  it('falls back to the default range when the URL holds one the API would reject', () => {
    const { result } = renderControls(
      `?${TIME_RANGE_SEARCH_PARAM}=2026-01-01T00:00:00.000Z,2026-08-31T00:00:00.000Z`,
    )

    expect(result.current.timeRange).toBe(DEFAULT_TIME_RANGE)
  })

  it('ignores an unknown auto-refresh value', () => {
    const { result } = renderControls(`?${AUTO_REFRESH_SEARCH_PARAM}=3`)

    expect(result.current.autoRefreshSeconds).toBe(1)
  })

  it('keeps auto-refresh in the URL, and drops it when back to the default', () => {
    const { result } = renderControls()

    act(() => result.current.setAutoRefreshSeconds(0))

    expect(result.current.autoRefreshSeconds).toBe(0)
    expect(new URLSearchParams(window.location.search).get(AUTO_REFRESH_SEARCH_PARAM)).toBe('0')

    act(() => result.current.setAutoRefreshSeconds(1))

    expect(result.current.autoRefreshSeconds).toBe(1)
    expect(new URLSearchParams(window.location.search).has(AUTO_REFRESH_SEARCH_PARAM)).toBe(false)
  })
})
