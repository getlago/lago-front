import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Settings } from 'luxon'

import {
  buildCharge,
  buildChargesMock,
  buildHourlyUsageErrorMock,
  buildHourlyUsageMock,
  EU_FILTER_ID,
  FROM_DATETIME_6H,
  FROM_DATETIME_24H,
  NOW,
  SUBSCRIPTION_ID,
} from '~/components/subscriptions/realtimeUsage/common/__tests__/fixtures'
import { AggregationTypeEnum, ChargeModelEnum, FeatureFlagEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_EMPTY_TEST_ID,
  REALTIME_USAGE_LEGEND_TEST_ID,
  REALTIME_USAGE_LIVE_TEST_ID,
  REALTIME_USAGE_TIME_RANGE_TEST_ID,
} from '../constants'
import { SubscriptionRealtimeUsageGraph } from '../SubscriptionRealtimeUsageGraph'

const mockHasFeatureFlag = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: mockHasFeatureFlag }),
}))

const SECOND_CHARGE_ID = 'second-charge-id'

const singleFilterMock = (options: { fromDatetime?: string; label?: string } = {}) =>
  buildHourlyUsageMock({
    fromDatetime: options.fromDatetime,
    filters: [
      { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: options.label || 'Europe', units: 30 },
    ],
    hours: [
      {
        time: '2026-08-24T09:00:00Z',
        units: 20,
        breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 20 }],
      },
    ],
  })

const originalNow = Settings.now

beforeEach(() => {
  Settings.now = () => Date.parse(NOW)
  mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.RealtimeUsage)
})

afterEach(() => {
  Settings.now = originalNow
})

describe('SubscriptionRealtimeUsageGraph', () => {
  it('renders the hourly breakdown, one series per charge filter', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        buildHourlyUsageMock({
          filters: [
            { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 },
            { chargeFilterId: null, units: 4 },
          ],
          hours: [
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
        }),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    const legend = screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)

    expect(legend).toHaveTextContent('Europe')
    expect(legend).toHaveTextContent('Default (no filter)')
    expect(legend).not.toHaveTextContent(/\d/)
  })

  it('does not poll until auto-refresh is turned on', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [buildChargesMock(), singleFilterMock()],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    expect(screen.queryByTestId(REALTIME_USAGE_LIVE_TEST_ID)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '5s' }))

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LIVE_TEST_ID)).toBeVisible())
  })

  it('requests the window matching the selected time range', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        singleFilterMock({ fromDatetime: FROM_DATETIME_24H, label: 'Last 24 hours' }),
        singleFilterMock({ fromDatetime: FROM_DATETIME_6H, label: 'Last 6 hours' }),
      ],
    })

    await waitFor(() =>
      expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toHaveTextContent('Last 24 hours'),
    )

    const timeRange = screen.getByTestId(REALTIME_USAGE_TIME_RANGE_TEST_ID)
    const options = within(timeRange).getAllByRole('button')

    expect(options.map((option) => option.textContent)).toEqual(['6h', '12h', '24h'])
    expect(options[2]).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(options[0])

    await waitFor(() =>
      expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toHaveTextContent('Last 6 hours'),
    )
    expect(options[0]).toHaveAttribute('aria-pressed', 'true')
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
      { mocks: [buildChargesMock(), singleFilterMock()] },
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
      mocks: [buildChargesMock(), buildHourlyUsageMock({ filters: [], hours: [] })],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_EMPTY_TEST_ID)).toBeVisible())
    expect(screen.queryByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).not.toBeInTheDocument()
  })

  it('names a filter without display name by its values', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        buildHourlyUsageMock({
          filters: [{ chargeFilterId: EU_FILTER_ID, values: { region: ['eu', 'uk'] }, units: 30 }],
          hours: [
            {
              time: '2026-08-24T09:00:00Z',
              units: 30,
              breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 30 }],
            },
          ],
        }),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    const legend = screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)

    expect(legend).toHaveTextContent('eu • uk')
    expect(legend).not.toHaveTextContent('Default (no filter)')
  })

  it('keeps the charge default apart from the series the API folded', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        buildHourlyUsageMock({
          filters: [
            { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 },
            { chargeFilterId: null, units: 4 },
            { chargeFilterId: null, units: 2, other: true },
          ],
          hours: [
            {
              time: '2026-08-24T09:00:00Z',
              units: 36,
              breakdown: [
                { chargeFilterId: EU_FILTER_ID, units: 30 },
                { chargeFilterId: null, units: 4 },
                { chargeFilterId: null, units: 2, other: true },
              ],
            },
          ],
        }),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toBeVisible())

    const legend = screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)

    expect(legend.children).toHaveLength(3)
    expect(legend).toHaveTextContent('Europe')
    expect(legend).toHaveTextContent('Default (no filter)')
    expect(legend).toHaveTextContent('Other')
  })

  it('renders an error state when the usage cannot be read', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [buildChargesMock(), buildHourlyUsageErrorMock()],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_USAGE_EMPTY_TEST_ID)).toBeVisible())
    expect(screen.getByTestId(REALTIME_USAGE_EMPTY_TEST_ID)).toHaveTextContent(
      'Something went wrong',
    )
  })

  it('does not keep showing the previous charge usage when the next one fails', async () => {
    render(<SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock([
          buildCharge(),
          buildCharge({ id: SECOND_CHARGE_ID, invoiceDisplayName: 'Storage' }),
        ]),
        singleFilterMock(),
        buildHourlyUsageErrorMock(SECOND_CHARGE_ID),
      ],
    })

    await waitFor(() =>
      expect(screen.getByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).toHaveTextContent('Europe'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Storage' }))

    await waitFor(() =>
      expect(screen.getByTestId(REALTIME_USAGE_EMPTY_TEST_ID)).toHaveTextContent(
        'Something went wrong',
      ),
    )
    expect(screen.queryByTestId(REALTIME_USAGE_LEGEND_TEST_ID)).not.toBeInTheDocument()
  })

  it('renders nothing when the organization is not on the realtime usage flag', async () => {
    mockHasFeatureFlag.mockReturnValue(false)

    const { container } = render(
      <SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />,
      { mocks: [buildChargesMock(), buildHourlyUsageMock({ filters: [], hours: [] })] },
    )

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it.each([
    [
      'an aggregation that does not add up',
      buildCharge({ billableMetric: { aggregationType: AggregationTypeEnum.UniqueCountAgg } }),
    ],
    ['a charge model walking events', buildCharge({ chargeModel: ChargeModelEnum.Percentage })],
    ['a pay in advance charge', buildCharge({ payInAdvance: true })],
    ['a recurring metric', buildCharge({ billableMetric: { recurring: true } })],
  ])('renders nothing when the only charge has %s', async (_, charge) => {
    const { container } = render(
      <SubscriptionRealtimeUsageGraph subscriptionId={SUBSCRIPTION_ID} />,
      { mocks: [buildChargesMock([charge])] },
    )

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
