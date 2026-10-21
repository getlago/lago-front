import { DateTime } from 'luxon'

import { TimezoneEnum } from '~/generated/graphql'

import { TimeRangeEnum } from '../constants'
import { isApplicableRange, isTimeRangePreset, windowStartOf } from '../utils'

describe('windowStartOf', () => {
  const now = DateTime.fromISO('2026-08-24T11:45:00.000Z')

  it('starts the window on the hour wall, counting the current hour in', () => {
    expect(windowStartOf(now, 24, TimezoneEnum.TzUtc)).toBe('2026-08-23T12:00:00.000Z')
    expect(windowStartOf(now, 6, TimezoneEnum.TzUtc)).toBe('2026-08-24T06:00:00.000Z')
  })

  it("snaps to the customer's hour walls under a half-hour offset", () => {
    // 11:45 UTC is 17:15 in Kolkata, whose hour starts at 11:30 UTC.
    expect(windowStartOf(now, 6, TimezoneEnum.TzAsiaKolkata)).toBe('2026-08-24T06:30:00.000Z')
  })
})

describe('isApplicableRange', () => {
  it('accepts a range up to the longest window the API serves', () => {
    expect(isApplicableRange('2026-08-01T00:00:00.000Z,2026-08-31T23:59:59.000Z')).toBe(true)
  })

  it('refuses a range the API would reject, or no range at all', () => {
    expect(isApplicableRange('2026-07-01T00:00:00.000Z,2026-08-31T23:59:59.000Z')).toBe(false)
    expect(isApplicableRange('2026-08-31T00:00:00.000Z,2026-08-01T00:00:00.000Z')).toBe(false)
    expect(isApplicableRange('not-a-date,2026-08-01T00:00:00.000Z')).toBe(false)
    expect(isApplicableRange(null)).toBe(false)
  })
})

describe('isTimeRangePreset', () => {
  it('tells a preset from the bounds of a custom range', () => {
    expect(isTimeRangePreset(TimeRangeEnum.Last6h)).toBe(true)
    expect(isTimeRangePreset('2026-08-01T00:00:00.000Z,2026-08-07T23:59:59.000Z')).toBe(false)
  })
})
