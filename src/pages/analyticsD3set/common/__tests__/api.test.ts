import { AUTH_TOKEN_LS_KEY, setCurrentOrganizationId } from '~/core/apolloClient/reactiveVars'

import {
  areaChart,
  currencyFilter,
  dashboard,
  granularityFilter,
  stackedBarChart,
  tableChart,
  timeFilter,
} from './fixtures'

import {
  AnalyticsApiError,
  buildAnalyticsUrl,
  buildChartEventsUrl,
  buildChartParams,
  buildFilterOptionsParams,
  fetchAnalyticsDashboard,
  fetchAnalyticsFilterOptions,
  getAnalyticsHeaders,
} from '../api'

const filters = [timeFilter, currencyFilter, granularityFilter]

describe('analytics d3set api', () => {
  afterEach(() => {
    localStorage.clear()
    setCurrentOrganizationId(null)
    jest.restoreAllMocks()
  })

  describe('buildChartParams', () => {
    it('GIVEN filter values WHEN building the params of a chart THEN it sends only the filters that list the chart', () => {
      const params = buildChartParams(areaChart, filters, {
        time: ['2026-01-01,2026-06-30'],
        amount_currency: ['EUR', 'USD'],
        granularity: ['week'],
      })

      expect(params).toEqual({ time: '2026-01-01,2026-06-30', amount_currency: ['EUR', 'USD'] })
    })

    it('GIVEN empty values WHEN building the params THEN it leaves the filter out', () => {
      expect(buildChartParams(stackedBarChart, filters, { granularity: [] })).toEqual({})
    })

    it('GIVEN a single select WHEN building the params THEN it sends one value', () => {
      expect(buildChartParams(stackedBarChart, filters, { granularity: ['month'] })).toEqual({
        granularity: 'month',
      })
    })

    it('GIVEN a table WHEN building the params THEN it adds the 0-based page', () => {
      expect(buildChartParams(tableChart, filters, { time: [',2026-06-30'] }, 2)).toEqual({
        time: ',2026-06-30',
        page: '2',
      })
      expect(buildChartParams(tableChart, filters, {})).toEqual({ page: '0' })
    })

    it('GIVEN a table without server pages WHEN building the params THEN it sends no page', () => {
      const unpaged = { ...tableChart, pageSize: undefined }

      expect(buildChartParams(unpaged, filters, {}, 2)).toEqual({})
    })
  })

  it('GIVEN a select filter WHEN building its options params THEN it sends the other filters', () => {
    expect(
      buildFilterOptionsParams(currencyFilter, filters, {
        amount_currency: ['EUR'],
        time: ['2026-01-01,'],
      }),
    ).toEqual({ time: '2026-01-01,' })
  })

  it('GIVEN a base URL with a trailing slash WHEN building URLs THEN they are under /api', () => {
    expect(buildAnalyticsUrl('http://localhost:3300/', '/dashboard')).toBe(
      'http://localhost:3300/api/dashboard',
    )
    expect(buildChartEventsUrl('http://a.test', 'id/1')).toBe(
      'http://a.test/api/charts/id%2F1/stream',
    )
  })

  it('GIVEN a logged-in user WHEN building headers THEN they carry the token and the organization', () => {
    localStorage.setItem(AUTH_TOKEN_LS_KEY, 'token-1')
    setCurrentOrganizationId('org-1')

    expect(getAnalyticsHeaders('/acme/analytics-d3set')).toEqual({
      authorization: 'Bearer token-1',
      'x-lago-organization': 'org-1',
    })
  })

  it('GIVEN the server answers WHEN fetching the dashboard THEN it sends the headers and returns the body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => dashboard })

    global.fetch = fetchMock as unknown as typeof fetch

    const result = await fetchAnalyticsDashboard({
      baseUrl: 'http://a.test',
      headers: { authorization: 'Bearer t' },
    })

    expect(result).toBe(dashboard)
    expect(fetchMock).toHaveBeenCalledWith('http://a.test/api/dashboard', {
      headers: { authorization: 'Bearer t' },
      signal: undefined,
    })
  })

  it('GIVEN the server refuses WHEN fetching the dashboard THEN it throws its status and message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ error: 'No analytics access.' }),
    }) as unknown as typeof fetch

    await expect(
      fetchAnalyticsDashboard({ baseUrl: 'http://a.test', headers: {} }),
    ).rejects.toEqual(new AnalyticsApiError(403, 'No analytics access.'))
  })

  it('GIVEN other filters WHEN fetching filter options THEN they go in the query string', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ values: ['EUR', 1] }) })

    global.fetch = fetchMock as unknown as typeof fetch

    const values = await fetchAnalyticsFilterOptions({
      baseUrl: 'http://a.test',
      filterId: 'NATIVE_FILTER-currency',
      params: { time: '2026-01-01,', plan_code: ['a', 'b'] },
      headers: {},
    })

    expect(values).toEqual(['EUR', '1'])
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://a.test/api/filters/NATIVE_FILTER-currency/options?time=2026-01-01%2C&plan_code=a&plan_code=b',
    )
  })
})
