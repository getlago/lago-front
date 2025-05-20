import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, InfiniteScroll, Table, Typography } from '~/components/designSystem'
import { EVENT_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { EventDetails } from '~/components/developers/events/EventDetails'
import { useEventsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

gql`
  fragment EventItem on Event {
    id
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
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const { size } = useDeveloperTool()

  const { data, error, loading, refetch, fetchMore } = useEventsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })

  // If no eventId is provided in params, navigate to the first event
  useEffect(() => {
    if (!eventId) {
      const firstEvent = data?.events?.collection[0]

      if (firstEvent) {
        navigate(generatePath(EVENT_LOG_ROUTE, { eventId: firstEvent.id }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.events?.collection])

  const shouldDisplayLogDetails = eventId && !!data?.events?.collection.length

  return (
    <div>
      <div className="p-4 shadow-b">
        <Typography variant="headline">{translate('text_1747058197364ivug6k5e2nc')}</Typography>
      </div>

      <div className="p-4 shadow-b">
        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          loading={loading}
          onClick={async () => await refetch()}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </div>

      <section
        className="flex min-h-20 flex-row overflow-hidden"
        // 182px is the height of the headers (52px+65px+65px)
        style={{ height: shouldDisplayLogDetails ? `calc(${size}vh - 182px)` : '100%' }}
      >
        <div className={tw(shouldDisplayLogDetails ? 'h-full w-1/2 overflow-auto' : 'w-full')}>
          <InfiniteScroll
            mode="element"
            onBottom={async () => {
              const { currentPage = 0, totalPages = 0 } = data?.events?.metadata || {}

              if (currentPage < totalPages && !loading) {
                await fetchMore({
                  variables: { page: currentPage + 1 },
                })
              }
            }}
          >
            <Table
              name="events-logs"
              containerClassName="h-auto"
              containerSize={16}
              rowSize={48}
              data={data?.events?.collection || []}
              hasError={!!error}
              isLoading={loading}
              onRowActionLink={({ id }) => {
                return generatePath(EVENT_LOG_ROUTE, {
                  eventId: id,
                })
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
                    <Typography noWrap>
                      {formatTimeOrgaTZ(receivedAt, 'LLL dd, hh:mm:ss a')}
                    </Typography>
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
          </InfiniteScroll>
        </div>
        {shouldDisplayLogDetails && (
          <div className="w-1/2 overflow-auto shadow-l">
            <EventDetails />
          </div>
        )}
      </section>
    </div>
  )
}
