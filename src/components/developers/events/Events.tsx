import { gql } from '@apollo/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { EventDetails } from '~/components/developers/events/EventDetails'
import {
  buildEventLink,
  parseEventKeyFromUrl,
  serializeEventKey,
} from '~/components/developers/events/eventKey'
import { EventTable } from '~/components/developers/events/EventTable'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { useNavigate } from '~/core/router'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { EventItemFragment, useEventsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment EventItem on Event {
    id
    transactionId
    externalSubscriptionId
    timestampMs
    code
    receivedAt
  }

  query events($page: Int, $limit: Int) {
    events(page: $page, limit: $limit) {
      collection {
        ...EventItem
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

export const Events = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { '*': transactionId } = useParams<{ '*': string }>()
  const [searchParams] = useSearchParams()
  const logListRef = useRef<ListSectionRef>(null)

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const getEventsResult = useEventsQuery({
    variables: { limit: pageSize },
    notifyOnNetworkStatusChange: true,
  })

  const { data, loading, refetch } = getEventsResult

  // Two events can share a transactionId, so the selected row is identified by the whole
  // dedup tuple: the path carries the transactionId, the search params carry the rest.
  const selectedEventKey = useMemo(
    () => serializeEventKey(parseEventKeyFromUrl(transactionId, searchParams)),
    [transactionId, searchParams],
  )

  const navigateToFirstEvent = useCallback(
    (eventCollection?: EventItemFragment[], currentSearchParams?: URLSearchParams) => {
      const firstEvent = eventCollection?.[0]

      if (!firstEvent || getCurrentBreakpoint() === 'sm') return

      navigate(buildEventLink(firstEvent, currentSearchParams), { replace: true })
    },
    [navigate],
  )

  // If no event is provided in params, navigate to the first event
  useEffect(() => {
    if (!transactionId) {
      navigateToFirstEvent(data?.events?.collection, searchParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.events?.collection, transactionId, searchParams])

  const shouldDisplayLogDetails = !!transactionId && !!data?.events?.collection.length

  return (
    <div className="flex h-full flex-col not-last-child:shadow-b">
      <Typography variant="headline" className="p-4">
        {translate('text_1747058197364ivug6k5e2nc')}
      </Typography>

      <LogsLayout.CTASection>
        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          loading={loading}
          onClick={async () => {
            const result = await refetch()

            navigateToFirstEvent(result.data?.events?.collection, searchParams)
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>

      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={
          <EventTable
            getEventsResult={getEventsResult}
            logListRef={logListRef}
            activeRowId={transactionId ? selectedEventKey : undefined}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        }
        rightSide={<EventDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
      />
    </div>
  )
}
