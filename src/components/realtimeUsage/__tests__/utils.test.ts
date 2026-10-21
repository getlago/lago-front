import { DateTime } from 'luxon'

import { TimezoneEnum } from '~/generated/graphql'

import { windowStartOf } from '../utils'

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
