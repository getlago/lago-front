import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RefObject } from 'react'

import { ListSectionRef } from '~/components/developers/LogsLayout'
import { EventsQueryResult } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import { buildEventLink, serializeEventKey } from '../eventKey'
import { EventTable } from '../EventTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/helpers/useFormatterDateHelper', () => ({
  useFormatterDateHelper: () => ({
    formattedDateTimeWithSecondsOrgaTZ: (date: string) => date,
  }),
}))

jest.mock('~/core/utils/getCurrentBreakpoint', () => ({
  getCurrentBreakpoint: () => 'md',
}))

const anEvent = (overrides: Record<string, unknown> = {}) => ({
  __typename: 'Event' as const,
  id: 'organization-1-subscription-1-transaction-1-1740000000',
  transactionId: 'transaction-1',
  externalSubscriptionId: 'subscription-1',
  timestampMs: '1740000000123',
  code: 'api_calls',
  receivedAt: '2026-02-19T00:00:00Z',
  ...overrides,
})

const buildResult = (collection: ReturnType<typeof anEvent>[]) =>
  ({
    data: {
      events: {
        collection,
        metadata: { currentPage: 1, totalPages: 1, totalCount: collection.length },
      },
    },
    error: undefined,
    loading: false,
    fetchMore: jest.fn(),
    refetch: jest.fn(),
  }) as unknown as EventsQueryResult

const logListRef = {
  current: { updateView: jest.fn() },
} as unknown as RefObject<ListSectionRef>

const renderTable = (collection: ReturnType<typeof anEvent>[], activeRowId?: string) =>
  render(
    <EventTable
      getEventsResult={buildResult(collection)}
      logListRef={logListRef}
      activeRowId={activeRowId}
    />,
  )

describe('EventTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN two events sharing the same transactionId', () => {
    describe('WHEN they match the whole dedup tuple', () => {
      it('THEN should collapse them into a single row', () => {
        renderTable([anEvent(), anEvent()])

        expect(screen.getAllByRole('row', { name: /api_calls/ })).toHaveLength(1)
      })
    })

    describe('WHEN they differ only by code', () => {
      it('THEN should keep both rows', () => {
        renderTable([anEvent(), anEvent({ code: 'storage' })])

        expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      })
    })

    describe('WHEN they differ only by timestampMs', () => {
      it('THEN should keep both rows', () => {
        renderTable([anEvent(), anEvent({ timestampMs: '1740000000456' })])

        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      })
    })

    describe('WHEN they differ only by externalSubscriptionId', () => {
      it('THEN should keep both rows', () => {
        renderTable([anEvent(), anEvent({ externalSubscriptionId: 'subscription-2' })])

        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN two distinct events sharing the synthesized Clickhouse id', () => {
    describe('WHEN the table renders', () => {
      it('THEN should give each row the dedup tuple as data-id', () => {
        const first = anEvent()
        const second = anEvent({ code: 'storage' })

        renderTable([first, second])

        expect(screen.getByTestId('table-row-0')).toHaveAttribute(
          'data-id',
          serializeEventKey(first),
        )
        expect(screen.getByTestId('table-row-1')).toHaveAttribute(
          'data-id',
          serializeEventKey(second),
        )
      })
    })
  })

  describe('GIVEN a rendered row', () => {
    describe('WHEN it is clicked', () => {
      it('THEN should navigate to the link carrying the whole dedup tuple', async () => {
        const user = userEvent.setup()
        const event = anEvent()

        renderTable([event])

        await user.click(screen.getByTestId('table-row-0'))

        expect(testMockNavigateFn).toHaveBeenCalledWith(buildEventLink(event))
      })

      it('THEN should navigate to a different link for the duplicate transactionId', async () => {
        const user = userEvent.setup()
        const second = anEvent({ code: 'storage' })

        renderTable([anEvent(), second])

        await user.click(screen.getByTestId('table-row-1'))

        expect(testMockNavigateFn).toHaveBeenCalledWith(buildEventLink(second))
      })
    })
  })
  describe('GIVEN one of the duplicate rows is selected', () => {
    describe('WHEN the table renders', () => {
      it('THEN should mark only that row as selected', () => {
        const first = anEvent()
        const second = anEvent({ code: 'storage' })

        renderTable([first, second], serializeEventKey(second))

        expect(screen.getByTestId('table-row-0')).not.toHaveAttribute('data-state')
        expect(screen.getByTestId('table-row-1')).toHaveAttribute('data-state', 'selected')
      })

      it('THEN should keep the selection through a re-render of the rows', () => {
        const event = anEvent()

        const { rerender } = renderTable([event], serializeEventKey(event))

        // The highlight used to be written straight into the DOM after mount, so any later
        // re-render of the rows dropped it. Rendering it from the data is what keeps it.
        rerender(
          <EventTable
            getEventsResult={buildResult([event])}
            logListRef={logListRef}
            activeRowId={serializeEventKey(event)}
          />,
        )

        expect(screen.getByTestId('table-row-0')).toHaveAttribute('data-state', 'selected')
      })
    })
  })

  describe('GIVEN no row is selected', () => {
    describe('WHEN the table renders', () => {
      it('THEN should mark no row as selected', () => {
        renderTable([anEvent(), anEvent({ code: 'storage' })])

        expect(screen.getByTestId('table-row-0')).not.toHaveAttribute('data-state')
        expect(screen.getByTestId('table-row-1')).not.toHaveAttribute('data-state')
      })
    })
  })
})
