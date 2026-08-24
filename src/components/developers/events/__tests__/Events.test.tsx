import { ReactNode } from 'react'

import { render, testMockNavigateFn } from '~/test-utils'

import {
  buildEventLink,
  EVENT_CODE_PARAM,
  EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM,
  EVENT_TIMESTAMP_MS_PARAM,
  serializeEventKey,
} from '../eventKey'
import { Events } from '../Events'

const mockSetActiveRow = jest.fn()
const mockUpdateView = jest.fn()
const mockUseEventsQuery = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/utils/getCurrentBreakpoint', () => ({
  getCurrentBreakpoint: () => 'md',
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useEventsQuery: () => mockUseEventsQuery(),
}))

jest.mock('~/components/developers/events/EventTable', () => ({
  EventTable: () => <div data-test="event-table-mock" />,
}))

jest.mock('~/components/developers/events/EventDetails', () => ({
  EventDetails: () => <div data-test="event-details-mock" />,
}))

jest.mock('~/components/developers/LogsLayout', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  return {
    LogsLayout: {
      CTASection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      ListSection: forwardRef(
        (
          { leftSide, rightSide }: { leftSide: ReactNode; rightSide: ReactNode },
          ref: React.Ref<unknown>,
        ) => {
          useImperativeHandle(ref, () => ({
            setActiveRow: mockSetActiveRow,
            updateView: mockUpdateView,
          }))

          return (
            <div>
              {leftSide}
              {rightSide}
            </div>
          )
        },
      ),
    },
  }
})

const firstEvent = {
  __typename: 'Event' as const,
  id: 'organization-1-subscription-1-transaction-1-1740000000',
  transactionId: 'transaction-1',
  externalSubscriptionId: 'subscription-1',
  timestampMs: '1740000000123',
  code: 'api_calls',
  receivedAt: '2026-02-19T00:00:00Z',
}

const duplicateEvent = { ...firstEvent, code: 'storage' }

const setUrl = (search = ''): void => {
  window.history.pushState({}, '', `/devtool/events${search}`)
}

describe('Events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setUrl()
    mockUseEventsQuery.mockReturnValue({
      data: {
        events: {
          collection: [firstEvent, duplicateEvent],
          metadata: { currentPage: 1, totalPages: 1, totalCount: 2 },
        },
      },
      loading: false,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN no event is selected in the url', () => {
    describe('WHEN the list has loaded', () => {
      it('THEN should redirect to the first event with its whole dedup tuple', () => {
        render(<Events />)

        expect(testMockNavigateFn).toHaveBeenCalledWith(buildEventLink(firstEvent), {
          replace: true,
        })
      })

      it('THEN should not highlight any row', () => {
        render(<Events />)

        expect(mockSetActiveRow).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the list is empty', () => {
      it('THEN should not redirect', () => {
        mockUseEventsQuery.mockReturnValue({
          data: { events: { collection: [], metadata: {} } },
          loading: false,
          refetch: jest.fn(),
        })

        render(<Events />)

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN two events sharing a transactionId', () => {
    describe('WHEN the url selects the first one', () => {
      it('THEN should highlight the row matching its dedup tuple', () => {
        setUrl(
          `?${EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM}=subscription-1&${EVENT_TIMESTAMP_MS_PARAM}=1740000000123&${EVENT_CODE_PARAM}=api_calls`,
        )

        render(<Events />, { useParams: { '*': 'transaction-1' } })

        expect(mockSetActiveRow).toHaveBeenCalledWith(serializeEventKey(firstEvent))
      })
    })

    describe('WHEN the url selects the duplicate', () => {
      it('THEN should highlight the other row, not the first one', () => {
        setUrl(
          `?${EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM}=subscription-1&${EVENT_TIMESTAMP_MS_PARAM}=1740000000123&${EVENT_CODE_PARAM}=storage`,
        )

        render(<Events />, { useParams: { '*': 'transaction-1' } })

        expect(mockSetActiveRow).toHaveBeenCalledWith(serializeEventKey(duplicateEvent))
        expect(mockSetActiveRow).not.toHaveBeenCalledWith(serializeEventKey(firstEvent))
      })
    })

    describe('WHEN an event is already selected', () => {
      it('THEN should not redirect to the first event', () => {
        render(<Events />, { useParams: { '*': 'transaction-1' } })

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
