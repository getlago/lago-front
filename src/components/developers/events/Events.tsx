import { gql } from '@apollo/client'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { EVENT_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { EventDetails } from '~/components/developers/events/EventDetails'
import { EventTable } from '~/components/developers/events/EventTable'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { EventItemFragment, useEventsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  fragment EventItem on Event {
    id
    transactionId
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
      }
    }
  }
`

export const Events = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const { panelSize: size } = useDeveloperTool()
  const logListRef = useRef<ListSectionRef>(null)

  const getEventsResult = useEventsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })

  const { data, loading, refetch } = getEventsResult

  const navigateToFirstEvent = useCallback(
    (eventCollection?: EventItemFragment[]) => {
      if (eventCollection?.length) {
        const firstEvent = eventCollection[0]

        if (firstEvent && getCurrentBreakpoint() !== 'sm') {
          // We need to use the transactionId as the id because the eventId is not always available (for Clickhouse events)
          navigate(generatePath(EVENT_LOG_ROUTE, { eventId: firstEvent.transactionId as string }), {
            replace: true,
          })
        }
      }
    },
    [navigate],
  )

  // If no eventId is provided in params, navigate to the first event
  useEffect(() => {
    if (!eventId) {
      navigateToFirstEvent(data?.events?.collection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.events?.collection, eventId])

  // The table should highlight the selected row when the eventId is provided in params
  useLayoutEffect(() => {
    if (eventId) {
      logListRef.current?.setActiveRow(eventId)
    }
  }, [eventId])

  const shouldDisplayLogDetails = !!eventId && !!data?.events?.collection.length

  return (
    <div className="not-last-child:shadow-b">
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

            navigateToFirstEvent(result.data?.events?.collection)
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>

      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={<EventTable getEventsResult={getEventsResult} logListRef={logListRef} />}
        rightSide={<EventDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
        sectionHeight={shouldDisplayLogDetails ? `calc(${size}vh - 182px)` : '100%'} // 182px is the height of the headers (52px+64px+64px+2px of borders)
      />
    </div>
  )
}
