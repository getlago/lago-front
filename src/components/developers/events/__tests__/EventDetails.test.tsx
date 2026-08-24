import { render } from '~/test-utils'

import { EventDetails } from '../EventDetails'
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

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSingleEventQuery: (options: unknown) => mockUseGetSingleEventQuery(options),
}))

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
})
