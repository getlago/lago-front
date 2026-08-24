import { uniqBy } from 'lodash'
import { FC, RefObject, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PaginatedContent } from '~/components/designSystem/Pagination'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { buildEventLink, serializeEventKey } from '~/components/developers/events/eventKey'
import { ListSectionRef } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { EventsQueryResult } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

type EventTableProps = {
  getEventsResult: EventsQueryResult
  logListRef: RefObject<ListSectionRef>
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
}

export const EventTable: FC<EventTableProps> = ({
  getEventsResult,
  logListRef,
  pageSize,
  onPageSizeChange,
}) => {
  const { translate } = useInternationalization()
  const { formattedDateTimeWithSecondsOrgaTZ } = useFormatterDateHelper()
  const [searchParams] = useSearchParams()

  const { data, error, loading, fetchMore, refetch } = getEventsResult

  // Rows are keyed on the whole dedup tuple (see `EventKey`), so `Event.id` collisions no
  // longer merge distinct events. Rows matching the full tuple ARE the same event and are
  // collapsed here: the API deliberately does not deduplicate the list (measured on 3M rows,
  // count 18ms -> 1699ms, page 45ms -> 2445ms, reverted in lago-api 2a31919c1). Consequence:
  // `metadata.totalCount` keeps counting raw rows, so the pager can report one more event
  // than the list shows.
  const events = useMemo(
    () =>
      uniqBy(
        data?.events?.collection.map((event) => ({
          ...event,
          id: serializeEventKey(event),
        })) || [],
        'id',
      ),
    [data?.events?.collection],
  )

  return (
    <PaginatedContent
      metadata={data?.events?.metadata}
      loading={loading}
      pageSize={pageSize}
      onPageChange={(page) => fetchMore({ variables: { page } })}
      onPageSizeChange={onPageSizeChange}
    >
      <Table
        name="events-logs"
        containerClassName="h-auto"
        containerSize={16}
        rowSize={48}
        data={events}
        hasError={!!error}
        isLoading={loading}
        loadingRowCount={pageSize}
        onRowActionLink={(event) => {
          if (getCurrentBreakpoint() === 'sm') {
            logListRef.current?.updateView('forward')
          }

          return buildEventLink(event, searchParams)
        }}
        columns={[
          {
            title: translate('text_1747058197364eeqig77mkmq'),
            key: 'code',
            content: ({ code }) => (
              <Typography color="grey700" variant="captionCode">
                {code}
              </Typography>
            ),
            maxSpace: true,
          },
          {
            title: translate('text_664cb90097bfa800e6efa3f5'),
            key: 'receivedAt',
            content: ({ receivedAt }) => (
              <Typography noWrap>{formattedDateTimeWithSecondsOrgaTZ(receivedAt)}</Typography>
            ),
          },
        ]}
        placeholder={{
          emptyState: {
            title: translate('text_6298bd525e359200d5ea002a'),
            subtitle: translate('text_6298bd525e359200d5ea0036'),
          },
          errorState: {
            title: translate('text_1747058197364dm3no1jnete'),
            subtitle: translate('text_63e27c56dfe64b846474ef3b'),
            buttonTitle: translate('text_63e27c56dfe64b846474ef3c'),
            buttonAction: () => refetch(),
          },
        }}
      />
    </PaginatedContent>
  )
}
