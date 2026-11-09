import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { EVENT_DETAILS_PRECISE_TOTAL_AMOUNT_TEST_ID, EventDetails } from '../EventDetails'
import {
  EVENT_CODE_PARAM,
  EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM,
  EVENT_TIMESTAMP_MS_PARAM,
} from '../eventKey'

const mockUseGetSingleEventQuery = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/CodeSnippet', () => ({
  CodeSnippet: ({ code }: { code: string }) => <pre data-test="code-snippet">{code}</pre>,
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSingleEventQuery: (options: unknown) => mockUseGetSingleEventQuery(options),
}))

const CODE_SNIPPET_TEST_ID = 'code-snippet'

const payload = {
  event: {
    transaction_id: 'transaction-1',
    external_subscription_id: 'subscription-1',
    code: 'api_calls',
    timestamp: 1740000000,
    properties: { amount: 12 },
  },
}

const buildEvent = (preciseTotalAmountCents: string | null) => ({
  id: 'event-1',
  code: 'api_calls',
  transactionId: 'transaction-1',
  timestamp: '2025-02-19T21:20:00Z',
  timestampMs: '1740000000123',
  receivedAt: '2025-02-19T21:20:01Z',
  payload,
  billableMetricName: 'API calls',
  matchBillableMetric: true,
  matchCustomField: true,
  apiClient: null,
  ipAddress: null,
  externalSubscriptionId: 'subscription-1',
  customerTimezone: 'TZ_UTC',
  preciseTotalAmountCents,
})

const setUrl = (search = ''): void => {
  window.history.pushState({}, '', `/devtool/events${search}`)
}

describe('EventDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setUrl()
    mockUseGetSingleEventQuery.mockReturnValue({ data: undefined, loading: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN an event selected by its whole dedup tuple', () => {
    describe('WHEN the details are fetched', () => {
      it('THEN should query with every key field', () => {
        setUrl(
          `?${EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM}=subscription-1&${EVENT_TIMESTAMP_MS_PARAM}=1740000000123&${EVENT_CODE_PARAM}=api_calls`,
        )

        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        expect(mockUseGetSingleEventQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              transactionId: 'transaction-1',
              externalSubscriptionId: 'subscription-1',
              timestampMs: '1740000000123',
              code: 'api_calls',
            },
            skip: false,
          }),
        )
      })

      it('THEN should pass timestampMs back untouched, as a string', () => {
        setUrl(`?${EVENT_TIMESTAMP_MS_PARAM}=1740000000123`)

        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        const { variables } = mockUseGetSingleEventQuery.mock.calls[0][0]

        expect(variables.timestampMs).toBe('1740000000123')
      })
    })
  })

  describe('GIVEN a url carrying only a transactionId', () => {
    describe('WHEN the details are fetched', () => {
      it('THEN should send the missing key fields as null', () => {
        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        expect(mockUseGetSingleEventQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              transactionId: 'transaction-1',
              externalSubscriptionId: null,
              timestampMs: null,
              code: null,
            },
          }),
        )
      })
    })
  })

  describe('GIVEN no event in the url', () => {
    describe('WHEN the component renders', () => {
      it('THEN should skip the query', () => {
        render(<EventDetails goBack={jest.fn()} />, { useParams: {} })

        expect(mockUseGetSingleEventQuery).toHaveBeenCalledWith(
          expect.objectContaining({ skip: true }),
        )
      })
    })
  })

  describe('GIVEN an event with a precise total amount', () => {
    describe('WHEN the details are displayed', () => {
      it('THEN should show the precise total amount row with the value as returned', () => {
        mockUseGetSingleEventQuery.mockReturnValue({
          data: { event: buildEvent('1234.567') },
          loading: false,
        })

        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        expect(screen.getByTestId(EVENT_DETAILS_PRECISE_TOTAL_AMOUNT_TEST_ID)).toHaveTextContent(
          '1234.567',
        )
      })
    })
  })

  describe('GIVEN an event without a precise total amount', () => {
    describe('WHEN the details are displayed', () => {
      it('THEN should not show the precise total amount row', () => {
        mockUseGetSingleEventQuery.mockReturnValue({
          data: { event: buildEvent(null) },
          loading: false,
        })

        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        expect(
          screen.queryByTestId(EVENT_DETAILS_PRECISE_TOTAL_AMOUNT_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should render the payload block unchanged', () => {
        mockUseGetSingleEventQuery.mockReturnValue({
          data: { event: buildEvent(null) },
          loading: false,
        })

        render(<EventDetails goBack={jest.fn()} />, { useParams: { '*': 'transaction-1' } })

        expect(screen.getByTestId(CODE_SNIPPET_TEST_ID)).toHaveTextContent(
          JSON.stringify(payload, null, 2),
          { normalizeWhitespace: false },
        )
      })
    })
  })
})
