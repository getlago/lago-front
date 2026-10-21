import { act, renderHook } from '@testing-library/react'
import { Settings } from 'luxon'

import { TimeRangeEnum } from '~/components/realtimeUsage/constants'
import { TimezoneEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { TIME_RANGE_SEARCH_PARAM } from '../useRealtimeUsageControls'
import { useRealtimeUsageFilters } from '../useRealtimeUsageFilters'

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { realtimeUsageEnabled: true },
    timezone: 'TZ_ASIA_KOLKATA' as TimezoneEnum,
  }),
}))

const NOW = '2026-08-24T10:45:00.000Z'
let mockedNow = Date.parse(NOW)
const originalNow = Settings.now

const renderFilters = (search = '') => {
  window.history.replaceState({}, '', `/usage${search}`)

  return renderHook(() => useRealtimeUsageFilters(), {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
  })
}

beforeEach(() => {
  mockedNow = Date.parse(NOW)
  Settings.now = () => mockedNow
})

afterEach(() => {
  Settings.now = originalNow
})

describe('useRealtimeUsageFilters', () => {
  describe('GIVEN a preset range', () => {
    it("THEN reads from the organization's hour wall up to now", () => {
      const { result } = renderFilters(`?${TIME_RANGE_SEARCH_PARAM}=${TimeRangeEnum.Last6h}`)

      // 10:45 UTC is 16:15 in Kolkata, whose hour starts at 10:30 UTC.
      expect(result.current.filters).toEqual({
        fromDatetime: '2026-08-24T05:30:00.000Z',
        toDatetime: NOW,
      })
    })

    it('THEN moves the end of the window on refresh', () => {
      const { result } = renderFilters()

      mockedNow += 30_000
      act(() => result.current.refresh())

      expect(result.current.filters.toDatetime).toBe('2026-08-24T10:45:30.000Z')
    })
  })

  describe('GIVEN a custom range', () => {
    it('THEN reads it as it is when it is over', () => {
      const range = '2026-08-01T00:00:00.000Z,2026-08-07T23:59:59.000Z'
      const { result } = renderFilters(`?${TIME_RANGE_SEARCH_PARAM}=${range}`)

      expect(result.current.filters).toEqual({
        fromDatetime: '2026-08-01T00:00:00.000Z',
        toDatetime: '2026-08-07T23:59:59.000Z',
      })
    })

    it('THEN reads up to now when it ends later', () => {
      const range = '2026-08-20T00:00:00.000Z,2026-08-24T23:59:59.000Z'
      const { result } = renderFilters(`?${TIME_RANGE_SEARCH_PARAM}=${range}`)

      expect(result.current.filters.toDatetime).toBe(NOW)
    })
  })
})
