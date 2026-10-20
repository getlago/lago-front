import { screen } from '@testing-library/react'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GetRealtimeUsageBillableMetricsDocument,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID,
  REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID,
  RealtimeUsageBillableMetricsSection,
} from '../RealtimeUsageBillableMetricsSection'

const FILTERS = { fromDatetime: '2026-08-23T11:00:00.000Z' }

const buildMock = (collection: unknown[]) => ({
  request: {
    query: GetRealtimeUsageBillableMetricsDocument,
    variables: { ...FILTERS, page: 1, limit: DEFAULT_PAGE_SIZE },
  },
  result: {
    data: {
      realtimeUsageBillableMetrics: {
        __typename: 'RealtimeUsageBillableMetricCollection',
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: collection.length,
        },
        collection,
      },
    },
  },
})

const report = {
  __typename: 'RealtimeUsageBillableMetric',
  billableMetricId: 'bm-1',
  billableMetricCode: 'api_calls',
  billableMetricName: 'API calls',
  units: 12,
  timeGranularity: RealtimeUsageTimeGranularityEnum.Hour,
  timezone: TimezoneEnum.TzUtc,
  dimensions: [{ __typename: 'RealtimeUsageDimension', key: '\u001f', name: null, other: false }],
  points: [
    {
      __typename: 'RealtimeUsagePoint',
      time: '2026-08-24T09:00:00Z',
      breakdown: [{ __typename: 'RealtimeUsagePointBreakdown', dimensionKey: '\u001f', units: 12 }],
    },
  ],
}

describe('RealtimeUsageBillableMetricsSection', () => {
  it('renders one chart per billable metric, linking to its page', async () => {
    render(<RealtimeUsageBillableMetricsSection filters={FILTERS} pollInterval={0} />, {
      mocks: [buildMock([report])],
    })

    const link = await screen.findByTestId(REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID)

    expect(link).toHaveTextContent('API calls')
    expect(link.getAttribute('href')).toContain('/usage/api_calls')
  })

  it('renders an empty state without billable metric', async () => {
    render(<RealtimeUsageBillableMetricsSection filters={FILTERS} pollInterval={0} />, {
      mocks: [buildMock([])],
    })

    expect(
      await screen.findByTestId(REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID),
    ).toBeInTheDocument()
  })
})
