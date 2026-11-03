import { currencyFilter, dashboard, granularityFilter, timeFilter } from './fixtures'

import {
  filtersOfView,
  joinTimeValue,
  readFilterValues,
  resetFilterValues,
  splitTimeValue,
  writeFilterValue,
} from '../filters'
import { findView, viewSlugs } from '../views'

const prefix = 'ad3'

describe('analytics d3set filters', () => {
  it('GIVEN a view WHEN listing its filters THEN it keeps those of its tab and of the view', () => {
    const [tab] = dashboard.tabs
    const [view] = tab.views

    expect(filtersOfView(dashboard.filters, tab, view)).toEqual([timeFilter, currencyFilter])
  })

  it("GIVEN two filters on one column, one per view WHEN listing a view's filters THEN it keeps the one that reaches its charts", () => {
    const [tab] = dashboard.tabs
    const [first, second] = tab.views
    const views = [first, { ...second, rows: [[{ chart: 'chart-other', width: 12 }]] }]
    const ofFirst = { ...currencyFilter, id: 'F-first', tab: tab.id, charts: ['chart-area'] }
    const ofSecond = { ...currencyFilter, id: 'F-second', tab: tab.id, charts: ['chart-other'] }
    const filters = [ofFirst, ofSecond]

    expect(filtersOfView(filters, tab, views[0]).map((f) => f.id)).toEqual(['F-first'])
    expect(filtersOfView(filters, tab, views[1]).map((f) => f.id)).toEqual(['F-second'])
  })

  it('GIVEN no URL value WHEN reading THEN the default applies; an empty value means none', () => {
    const filters = [granularityFilter, currencyFilter]

    expect(readFilterValues(new URLSearchParams(''), filters, prefix)).toEqual({
      granularity: ['month'],
      amount_currency: [],
    })
    expect(
      readFilterValues(
        new URLSearchParams('ad3_granularity=&ad3_amount_currency=EUR&ad3_amount_currency=USD'),
        filters,
        prefix,
      ),
    ).toEqual({ granularity: [], amount_currency: ['EUR', 'USD'] })
  })

  it('GIVEN a change WHEN writing THEN it repeats the key per value and drops the page', () => {
    const next = writeFilterValue(
      new URLSearchParams('ad3_page=3&other=1'),
      prefix,
      currencyFilter,
      ['EUR', 'USD'],
    )

    expect(next.toString()).toBe('other=1&ad3_amount_currency=EUR&ad3_amount_currency=USD')
  })

  it('GIVEN the default value WHEN writing THEN the key goes away', () => {
    const next = writeFilterValue(
      new URLSearchParams('ad3_granularity=week'),
      prefix,
      granularityFilter,
      ['month'],
    )

    expect(next.toString()).toBe('')
  })

  it('GIVEN prefixed keys WHEN resetting THEN only they go away', () => {
    expect(
      resetFilterValues(new URLSearchParams('ad3_time=a,b&ad3_page=2&x=1'), prefix).toString(),
    ).toBe('x=1')
  })

  it('GIVEN a date range WHEN splitting and joining THEN either side may be empty', () => {
    expect(splitTimeValue(',2026-02-01')).toEqual({ from: '', to: '2026-02-01' })
    expect(joinTimeValue('2026-01-01', '')).toEqual(['2026-01-01,'])
    expect(joinTimeValue('', '')).toEqual([])
  })

  it('GIVEN an unknown segment WHEN finding the view THEN it is the first view', () => {
    const slugs = viewSlugs(dashboard)

    expect(findView(dashboard, slugs, 'nope').view?.id).toBe('TAB-SubsActive')
    expect(findView(dashboard, slugs, 'revenue').view?.id).toBe('TAB-Revenue')
    expect(slugs.get('TAB-SubsNew')).toBe('new-subscriptions')
  })
})
