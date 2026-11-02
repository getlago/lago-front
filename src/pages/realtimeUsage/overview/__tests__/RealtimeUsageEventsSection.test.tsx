import { screen } from '@testing-library/react'
import { GraphQLError } from 'graphql'

import {
  GetRealtimeUsageEventsDocument,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { REALTIME_USAGE_ERROR_TEST_ID } from '~/pages/realtimeUsage/common/constants'
import { render } from '~/test-utils'

import {
  REALTIME_USAGE_EVENTS_TOTAL_TEST_ID,
  RealtimeUsageEventsSection,
} from '../RealtimeUsageEventsSection'

const FILTERS = {
  fromDatetime: '2026-08-23T11:00:00.000Z',
  toDatetime: '2026-08-24T10:30:00.000Z',
}

const request = { query: GetRealtimeUsageEventsDocument, variables: FILTERS }

describe('RealtimeUsageEventsSection', () => {
  it('renders the events received over the window', async () => {
    render(<RealtimeUsageEventsSection filters={FILTERS} skip={false} />, {
      mocks: [
        {
          request,
          result: {
            data: {
              realtimeUsageEvents: {
                __typename: 'RealtimeUsageEvents',
                eventsCount: '1234',
                timeGranularity: RealtimeUsageTimeGranularityEnum.Hour,
                timezone: TimezoneEnum.TzUtc,
                points: [
                  {
                    __typename: 'RealtimeUsageEventsPoint',
                    time: '2026-08-24T09:00:00Z',
                    eventsCount: '1000',
                  },
                  {
                    __typename: 'RealtimeUsageEventsPoint',
                    time: '2026-08-24T10:00:00Z',
                    eventsCount: '234',
                  },
                ],
              },
            },
          },
        },
      ],
    })

    expect(await screen.findByTestId(REALTIME_USAGE_EVENTS_TOTAL_TEST_ID)).toHaveTextContent(
      '1,234',
    )
  })

  it('renders an error rather than no event when the report fails', async () => {
    render(<RealtimeUsageEventsSection filters={FILTERS} skip={false} />, {
      mocks: [{ request, result: { errors: [new GraphQLError('usage_buckets_read_failure')] } }],
    })

    expect(await screen.findByTestId(REALTIME_USAGE_ERROR_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByTestId(REALTIME_USAGE_EVENTS_TOTAL_TEST_ID)).not.toBeInTheDocument()
  })
})
