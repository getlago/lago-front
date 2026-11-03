import { ChartProps } from '@d3set/react'
import { screen, waitFor, within } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  ANALYTICS_D3SET_CHART_CARD_TEST_ID,
  ANALYTICS_D3SET_CHART_EMPTY_TEST_ID,
} from '../AnalyticsD3setChartCard'
import {
  ANALYTICS_D3SET_DASHBOARD_TEST_ID,
  ANALYTICS_D3SET_ERROR_TEST_ID,
  AnalyticsD3setDashboard,
} from '../AnalyticsD3setDashboard'
import { ANALYTICS_D3SET_FILTER_BAR_TEST_ID } from '../AnalyticsD3setFilterBar'
import { dashboard } from '../common/__tests__/fixtures'
import { useChartRows } from '../common/useChartRows'

const CHART_TEST_ID = 'd3set-chart'

jest.mock('@d3set/react', () => ({
  Chart: ({ spec }: ChartProps) => (
    <div data-test="d3set-chart" data-type={spec.type}>
      {spec.title}
    </div>
  ),
}))

jest.mock('../common/useChartRows', () => ({
  useChartRows: jest.fn(),
}))

const ROUTES = { base: '/analytics-d3set', tab: '/analytics-d3set/:tab' }

const mockRows = (chartId: string) => {
  if (chartId === 'chart-area') {
    return {
      rows: [
        { month: '2026-01-01', active_subscriptions: 10 },
        { month: '2026-02-01', active_subscriptions: 15 },
      ],
      total: 2,
      status: 'ready',
    }
  }

  return { rows: [], total: 0, status: 'ready' }
}

describe('AnalyticsD3setDashboard', () => {
  beforeEach(() => {
    ;(useChartRows as jest.Mock).mockImplementation(({ chartId }) => mockRows(chartId))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('GIVEN the server dashboard WHEN the page renders THEN it shows the tabs, the view filters and its charts', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => dashboard,
    }) as unknown as typeof fetch

    render(<AnalyticsD3setDashboard baseUrl="http://a.test" routes={ROUTES} />)

    await waitFor(() =>
      expect(screen.getByTestId(ANALYTICS_D3SET_DASHBOARD_TEST_ID)).toBeInTheDocument(),
    )

    expect(global.fetch).toHaveBeenCalledWith('http://a.test/api/dashboard', expect.anything())
    expect(screen.getByText('Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('New subscriptions')).toBeInTheDocument()

    const filterBar = screen.getByTestId(ANALYTICS_D3SET_FILTER_BAR_TEST_ID)

    expect(within(filterBar).getByText('Date range')).toBeInTheDocument()
    expect(within(filterBar).getByText('Currency')).toBeInTheDocument()
    expect(within(filterBar).queryByText('Granularity')).not.toBeInTheDocument()

    const cards = screen.getAllByTestId(ANALYTICS_D3SET_CHART_CARD_TEST_ID)

    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('Active subscriptions over time')).toBeInTheDocument()
    expect(within(cards[0]).getByTestId(CHART_TEST_ID)).toHaveAttribute('data-type', 'area')
    expect(within(cards[0]).getByText('15')).toBeInTheDocument()
    expect(within(cards[1]).getByTestId(ANALYTICS_D3SET_CHART_EMPTY_TEST_ID)).toBeInTheDocument()
    expect(useChartRows).toHaveBeenCalledWith({
      baseUrl: 'http://a.test',
      chartId: 'chart-table',
      params: { page: '0' },
    })
  })

  it('GIVEN the server refuses WHEN the page renders THEN it shows the error placeholder', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'No token.' }),
    }) as unknown as typeof fetch

    render(<AnalyticsD3setDashboard baseUrl="http://a.test" routes={ROUTES} />)

    await waitFor(() =>
      expect(screen.getByTestId(ANALYTICS_D3SET_ERROR_TEST_ID)).toBeInTheDocument(),
    )
  })
})
