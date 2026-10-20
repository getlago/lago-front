import { DateTime } from 'luxon'

import { RealtimeUsageTimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'

import {
  DEFAULT_DIMENSION_COLOR,
  DIMENSION_COLORS,
  OTHER_DIMENSION_COLOR,
  SERIES_KEY_PREFIX,
} from '../constants'
import { RealtimeUsageReport } from '../types'
import { buildSeriesAndPoints, formatPeriod, isPartialPeriod, rollingWindowStartOf } from '../utils'

const translate = (key: string): string => key

const NOW = DateTime.fromISO('2026-08-24T10:30:00.000Z')

const report: RealtimeUsageReport = {
  timeGranularity: RealtimeUsageTimeGranularityEnum.Hour,
  dimensions: [
    { key: '{"region":["eu"]}\u001f', name: 'eu', other: false },
    { key: '\u001f', name: null, other: false },
    { key: '{"region":["us"]}\u001f', name: 'us', other: false },
    { key: '__other__', name: null, other: true },
  ],
  points: [
    {
      time: '2026-08-24T09:00:00Z',
      breakdown: [
        { dimensionKey: '{"region":["eu"]}\u001f', units: 10 },
        { dimensionKey: '\u001f', units: 1 },
        { dimensionKey: '{"region":["us"]}\u001f', units: 0 },
        { dimensionKey: '__other__', units: 4 },
      ],
    },
    {
      time: '2026-08-24T10:00:00Z',
      breakdown: [
        { dimensionKey: '{"region":["eu"]}\u001f', units: 2 },
        { dimensionKey: '\u001f', units: 0 },
        { dimensionKey: '{"region":["us"]}\u001f', units: 7 },
        { dimensionKey: '__other__', units: 0 },
      ],
    },
  ],
}

describe('buildSeriesAndPoints', () => {
  it('keeps the order the API ranks the dimensions in, keyed on their rank', () => {
    const { series } = buildSeriesAndPoints(report, translate, NOW)

    expect(series.map((serie) => serie.key)).toEqual(
      [0, 1, 2, 3].map((i) => `${SERIES_KEY_PREFIX}${i}`),
    )
    expect(series.map((serie) => serie.dimensionKey)).toEqual(report.dimensions.map((d) => d.key))
  })

  it('colors the named dimensions in turn and greys out the default and folded ones', () => {
    const { series } = buildSeriesAndPoints(report, translate, NOW)

    expect(series.map((serie) => serie.color)).toEqual([
      DIMENSION_COLORS[0],
      DEFAULT_DIMENSION_COLOR,
      DIMENSION_COLORS[1],
      OTHER_DIMENSION_COLOR,
    ])
    expect(series.map((serie) => serie.label)).toEqual([
      'eu',
      'text_17876075026872bdz1e5aeep',
      'us',
      'text_1787607502687pyo0kxh1flz',
    ])
  })

  it('spreads every period over the series, and flags the period still filling', () => {
    const { points } = buildSeriesAndPoints(report, translate, NOW)

    expect(points).toEqual([
      {
        time: '2026-08-24T09:00:00Z',
        isPartial: false,
        [`${SERIES_KEY_PREFIX}0`]: 10,
        [`${SERIES_KEY_PREFIX}1`]: 1,
        [`${SERIES_KEY_PREFIX}2`]: 0,
        [`${SERIES_KEY_PREFIX}3`]: 4,
      },
      {
        time: '2026-08-24T10:00:00Z',
        isPartial: true,
        [`${SERIES_KEY_PREFIX}0`]: 2,
        [`${SERIES_KEY_PREFIX}1`]: 0,
        [`${SERIES_KEY_PREFIX}2`]: 7,
        [`${SERIES_KEY_PREFIX}3`]: 0,
      },
    ])
  })

  it('returns nothing without a report', () => {
    expect(buildSeriesAndPoints(undefined, translate, NOW)).toEqual({ series: [], points: [] })
  })
})

describe('isPartialPeriod', () => {
  it('compares the end of the period with now', () => {
    expect(
      isPartialPeriod('2026-08-24T09:00:00Z', RealtimeUsageTimeGranularityEnum.Hour, NOW),
    ).toBe(false)
    expect(isPartialPeriod('2026-08-24T00:00:00Z', RealtimeUsageTimeGranularityEnum.Day, NOW)).toBe(
      true,
    )
  })
})

describe('formatPeriod', () => {
  it('shows the hour of hourly periods and only the date of daily ones', () => {
    expect(
      formatPeriod(
        '2026-08-24T09:00:00Z',
        RealtimeUsageTimeGranularityEnum.Hour,
        TimezoneEnum.TzUtc,
      ),
    ).toBe('Aug 24, 2026, 09:00')
    expect(
      formatPeriod(
        '2026-08-24T00:00:00Z',
        RealtimeUsageTimeGranularityEnum.Day,
        TimezoneEnum.TzUtc,
      ),
    ).toBe('Aug 24, 2026')
  })
})

describe('rollingWindowStartOf', () => {
  it('starts the window on the hour wall, counting the current hour in', () => {
    expect(rollingWindowStartOf(NOW, 24, 'UTC')).toBe('2026-08-23T11:00:00.000Z')
  })

  it("snaps to the organization's hour walls under a half-hour offset", () => {
    // 10:30 UTC is 16:00 in Kolkata, whose hour starts at 10:30 UTC.
    expect(rollingWindowStartOf(NOW, 6, 'Asia/Kolkata')).toBe('2026-08-24T05:30:00.000Z')
  })
})
