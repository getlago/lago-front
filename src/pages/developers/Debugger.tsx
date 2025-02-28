import { gql } from '@apollo/client'
import { useEffect, useMemo, useState } from 'react'

import { Button, InfiniteScroll, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { DebuggerEventDetails } from '~/components/developers/DebuggerEventDetails'
import { EventItem, EventItemSkeleton } from '~/components/developers/EventItem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  DebuggerEventDetailsFragmentDoc,
  EventItemFragmentDoc,
  EventListFragment,
  useEventsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment EventList on Event {
    id
    code
    transactionId
    timestamp
    receivedAt
    payload
    billableMetricName
    matchBillableMetric
    matchCustomField
    apiClient
    ipAddress
    externalSubscriptionId
    customerTimezone
    ...EventItem
    ...DebuggerEventDetails
  }

  query events($page: Int, $limit: Int) {
    events(page: $page, limit: $limit) {
      collection {
        ...EventList
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }

  ${EventItemFragmentDoc}
  ${DebuggerEventDetailsFragmentDoc}
`

const Debugger = () => {
  const { translate } = useInternationalization()
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined)
  const [refetchLoading, setRefetchLoading] = useState<boolean>(false)
  const { data, error, loading, refetch, fetchMore } = useEventsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `event-item-${i}`,
    navigate: (id) => {
      setSelectedEventId(id as string)
      const element = document.activeElement as HTMLElement

      element.blur && element.blur()
    },
  })
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  let index = -1
  const groupedEvent = useMemo(
    () =>
      (data?.events?.collection || []).reduce<Record<string, EventListFragment[]>>((acc, item) => {
        const date = formatTimeOrgaTZ(item.receivedAt)

        acc[date] = [...(acc[date] ? acc[date] : []), item]

        return acc
      }, {}),
    [data?.events?.collection, formatTimeOrgaTZ],
  )

  useEffect(() => {
    if (!selectedEventId && data?.events?.collection) {
      setSelectedEventId(data?.events?.collection[0]?.id)
    }
  }, [data?.events?.collection, selectedEventId])

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_6298bd525e359200d5e9ffe9')}
          subtitle={translate('text_6298bd525e359200d5e9fffb')}
          buttonTitle={translate('text_6298bd525e359200d5ea0007')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <div className="relative flex h-[calc(100vh-theme(space.nav)-52px)]">
          <div className="w-full md:w-1/2">
            <Typography
              className="flex h-18 min-h-18 items-center justify-between px-12 shadow-b"
              variant="bodyHl"
              color="textSecondary"
            >
              {translate('text_6298bd525e359200d5ea0020')}
              {!!data?.events?.collection && (
                <Tooltip title={translate('text_6298bd525e359200d5ea0010')} placement="top-end">
                  <Button
                    icon="reload"
                    variant="quaternary"
                    onClick={async () => {
                      setRefetchLoading(true)
                      setSelectedEventId(undefined)
                      await refetch()
                      setRefetchLoading(false)
                    }}
                  />
                </Tooltip>
              )}
            </Typography>
            {!loading && (!data?.events?.collection || !data?.events?.collection.length) ? (
              <GenericPlaceholder
                className="m-12"
                title={translate('text_6298bd525e359200d5ea002a')}
                subtitle={translate('text_6298bd525e359200d5ea0036')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <div className="h-[calc(100vh-2*theme(space.nav)-52px)] overflow-auto">
                <>
                  {((loading && !data?.events?.collection) || refetchLoading) && (
                    <div className="sticky top-0 z-10 flex h-12 items-center bg-grey-100 px-12 shadow-b" />
                  )}
                  <InfiniteScroll
                    onBottom={() => {
                      const { currentPage = 0, totalPages = 0 } = data?.events?.metadata || {}

                      currentPage < totalPages &&
                        !loading &&
                        fetchMore({
                          variables: { page: currentPage + 1 },
                        })
                    }}
                  >
                    <div className="mb-20">
                      {!refetchLoading &&
                        Object.keys(groupedEvent).map((eventReceivedAt) => {
                          return (
                            <div key={eventReceivedAt}>
                              <div className="sticky top-0 z-10 flex h-12 items-center bg-grey-100 px-12 shadow-b">
                                {eventReceivedAt}
                              </div>
                              {groupedEvent[eventReceivedAt].map((event) => {
                                const { id } = event

                                index += 1

                                return (
                                  <div key={id}>
                                    <EventItem
                                      event={event}
                                      onClick={() => {
                                        setSelectedEventId(id)
                                        const element = document.activeElement as HTMLElement

                                        element.blur && element.blur()
                                      }}
                                      selected={selectedEventId === id}
                                      navigationProps={{
                                        id: `event-item-${index}`,
                                        'data-id': id,
                                      }}
                                    />
                                    {selectedEventId === id && (
                                      <div className="right-0 top-0 z-10 flex size-full flex-col overflow-auto bg-white md:absolute md:w-1/2 md:shadow-l">
                                        <DebuggerEventDetails event={event} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      {loading &&
                        [0, 1, 2].map((i) => (
                          <EventItemSkeleton key={`event-skeleton-item-${i}`} />
                        ))}
                    </div>
                  </InfiniteScroll>
                </>
              </div>
            )}
          </div>
          <div className="hidden h-full w-1/2 flex-col bg-grey-100 shadow-l md:flex">
            {loading && (
              <>
                <Typography className="ml-px flex h-18 items-center justify-between bg-white px-8 shadow-b">
                  <Skeleton variant="text" className="w-45" />
                </Typography>
                <div className="ml-px bg-white px-8 py-10 shadow-l">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div className="flex items-center gap-10" key={`skeleton-event-${i}`}>
                      <Skeleton variant="text" className="w-20" />
                      <Skeleton variant="text" className="w-60" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-grey-100 shadow-l md:shadow-b" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Debugger
