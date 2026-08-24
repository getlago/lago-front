import { fireEvent, screen, waitFor } from '@testing-library/react'

import {
  AggregationTypeEnum,
  GetSubscriptionChargesForRealtimeUsageDocument,
  GetSubscriptionHourlyUsageDocument,
  TimezoneEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_EMPTY_TEST_ID,
  REALTIME_USAGE_LEGEND_TEST_ID,
  REALTIME_USAGE_LIVE_TEST_ID,
  REALTIME_USAGE_TABLE_TEST_ID,
  REALTIME_USAGE_TIME_RANGE_TEST_ID,
  SubscriptionRealtimeUsageGraph,
} from '../SubscriptionRealtimeUsageGraph'

const SUBSCRIPTION_ID = 'subscription-id'
const CHARGE_ID = 'charge-id'
const EU_FILTER_ID = 'filter-eu'

const chargesMock = {
  request: {
    query: GetSubscriptionChargesForRealtimeUsageDocument,
    variables: { subscriptionId: SUBSCRIPTION_ID },
  },
  result: {
    data: {
      subscription: {
        id: SUBSCRIPTION_ID,
        customer: { id: 'customer-id', applicableTimezone: TimezoneEnum.TzUtc },
        plan: {
          id: 'plan-id',
          charges: [
            {
              id: CHARGE_ID,
              invoiceDisplayName: 'API calls',
              billableMetric: {
                id: 'bm-id',
                code: 'count_bm',
                name: 'Count BM',
                aggregationType: AggregationTypeEnum.CountAgg,
              },
            },
          ],
        },
      },
    },
  },
}

const hourlyUsageMock = (
  filters: { chargeFilterId: string | null; invoiceDisplayName: string | null; units: number }[],
  hours: {
    time: string
    units: number
    breakdown: { chargeFilterId: string | null; units: number }[]
  }[],
) => ({
  request: { query: GetSubscriptionHourlyUsageDocument },
  variableMatcher: () => true,
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      subscriptionHourlyUsage: {
        fromDatetime: '2026-08-24T09:00:00Z',
        toDatetime: '2026-08-24T11:30:00Z',
        timezone: TimezoneEnum.TzUtc,
        aggregationType: AggregationTypeEnum.CountAgg,
        filters: filters.map((filter) => ({ ...filter, eventsCount: filter.units })),
        hours: hours.map((hour) => ({ ...hour, eventsCount: hour.units })),
      },
    },
  },
})

describe('SubscriptionRealtimeUsageGraph', () => {
  it('renders the hourly breakdown, one series per charge filter', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        chargesMock,
        hourlyUsageMock(
          [
            { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 },
            { chargeFilterId: null, invoiceDisplayName: null, units: 4 },
          ],
          [
            {
              time: '2026-08-24T09:00:00Z',
              units: 22,
              breakdown: [
                { chargeFilterId: EU_FILTER_ID, units: 20 },
                { chargeFilterId: null, units: 2 },
              ],
            },
            {
              time: '2026-08-24T10:00:00Z',
              units: 12,
              breakdown: [
                { chargeFilterId: EU_FILTER_ID, units: 10 },
                { chargeFilterId: null, units: 2 },
              ],
            },
          ],
        ),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    const legend = screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)

    // The named filter and the charge default both get their own series, and
    // the legend shows the current (last) hour of each.
    expect(legend).toHaveTextContent('Europe')
    expect(legend).toHaveTextContent('10')
    expect(legend).toHaveTextContent('2')

    const table = screen.getByTestId(REALTIME_USAGE_TABLE_TEST_ID)

    expect(table).toHaveTextContent('Europe')
    // Most recent hour first, with its per-filter values and the row total.
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(table.querySelectorAll('tbody tr')[0]).toHaveTextContent('12')
    expect(table.querySelectorAll('tbody tr')[1]).toHaveTextContent('22')
  })

  it('does not poll until auto-refresh is turned on', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        chargesMock,
        hourlyUsageMock(
          [{ chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 }],
          [
            {
              time: '2026-08-24T09:00:00Z',
              units: 20,
              breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 20 }],
            },
          ],
        ),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    // Auto-refresh defaults to off, so the graph must not claim to be live.
    expect(screen.queryByTestId(REALTIME_USAGE_LIVE_TEST_ID)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '5s' }))

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LIVE_TEST_ID)).toBeVisible())
  })

  it('switches the time range from the segmented control', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        chargesMock,
        hourlyUsageMock(
          [{ chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 }],
          [
            {
              time: '2026-08-24T09:00:00Z',
              units: 20,
              breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 20 }],
            },
          ],
        ),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_TIME_RANGE_TEST_ID)).toBeVisible())

    const timeRange = screen.getByTestId(REALTIME_USAGE_TIME_RANGE_TEST_ID)
    const options = timeRange.querySelectorAll('button')

    expect([...options].map((option) => option.textContent)).toEqual(['6h', '12h', '24h'])
    // 24h is the default selection.
    expect(options[2]).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(options[0])

    await waitFor(() => expect(options[0]).toHaveAttribute('aria-pressed', 'true'))
    expect(options[2]).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the empty state when the pipeline has no usage for the charge', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [chargesMock, hourlyUsageMock([], [])],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_EMPTY_TEST_ID)).toBeVisible())
    expect(screen.queryByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).not.toBeInTheDocument()
  })

  it('renders nothing when the plan has no realtime-eligible charge', async () => {
    const { container } = render(
      <SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />,
      {
        mocks: [
          {
            ...chargesMock,
            result: {
              data: {
                subscription: {
                  ...chargesMock.result.data.subscription,
                  plan: {
                    id: 'plan-id',
                    charges: [
                      {
                        id: 'other-charge',
                        invoiceDisplayName: null,
                        billableMetric: {
                          id: 'bm-2',
                          code: 'unique_bm',
                          name: 'Unique BM',
                          aggregationType: AggregationTypeEnum.UniqueCountAgg,
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    )

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
