import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import {
  buildChargesMock,
  buildHourlyUsageMock,
  EU_FILTER_ID,
  SUBSCRIPTION_ID,
  US_FILTER_ID,
} from '~/components/subscriptions/realtimeUsage/common/__tests__/fixtures'
import { FeatureFlagEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  REALTIME_LANES_EMPTY_TEST_ID,
  REALTIME_LANES_LANE_NAME_TEST_ID,
  REALTIME_LANES_LANE_TEST_ID,
  REALTIME_LANES_LIST_TEST_ID,
  REALTIME_LANES_SORT_TEST_ID,
} from '../constants'
import { SubscriptionRealtimeUsageLanes } from '../SubscriptionRealtimeUsageLanes'

const mockHasFeatureFlag = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: mockHasFeatureFlag }),
}))

// Europe leads by volume, "Alpha" wins alphabetically, and the charge default
// carries the smallest share — enough to tell sorting and shares apart.
const populatedMock = buildHourlyUsageMock({
  filters: [
    { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 60 },
    { chargeFilterId: US_FILTER_ID, invoiceDisplayName: 'Alpha', units: 30 },
    { chargeFilterId: null, units: 10 },
  ],
  hours: [
    {
      time: '2026-08-24T09:00:00Z',
      units: 50,
      breakdown: [
        { chargeFilterId: EU_FILTER_ID, units: 30 },
        { chargeFilterId: US_FILTER_ID, units: 15 },
        { chargeFilterId: null, units: 5 },
      ],
    },
    {
      time: '2026-08-24T10:00:00Z',
      units: 50,
      breakdown: [
        { chargeFilterId: EU_FILTER_ID, units: 30 },
        { chargeFilterId: US_FILTER_ID, units: 15 },
        { chargeFilterId: null, units: 5 },
      ],
    },
  ],
})

beforeEach(() => {
  mockHasFeatureFlag.mockImplementation((flag) => flag === FeatureFlagEnum.RealtimeUsage)
})

describe('SubscriptionRealtimeUsageLanes', () => {
  it('gives every charge filter its own lane, with its current hour and share', async () => {
    render(<SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [buildChargesMock(), populatedMock],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_LIST_TEST_ID)).toBeVisible())

    const lanes = screen.getAllByTestId(REALTIME_LANES_LANE_TEST_ID)

    // One lane per filter, the charge default included: nothing is folded
    // into an "other" bucket the way the stacked graph has to.
    expect(lanes).toHaveLength(3)
    expect(within(lanes[0]).getByText('Europe')).toBeVisible()
    // Current hour of the leading lane, and its share of the window.
    expect(within(lanes[0]).getByText('30')).toBeVisible()
    expect(within(lanes[0]).getByText('60%')).toBeVisible()
    expect(within(lanes[2]).getByText('Default (no filter)')).toBeVisible()
    expect(within(lanes[2]).getByText('10%')).toBeVisible()

    // The header carries the total the lanes deliberately do not add up on
    // screen, plus who is driving it.
    expect(screen.getByText('100')).toBeVisible()
    expect(screen.getByText('Led by Europe · 60%')).toBeVisible()
  })

  it('reorders the lanes alphabetically when sorting by name', async () => {
    render(<SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [buildChargesMock(), populatedMock],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_LIST_TEST_ID)).toBeVisible())

    const laneNames = (): (string | null)[] =>
      screen.getAllByTestId(REALTIME_LANES_LANE_NAME_TEST_ID).map((name) => name.textContent)

    expect(laneNames()).toEqual(['Europe', 'Alpha', 'Default (no filter)'])

    const sort = screen.getByTestId(REALTIME_LANES_SORT_TEST_ID)

    fireEvent.click(within(sort).getByText('A–Z'))

    await waitFor(() => expect(laneNames()).toEqual(['Alpha', 'Default (no filter)', 'Europe']))
  })

  it('scales each lane to its own peak so a quiet filter still draws a shape', async () => {
    const { container } = render(
      <SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />,
      {
        mocks: [
          buildChargesMock(),
          buildHourlyUsageMock({
            filters: [
              { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 1000 },
              { chargeFilterId: US_FILTER_ID, invoiceDisplayName: 'Quiet', units: 3 },
            ],
            hours: [
              {
                time: '2026-08-24T09:00:00Z',
                units: 1001,
                breakdown: [
                  { chargeFilterId: EU_FILTER_ID, units: 1000 },
                  { chargeFilterId: US_FILTER_ID, units: 1 },
                ],
              },
              {
                time: '2026-08-24T10:00:00Z',
                units: 2,
                breakdown: [
                  { chargeFilterId: EU_FILTER_ID, units: 0 },
                  { chargeFilterId: US_FILTER_ID, units: 2 },
                ],
              },
            ],
          }),
        ],
      },
    )

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_LIST_TEST_ID)).toBeVisible())

    const lanes = screen.getAllByTestId(REALTIME_LANES_LANE_TEST_ID)
    // The 1000-unit hour and the 2-unit hour both reach the top of their own
    // lane: on a shared scale the quiet lane would be a flat line on zero.
    const topOfLane = (lane: Element): number | undefined => {
      const line = lane.querySelector('path[stroke]')?.getAttribute('d') || ''
      const ys = line.match(/,(-?\d+\.?\d*)/g)?.map((y) => Number(y.slice(1)))

      return ys?.length ? Math.min(...ys) : undefined
    }

    expect(topOfLane(lanes[0])).toBe(topOfLane(lanes[1]))
    expect(container.querySelectorAll('path[stroke]')).toHaveLength(3)
  })

  it('scales a lane whose values stay below one to its actual peak', async () => {
    render(<SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        buildHourlyUsageMock({
          filters: [{ chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 0.3 }],
          hours: [
            {
              time: '2026-08-24T09:00:00Z',
              units: 0.1,
              breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 0.1 }],
            },
            {
              time: '2026-08-24T10:00:00Z',
              units: 0.2,
              breakdown: [{ chargeFilterId: EU_FILTER_ID, units: 0.2 }],
            },
          ],
        }),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_LIST_TEST_ID)).toBeVisible())

    const [lane] = screen.getAllByTestId(REALTIME_LANES_LANE_TEST_ID)
    const line = lane.querySelector('path[stroke]')?.getAttribute('d') || ''
    const ys = line.match(/,(-?\d+\.?\d*)/g)?.map((y) => Number(y.slice(1))) || []

    // Guards a peak floored at 1, which drew 0.2 at a fifth of the lane height.
    expect(Math.min(...ys)).toBe(4)
  })

  it('gives the series the API folded its own lane, apart from the charge default', async () => {
    render(<SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [
        buildChargesMock(),
        buildHourlyUsageMock({
          filters: [
            { chargeFilterId: EU_FILTER_ID, invoiceDisplayName: 'Europe', units: 30 },
            { chargeFilterId: null, units: 7 },
            { chargeFilterId: null, units: 3, other: true },
          ],
          hours: [
            {
              time: '2026-08-24T09:00:00Z',
              units: 40,
              breakdown: [
                { chargeFilterId: EU_FILTER_ID, units: 30 },
                { chargeFilterId: null, units: 7 },
                { chargeFilterId: null, units: 3, other: true },
              ],
            },
          ],
        }),
      ],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_LIST_TEST_ID)).toBeVisible())

    const lanes = screen.getAllByTestId(REALTIME_LANES_LANE_TEST_ID)

    expect(
      lanes.map((lane) => within(lane).getByTestId(REALTIME_LANES_LANE_NAME_TEST_ID).textContent),
    ).toEqual(['Europe', 'Default (no filter)', 'Other'])
    expect(lanes[1]).toHaveTextContent('7')
    expect(lanes[2]).toHaveTextContent('3')
  })

  it('renders the empty state when the pipeline has no usage for the charge', async () => {
    render(<SubscriptionRealtimeUsageLanes subscriptionId={SUBSCRIPTION_ID} />, {
      mocks: [buildChargesMock(), buildHourlyUsageMock({ filters: [], hours: [] })],
    })

    await waitFor(() => expect(screen.getByTestId(REALTIME_LANES_EMPTY_TEST_ID)).toBeVisible())
  })
})
