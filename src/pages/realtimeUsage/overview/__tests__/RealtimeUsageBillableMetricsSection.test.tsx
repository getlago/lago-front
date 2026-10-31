import { screen } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { DateTime } from 'luxon'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GetRealtimeUsageBillableMetricsDocument,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { REALTIME_USAGE_ERROR_TEST_ID } from '~/pages/realtimeUsage/common/constants'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID,
  REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID,
  RealtimeUsageBillableMetricsSection,
} from '../RealtimeUsageBillableMetricsSection'

const FILTERS = {
  fromDatetime: '2026-08-23T11:00:00.000Z',
  toDatetime: '2026-08-24T10:30:00.000Z',
}
const NOW = DateTime.fromISO(FILTERS.toDatetime)

const request = {
  query: GetRealtimeUsageBillableMetricsDocument,
  variables: { ...FILTERS, page: 1, limit: DEFAULT_PAGE_SIZE },
}

const buildMock = (collection: unknown[]) => ({
  request,
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
    render(<RealtimeUsageBillableMetricsSection filters={FILTERS} now={NOW} skip={false} />, {
      mocks: [buildMock([report])],
    })

    const link = await screen.findByTestId(REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID)

    expect(link).toHaveTextContent('API calls')
    expect(link.getAttribute('href')).toContain('/usage/api_calls')
  })

  it('renders an empty state without billable metric', async () => {
    render(<RealtimeUsageBillableMetricsSection filters={FILTERS} now={NOW} skip={false} />, {
      mocks: [buildMock([])],
    })

    expect(
      await screen.findByTestId(REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID),
    ).toBeInTheDocument()
  })

  it('renders an error rather than an empty state when the report fails', async () => {
    render(<RealtimeUsageBillableMetricsSection filters={FILTERS} now={NOW} skip={false} />, {
      mocks: [{ request, result: { errors: [new GraphQLError('window_too_long')] } }],
    })

    expect(await screen.findByTestId(REALTIME_USAGE_ERROR_TEST_ID)).toBeInTheDocument()
    expect(
      screen.queryByTestId(REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID),
    ).not.toBeInTheDocument()
  })
})
