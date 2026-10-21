import { screen } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { Settings } from 'luxon'

import {
  GetRealtimeUsageBillableMetricDocument,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { REALTIME_USAGE_ERROR_TEST_ID } from '~/pages/realtimeUsage/common/constants'
import { render } from '~/test-utils'

import RealtimeUsageBillableMetric, {
  REALTIME_USAGE_BILLABLE_METRIC_TOTAL_TEST_ID,
} from '../RealtimeUsageBillableMetric'

const mockRealtimeUsageEnabled = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { realtimeUsageEnabled: mockRealtimeUsageEnabled() },
    timezone: 'TZ_UTC',
    timezoneConfig: { name: 'UTC' },
  }),
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ billableMetricCode: 'api_calls' }),
}))

jest.mock('~/pages/realtimeUsage/billableMetric/RealtimeUsageDimensionsTable', () => ({
  RealtimeUsageDimensionsTable: () => null,
}))

const NOW = '2026-08-24T10:30:00.000Z'
const originalNow = Settings.now

const request = {
  query: GetRealtimeUsageBillableMetricDocument,
  variables: {
    billableMetricCode: 'api_calls',
    fromDatetime: '2026-08-23T11:00:00.000Z',
    toDatetime: NOW,
  },
}

const reportMock = {
  request,
  result: {
    data: {
      realtimeUsageBillableMetric: {
        __typename: 'RealtimeUsageBillableMetric',
        billableMetricCode: 'api_calls',
        billableMetricName: 'API calls',
        units: 1234.5,
        timeGranularity: RealtimeUsageTimeGranularityEnum.Hour,
        timezone: TimezoneEnum.TzUtc,
        dimensions: [
          { __typename: 'RealtimeUsageDimension', key: '\u001f', name: null, other: false },
        ],
        points: [],
      },
    },
  },
}

beforeEach(() => {
  Settings.now = () => Date.parse(NOW)
  mockRealtimeUsageEnabled.mockReturnValue(true)
  window.history.replaceState({}, '', '/usage/api_calls')
})

afterEach(() => {
  Settings.now = originalNow
})

describe('RealtimeUsageBillableMetric', () => {
  it('renders the metric and its total over the window', async () => {
    render(<RealtimeUsageBillableMetric />, { mocks: [reportMock] })

    expect(
      await screen.findByTestId(REALTIME_USAGE_BILLABLE_METRIC_TOTAL_TEST_ID),
    ).toHaveTextContent('1,234.5')
    expect(screen.getAllByText('API calls').length).toBeGreaterThan(0)
  })

  it('renders an error when the report fails', async () => {
    render(<RealtimeUsageBillableMetric />, {
      mocks: [{ request, result: { errors: [new GraphQLError('window_too_long')] } }],
    })

    expect(await screen.findByTestId(REALTIME_USAGE_ERROR_TEST_ID)).toBeInTheDocument()
  })

  it('does not ask for the report when the organization is not served', async () => {
    mockRealtimeUsageEnabled.mockReturnValue(false)
    const result = jest.fn(() => reportMock.result)

    render(<RealtimeUsageBillableMetric />, { mocks: [{ request, result }] })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result).not.toHaveBeenCalled()
  })
})
