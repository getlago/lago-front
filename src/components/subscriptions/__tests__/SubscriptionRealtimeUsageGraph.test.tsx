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

    // The named filter and the charge default both get their own series; the
    // legend only names them and carries their color.
    expect(legend).toHaveTextContent('Europe')
    expect(legend).toHaveTextContent('Default (no filter)')
    expect(legend).not.toHaveTextContent(/\d/)
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

  it('widens the columns when the window shrinks', async () => {
    // Recharts needs a measured container, which jsdom never gives it.
    const resizeObserver = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ ...new DOMRect(), width: 800, height: 232 })

    global.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    const { container } = render(
      <SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />,
      {
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
      },
    )

    // The rescale animation leaves the columns mid-flight, so every read waits
    // for the settled geometry rather than sampling a frame.
    const columnWidth = (): number | undefined => {
      const path = container.querySelector('.recharts-bar path')
      const xs = (path?.getAttribute('d') || '')
        .match(/-?\d+\.?\d*/g)
        ?.map(Number)
        .filter((_, index) => index % 2 === 0)

      return xs?.length ? Math.max(...xs) - Math.min(...xs) : undefined
    }

    await waitFor(() => expect(columnWidth()).toBe(24))

    fireEvent.click(screen.getByText('6h'))

    await waitFor(() => expect(columnWidth()).toBe(56))

    resizeObserver.mockRestore()
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
