import { screen } from '@testing-library/react'
import { GraphQLError } from 'graphql'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GetRealtimeUsageDimensionsDocument,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { REALTIME_USAGE_ERROR_TEST_ID } from '~/pages/realtimeUsage/common/constants'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_DIMENSIONS_TABLE_TEST_ID,
  RealtimeUsageDimensionsTable,
} from '../RealtimeUsageDimensionsTable'

const QUERY_VARIABLES = {
  billableMetricCode: 'api_calls',
  fromDatetime: '2026-08-24T08:00:00.000Z',
  toDatetime: '2026-08-24T10:30:00.000Z',
}

const request = {
  query: GetRealtimeUsageDimensionsDocument,
  variables: { ...QUERY_VARIABLES, page: 1, limit: DEFAULT_PAGE_SIZE },
}

const dimensionsMock = {
  request,
  result: {
    data: {
      realtimeUsageDimensions: {
        __typename: 'RealtimeUsageDimensionRowCollection',
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
        },
        collection: [
          {
            __typename: 'RealtimeUsageDimensionRow',
            key: '{"region":["eu"]}\u001f',
            name: 'eu',
            points: [
              {
                __typename: 'RealtimeUsageDimensionPoint',
                time: '2026-08-24T09:00:00Z',
                units: 12,
              },
            ],
          },
          {
            __typename: 'RealtimeUsageDimensionRow',
            key: '\u001f',
            name: null,
            points: [
              { __typename: 'RealtimeUsageDimensionPoint', time: '2026-08-24T09:00:00Z', units: 1 },
            ],
          },
        ],
      },
    },
  },
}

const renderTable = (mocks: unknown[]) =>
  render(
    <AnalyticsStateProvider>
      <RealtimeUsageDimensionsTable
        queryVariables={QUERY_VARIABLES}
        skip={false}
        series={[]}
        timeGranularity={RealtimeUsageTimeGranularityEnum.Hour}
        timezone={TimezoneEnum.TzUtc}
      />
    </AnalyticsStateProvider>,
    { mocks: mocks as never },
  )

describe('RealtimeUsageDimensionsTable', () => {
  it('renders one row per dimension, named or default', async () => {
    renderTable([dimensionsMock])

    const table = await screen.findByTestId(REALTIME_USAGE_DIMENSIONS_TABLE_TEST_ID)

    expect(await screen.findByText('eu')).toBeInTheDocument()
    expect(table).toHaveTextContent('Default (no filter)')
  })

  it('renders an error when the report fails', async () => {
    renderTable([{ request, result: { errors: [new GraphQLError('window_too_long')] } }])

    expect(await screen.findByTestId(REALTIME_USAGE_ERROR_TEST_ID)).toBeInTheDocument()
  })
})
