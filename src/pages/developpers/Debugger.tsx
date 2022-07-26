import { gql } from '@apollo/client'
import { useMemo, useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  Typography,
  Button,
  InfiniteScroll,
  Tooltip,
  Skeleton,
  Icon,
  Alert,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import { useEventsQuery, EventListFragment, EventItemFragmentDoc } from '~/generated/graphql'
import { EventItem, EventItemSkeleton } from '~/components/debugger/EventItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { CodeSnippet } from '~/components/CodeSnippet'

gql`
  fragment EventList on Event {
    id
    code
    customerId
    transactionId
    timestamp
    receivedAt
    payload
    billableMetricName
    matchBillableMetric
    matchCustomField
    apiClient
    ipAddress
    ...EventItem
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
  let index = -1
  const groupedEvent = useMemo(
    () =>
      (data?.events?.collection || []).reduce<Record<string, EventListFragment[]>>((acc, item) => {
        const date = DateTime.fromISO(item.timestamp).toFormat('LLL. dd, yyyy')

        acc[date] = [...(acc[date] ? acc[date] : []), item]

        return acc
      }, {}),
    [data?.events?.collection]
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
          buttonAction={location.reload}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : !loading && (!data?.events?.collection || !data?.events?.collection.length) ? (
        <GenericPlaceholder
          title={translate('text_6298bd525e359200d5ea002a')}
          subtitle={translate('text_6298bd525e359200d5ea0036')}
          image={<EmptyImage width="136" height="104" />}
        />
      ) : (
        <Container>
          <Events>
            <Header variant="bodyHl" color="textSecondary">
              {translate('text_6298bd525e359200d5ea0020')}
              {!!data?.events?.collection && (
                <Tooltip title={translate('text_6298bd525e359200d5ea0010')} placement="top-end">
                  <Button
                    icon="reload"
                    variant="quaternary"
                    onClick={async () => {
                      setRefetchLoading(true)
                      setSelectedEventId(undefined)
                      await refetch({ page: 0 })
                      setRefetchLoading(false)
                    }}
                  />
                </Tooltip>
              )}
            </Header>
            <EventList>
              <>
                {((loading && !data?.events?.collection) || refetchLoading) && <DateHeader />}
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
                  <ListContent>
                    {!refetchLoading &&
                      Object.keys(groupedEvent).map((eventDate) => {
                        return (
                          <div key={eventDate}>
                            <DateHeader>{eventDate}</DateHeader>
                            {groupedEvent[eventDate].map((event) => {
                              const {
                                id,
                                billableMetricName,
                                timestamp,
                                payload,
                                customerId,
                                transactionId,
                                apiClient,
                                code,
                                ipAddress,
                                matchBillableMetric,
                                matchCustomField,
                              } = event

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
                                    <EventInfos>
                                      <EventHeader variant="bodyHl" color="textSecondary">
                                        {billableMetricName}
                                      </EventHeader>
                                      <EventInfosContainer>
                                        {!matchBillableMetric && (
                                          <StyledAlert type="warning">
                                            {translate('text_6298bd525e359200d5ea01b7')}
                                          </StyledAlert>
                                        )}
                                        {!matchCustomField && (
                                          <StyledAlert type="warning">
                                            {translate('text_6298bd525e359200d5ea0197')}
                                          </StyledAlert>
                                        )}
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea018f')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {DateTime.fromISO(timestamp).toFormat(
                                              'LLL. dd, yyyy HH:mm:ss'
                                            )}
                                          </Typography>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea01a7')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {customerId}
                                          </Typography>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea01c1')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {code}
                                          </Typography>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea01da')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {billableMetricName}
                                          </Typography>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea01f2')}
                                          </Typography>
                                          <TransactionId color="textSecondary" noWrap>
                                            {transactionId}
                                          </TransactionId>
                                          <TransactionIdTooltip
                                            placement="bottom-start"
                                            title={translate('text_6298bd525e359200d5ea0257')}
                                          >
                                            <Icon name="info-circle" />
                                          </TransactionIdTooltip>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea020a')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {ipAddress}
                                          </Typography>
                                        </EventInfoLine>
                                        <EventInfoLine>
                                          <Typography variant="caption">
                                            {translate('text_6298bd525e359200d5ea0222')}
                                          </Typography>
                                          <Typography color="textSecondary" noWrap>
                                            {apiClient}
                                          </Typography>
                                        </EventInfoLine>
                                      </EventInfosContainer>
                                      <Payload>
                                        <StyledCodeSnippet
                                          language="json"
                                          code={JSON.stringify(payload, null, 2)}
                                          canCopy={false}
                                          displayHead={false}
                                        />
                                      </Payload>
                                    </EventInfos>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    {loading &&
                      [0, 1, 2].map((i) => <EventItemSkeleton key={`event-skeleton-item-${i}`} />)}
                  </ListContent>
                </InfiniteScroll>
              </>
            </EventList>
          </Events>
          <Side>
            {loading && (
              <>
                <HeaderBillableMetric>
                  <Skeleton variant="text" width={180} height={12} />
                </HeaderBillableMetric>
                <EventInfosSkeleton>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={`skeleton-event-${i}`}>
                      <Skeleton variant="text" width={80} height={12} marginRight="72px" />
                      <Skeleton variant="text" width={240} height={12} marginRight="auto" />
                    </div>
                  ))}
                </EventInfosSkeleton>
                <Payload></Payload>
              </>
            )}
          </Side>
        </Container>
      )}
    </div>
  )
}

const Container = styled.div`
  position: relative;
  display: flex;
  height: calc(100vh - (2 * ${NAV_HEIGHT}px));
`

const EventInfos = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  overflow: auto;
  box-shadow: ${theme.shadows[8]};
  background-color: ${theme.palette.background.default};
  z-index: 1;

  ${theme.breakpoints.down('md')} {
    position: initial;
    box-shadow: none;
    width: 100%;
  }
`

const Events = styled.div`
  width: 50%;

  ${theme.breakpoints.down('md')} {
    width: 100%;
  }
`

const Side = styled.div`
  width: 50%;
  height: 100%;
  box-shadow: ${theme.shadows[8]};
  display: flex;
  flex-direction: column;

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const DateHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[7]};
  position: sticky;
  top: 0;
  z-index: 1;
`

const EventList = styled.div`
  overflow: auto;
  height: calc(100vh - ${NAV_HEIGHT * 3}px);
`

const Header = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(12)};
  box-sizing: border-box;
`

const EventHeader = styled(Header)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const HeaderBillableMetric = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(8)};
  box-sizing: border-box;
`

const EventInfosSkeleton = styled.div`
  padding: ${theme.spacing(10)} ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  > * {
    display: flex;
    &:not(:last-child) {
      margin-bottom: ${theme.spacing(7)};
    }
  }
`

const EventInfosContainer = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};

  > * {
    display: flex;
    &:not(:last-child) {
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

const TransactionId = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const Payload = styled.div`
  flex: 1;
  box-shadow: ${theme.shadows[8]};
  background-color: ${theme.palette.grey[100]};

  ${theme.breakpoints.down('md')} {
    box-shadow: ${theme.shadows[7]};
  }
`

const EventInfoLine = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    width: 140px;
    min-width: 140px;
    margin-right: ${theme.spacing(3)};
  }
`

const StyledAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

const StyledCodeSnippet = styled(CodeSnippet)`
  > * {
    padding-bottom: 0px;
  }
`

const TransactionIdTooltip = styled(Tooltip)`
  height: 16px;
`

const ListContent = styled.div`
  margin-bottom: ${theme.spacing(20)};
`

export default Debugger
