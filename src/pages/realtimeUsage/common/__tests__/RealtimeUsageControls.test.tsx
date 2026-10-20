import { act, fireEvent, renderHook, screen, within } from '@testing-library/react'

import { AllTheProviders, render } from '~/test-utils'

import {
  AUTO_REFRESH_SEARCH_PARAM,
  AutoRefreshEnum,
  DEFAULT_TIME_RANGE,
  REALTIME_USAGE_AUTO_REFRESH_TEST_ID,
  TIME_RANGE_SEARCH_PARAM,
  TimeRangeEnum,
} from '../constants'
import { RealtimeUsageAutoRefreshSelector } from '../RealtimeUsageAutoRefreshSelector'
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

    expect(result.current.autoRefresh).toBe(AutoRefreshEnum.Off)
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

  it('ignores an unknown auto-refresh value', () => {
    window.history.replaceState({}, '', `/usage?${AUTO_REFRESH_SEARCH_PARAM}=3`)
    const { result } = renderControls()

    expect(result.current.autoRefresh).toBe(AutoRefreshEnum.Off)
  })
})

describe('RealtimeUsageAutoRefreshSelector', () => {
  it('opens its options and applies the one picked', async () => {
    render(<RealtimeUsageAutoRefreshSelector />)

    fireEvent.click(screen.getByTestId(REALTIME_USAGE_AUTO_REFRESH_TEST_ID))

    const options = await screen.findAllByRole('button')
    // The opener, then one option per auto-refresh value.

    expect(options).toHaveLength(Object.values(AutoRefreshEnum).length + 1)

    fireEvent.click(
      options[Object.values(AutoRefreshEnum).indexOf(AutoRefreshEnum.FiveSeconds) + 1],
    )

    expect(new URLSearchParams(window.location.search).get(AUTO_REFRESH_SEARCH_PARAM)).toBe(
      AutoRefreshEnum.FiveSeconds,
    )
    expect(
      within(screen.getByTestId(REALTIME_USAGE_AUTO_REFRESH_TEST_ID)).getByText(/:/),
    ).toBeInTheDocument()
  })
})
