import { act, renderHook } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import {
  AUTO_REFRESH_SEARCH_PARAM,
  DEFAULT_TIME_RANGE,
  TIME_RANGE_SEARCH_PARAM,
  TimeRangeEnum,
} from '../constants'
import { useRealtimeUsageControls } from '../useRealtimeUsageControls'

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ timezone: 'TZ_UTC', timezoneConfig: { name: 'UTC' } }),
}))

const renderControls = () =>
  renderHook(() => useRealtimeUsageControls(), {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
  })

beforeEach(() => {
  window.history.replaceState({}, '', '/usage')
})

describe('useRealtimeUsageControls', () => {
  it('does not auto-refresh and reads the last 24 hours by default', () => {
    const { result } = renderControls()

    expect(result.current.autoRefreshSeconds).toBe(0)
    expect(result.current.timeRange).toBe(DEFAULT_TIME_RANGE)
  })

  it('keeps the controls in the URL, and the defaults out of it', () => {
    const { result } = renderControls()

    act(() => result.current.setTimeRange(TimeRangeEnum.Last6h))
    expect(new URLSearchParams(window.location.search).get(TIME_RANGE_SEARCH_PARAM)).toBe(
      TimeRangeEnum.Last6h,
    )
    expect(result.current.timeRange).toBe(TimeRangeEnum.Last6h)

    act(() => result.current.setTimeRange(DEFAULT_TIME_RANGE))
    expect(new URLSearchParams(window.location.search).has(TIME_RANGE_SEARCH_PARAM)).toBe(false)
  })

  it('starts the lists over when the time range changes', () => {
    window.history.replaceState({}, '', '/usage?page=3')
    const { result } = renderControls()

    act(() => result.current.setTimeRange(TimeRangeEnum.Last12h))

    expect(new URLSearchParams(window.location.search).has('page')).toBe(false)
  })

  it('keeps the auto-refresh in the URL', () => {
    const { result } = renderControls()

    act(() => result.current.setAutoRefreshSeconds(5))

    expect(new URLSearchParams(window.location.search).get(AUTO_REFRESH_SEARCH_PARAM)).toBe('5')
    expect(result.current.autoRefreshSeconds).toBe(5)
  })

  it('falls back to the default range when the URL holds one the API would reject', () => {
    window.history.replaceState(
      {},
      '',
      `/usage?${TIME_RANGE_SEARCH_PARAM}=2026-01-01T00:00:00.000Z,2026-08-31T00:00:00.000Z`,
    )
    const { result } = renderControls()

    expect(result.current.timeRange).toBe(DEFAULT_TIME_RANGE)
  })

  it('keeps a custom range the API serves', () => {
    const range = '2026-08-01T00:00:00.000Z,2026-08-07T23:59:59.000Z'

    window.history.replaceState({}, '', `/usage?${TIME_RANGE_SEARCH_PARAM}=${range}`)
    const { result } = renderControls()

    expect(result.current.timeRange).toBe(range)
  })

  it('ignores an unknown auto-refresh value', () => {
    window.history.replaceState({}, '', `/usage?${AUTO_REFRESH_SEARCH_PARAM}=3`)
    const { result } = renderControls()

    expect(result.current.autoRefreshSeconds).toBe(0)
  })
})
