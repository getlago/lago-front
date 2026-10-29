import { act, renderHook } from '@testing-library/react'
import { Settings } from 'luxon'

import { TimezoneEnum } from '~/generated/graphql'

import { useRealtimeUsageClock } from '../useRealtimeUsageClock'

const START = Date.parse('2026-08-24T10:00:00.000Z')

let mockedNow = START
let hidden = false

const advance = (ms: number): void => {
  mockedNow += ms
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

const setHidden = (value: boolean): void => {
  hidden = value
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

const originalNow = Settings.now

beforeAll(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
})

beforeEach(() => {
  jest.useFakeTimers()
  mockedNow = START
  hidden = false
  Settings.now = () => mockedNow
})

afterEach(() => {
  jest.useRealTimers()
  Settings.now = originalNow
})

describe('useRealtimeUsageClock', () => {
  describe('GIVEN auto-refresh is off', () => {
    it('THEN never moves on its own', () => {
      const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 0 }))
      const first = result.current.now

      advance(2 * 60 * 60 * 1000)

      expect(result.current.now).toBe(first)
    })

    it('THEN moves to now on a manual tick', () => {
      const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 0 }))

      mockedNow += 90_000
      act(() => result.current.tick())

      expect(result.current.now.toMillis()).toBe(START + 90_000)
    })

    describe('WHEN an hourly timezone is given', () => {
      it('THEN ticks on each hour wall of that timezone', () => {
        const { result } = renderHook(() =>
          useRealtimeUsageClock({ autoRefreshSeconds: 0, hourlyTimezone: TimezoneEnum.TzUtc }),
        )

        advance(30 * 60 * 1000)
        expect(result.current.now.toMillis()).toBe(START)

        advance(30 * 60 * 1000)
        expect(result.current.now.toMillis()).toBe(START + 60 * 60 * 1000)

        advance(60 * 60 * 1000)
        expect(result.current.now.toMillis()).toBe(START + 2 * 60 * 60 * 1000)
      })

      it('THEN follows a half-hour offset rather than the UTC hour', () => {
        const { result } = renderHook(() =>
          useRealtimeUsageClock({
            autoRefreshSeconds: 0,
            hourlyTimezone: TimezoneEnum.TzAsiaKolkata,
          }),
        )

        advance(30 * 60 * 1000)
        expect(result.current.now.toMillis()).toBe(START + 30 * 60 * 1000)
      })
    })
  })

  describe('GIVEN auto-refresh is on', () => {
    it('THEN ticks at its interval', () => {
      const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 5 }))

      advance(5000)
      expect(result.current.now.toMillis()).toBe(START + 5000)

      advance(5000)
      expect(result.current.now.toMillis()).toBe(START + 10_000)
    })

    it('THEN pauses while the tab is hidden and catches up when it shows again', () => {
      const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 5 }))

      setHidden(true)
      advance(60_000)
      expect(result.current.now.toMillis()).toBe(START)

      setHidden(false)
      expect(result.current.now.toMillis()).toBe(START + 60_000)
    })

    describe('WHEN a read is still in flight', () => {
      it('THEN waits for it to settle before the next interval starts', () => {
        const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 5 }))

        act(() => result.current.reportFetching('events', true))
        advance(60_000)
        expect(result.current.now.toMillis()).toBe(START)

        act(() => result.current.reportFetching('events', false))
        advance(4999)
        expect(result.current.now.toMillis()).toBe(START)

        advance(1)
        expect(result.current.now.toMillis()).toBe(START + 65_000)
      })

      it('THEN waits for every reported read', () => {
        const { result } = renderHook(() => useRealtimeUsageClock({ autoRefreshSeconds: 5 }))

        act(() => {
          result.current.reportFetching('events', true)
          result.current.reportFetching('metrics', true)
        })
        act(() => result.current.reportFetching('events', false))
        advance(10_000)
        expect(result.current.now.toMillis()).toBe(START)

        act(() => result.current.reportFetching('metrics', false))
        advance(5000)
        expect(result.current.now.toMillis()).toBe(START + 15_000)
      })
    })

    it('THEN stops ticking once turned off', () => {
      const { result, rerender } = renderHook(
        ({ autoRefreshSeconds }) => useRealtimeUsageClock({ autoRefreshSeconds }),
        { initialProps: { autoRefreshSeconds: 5 } },
      )

      advance(5000)
      rerender({ autoRefreshSeconds: 0 })
      advance(60_000)

      expect(result.current.now.toMillis()).toBe(START + 5000)
    })
  })

  describe('WHEN the reset key changes', () => {
    it('THEN the clock moves to now in the same render', () => {
      const { result, rerender } = renderHook(
        ({ resetKey }) => useRealtimeUsageClock({ autoRefreshSeconds: 0, resetKey }),
        { initialProps: { resetKey: 'customer=a' } },
      )

      mockedNow += 3_600_000
      rerender({ resetKey: 'customer=b' })

      expect(result.current.now.toMillis()).toBe(START + 3_600_000)
    })
  })
})
