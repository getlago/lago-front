import { DateTime } from 'luxon'

import {
  DEFAULT_FILTER_COLOR,
  FILTER_COLORS,
  OTHER_FILTER_COLOR,
} from '~/components/subscriptions/realtimeUsage/graph/constants'
import { RealtimeUsageTimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'

import { SERIES_KEY_PREFIX } from '../constants'
import { RealtimeUsageReport } from '../types'
import {
  buildDimensionSeries,
  formatPeriod,
  heldKeyOf,
  isApplicableRange,
  isPartialPeriod,
} from '../utils'

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

describe('buildDimensionSeries', () => {
  it('keeps the order the API ranks the dimensions in, keyed on their rank', () => {
    const { series } = buildDimensionSeries(report, translate, NOW)

    expect(series.map((serie) => serie.key)).toEqual(
      [0, 1, 2, 3].map((i) => `${SERIES_KEY_PREFIX}${i}`),
    )
    expect(series.map((serie) => serie.dimensionKey)).toEqual(report.dimensions.map((d) => d.key))
  })

  it('colors the named dimensions in turn and greys out the default and folded ones', () => {
    const { series } = buildDimensionSeries(report, translate, NOW)

    expect(series.map((serie) => serie.color)).toEqual([
      FILTER_COLORS[0],
      DEFAULT_FILTER_COLOR,
      FILTER_COLORS[1],
      OTHER_FILTER_COLOR,
    ])
    expect(series.map((serie) => serie.label)).toEqual([
      'eu',
      'text_17876075026872bdz1e5aeep',
      'us',
      'text_1787607502687pyo0kxh1flz',
    ])
  })

  it('spreads every period over the series, and flags the period still filling', () => {
    const { points } = buildDimensionSeries(report, translate, NOW)

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
    expect(buildDimensionSeries(undefined, translate, NOW)).toEqual({ series: [], points: [] })
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

describe('heldKeyOf', () => {
  it('ignores the window, which moves on every refresh', () => {
    expect(heldKeyOf({ page: 1, fromDatetime: 'a', toDatetime: 'b' })).toBe(
      heldKeyOf({ page: 1, fromDatetime: 'c', toDatetime: 'd' }),
    )
  })

  it('tells apart anything else the query reads', () => {
    expect(heldKeyOf({ page: 1 })).not.toBe(heldKeyOf({ page: 2 }))
    expect(heldKeyOf({ externalCustomerId: 'a' })).not.toBe(heldKeyOf({ externalCustomerId: 'b' }))
  })
})
