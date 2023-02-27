import { useState, useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { generatePath, useParams } from 'react-router-dom'

import { theme, PageHeader, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import {
  Typography,
  Button,
  Skeleton,
  Tooltip,
  NavigationTab,
  InfiniteScroll,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { WEBHOOK_ROUTE, WEBHOOK_LOGS_TAB_ROUTE, WEBHOOK_LOGS_ROUTE } from '~/core/router'
import {
  useGetWebhookLogLazyQuery,
  useGetWebhookOrganizationQuery,
  WebhookStatusEnum,
  WebhookLogFragment,
  WebhookLogItemFragmentDoc,
  WebhookLogDetailsFragmentDoc,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { SearchInput } from '~/components/SearchInput'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { WebhookLogItem, WebhookLogItemSkeleton } from '~/components/developers/WebhookLogItem'
import { WebhookLogDetails } from '~/components/developers/WebhookLogDetails'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query getWebhookOrganization {
    organization {
      id
      webhookUrl
    }
  }

  fragment WebhookLog on Webhook {
    id
    createdAt
    ...WebhookLogItem
    ...WebhookLogDetails
  }

  query getWebhookLog($page: Int, $limit: Int, $status: WebhookStatusEnum, $searchTerm: String) {
    webhooks(page: $page, limit: $limit, status: $status, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...WebhookLog
      }
    }
  }

  ${WebhookLogItemFragmentDoc}
  ${WebhookLogDetailsFragmentDoc}
`

const WEBHOOK_ITEM_NAV_KEY = 'webhook-item-'

const WebhookLogs = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { data: webhookUrlData, loading: webhookUrlLoading } = useGetWebhookOrganizationQuery()
  const { tab: statusFilter } = useParams<{ tab: WebhookStatusEnum }>()
  const [fetchMoreLoading, setFetchMoreLoading] = useState<boolean>(false)
  const [getWebhookLogs, { data, loading, error, refetch, fetchMore, variables }] =
    useGetWebhookLogLazyQuery({
      variables: { limit: 50, ...(statusFilter ? { status: statusFilter } : {}) },
      notifyOnNetworkStatusChange: true,
    })
  const [selectedLogId, setSelectedLogId] = useState<string | undefined>(undefined)
  const { debouncedSearch, isLoading } = useDebouncedSearch(getWebhookLogs, loading)
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const groupedLogs = useMemo(
    () =>
      (data?.webhooks?.collection || []).reduce<Record<string, WebhookLogFragment[]>>(
        (acc, item) => {
          const date = formatTimeOrgaTZ(item.createdAt)

          acc[date] = [...(acc[date] ? acc[date] : []), item]

          return acc
        },
        {}
      ),
    [data?.webhooks?.collection, formatTimeOrgaTZ]
  )
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${WEBHOOK_ITEM_NAV_KEY}${i}`,
    navigate: (id) => {
      setSelectedLogId(id as string)
      const element = document.activeElement as HTMLElement

      element.blur && element.blur()
    },
  })

  useEffect(() => {
    if (!!data?.webhooks?.collection?.length) {
      setSelectedLogId(data?.webhooks?.collection[0]?.id)
    } else {
      setSelectedLogId(undefined)
    }
  }, [data?.webhooks?.collection])

  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <PageHeader $withSide>
        <Header>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(WEBHOOK_ROUTE, { exclude: [WEBHOOK_LOGS_TAB_ROUTE, WEBHOOK_LOGS_ROUTE] })
            }
          />
          {webhookUrlLoading ? (
            <Skeleton variant="text" width={240} height={12} />
          ) : (
            <>
              <Title color="textSecondary" variant="bodyHl">
                {translate('text_63e3a496be166d8f3279b594')}
              </Title>
              {webhookUrlData?.organization?.webhookUrl && (
                <Typography color="textSecondary" noWrap>
                  {translate('text_63e27c56dfe64b846474ef2b', {
                    url: webhookUrlData?.organization?.webhookUrl,
                  })}
                </Typography>
              )}
            </>
          )}
        </Header>
        <SearchInput
          onChange={debouncedSearch}
          placeholder={translate('text_63e27c56dfe64b846474ef49')}
        />
      </PageHeader>
      {!!error && !loading && !isLoading ? (
        <GenericPlaceholder
          title={translate('text_63e27c56dfe64b846474ef3a')}
          subtitle={translate('text_63e27c56dfe64b846474ef3b')}
          buttonTitle={translate('text_63e27c56dfe64b846474ef3c')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <Container>
          <LeftSide>
            <HeaderBlock variant="bodyHl" color="grey700">
              {translate('text_63e27c56dfe64b846474ef4b')}
              {!!data?.webhooks?.collection && (
                <Tooltip title={translate('text_63e27c56dfe64b846474ef4a')} placement="top-end">
                  <Button
                    icon="reload"
                    variant="quaternary"
                    onClick={async () => {
                      await refetch({ page: 0 })
                    }}
                  />
                </Tooltip>
              )}
            </HeaderBlock>
            <NavigationTab
              tabs={[
                {
                  title: translate('text_63e27c56dfe64b846474ef4c'),
                  link: WEBHOOK_LOGS_ROUTE,
                },
                {
                  title: translate('text_63e27c56dfe64b846474ef4d'),
                  link: generatePath(WEBHOOK_LOGS_TAB_ROUTE, {
                    tab: WebhookStatusEnum.Succeeded,
                  }),
                },
                {
                  title: translate('text_63e27c56dfe64b846474ef4e'),
                  link: generatePath(WEBHOOK_LOGS_TAB_ROUTE, { tab: WebhookStatusEnum.Failed }),
                },
              ]}
            />
            {!loading && !isLoading && !data?.webhooks?.collection.length ? (
              <StyledGenericPlaceholder
                title={translate(
                  !!variables?.searchTerm
                    ? 'text_63ebafd12755e50052a86e13'
                    : 'text_63ebaf555f88d954d73beb7e'
                )}
                subtitle={
                  !variables?.searchTerm ? (
                    <Typography html={translate('text_63ebafc2c3d08550e5c0341c')} />
                  ) : (
                    translate('text_63ebafd92755e50052a86e14')
                  )
                }
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <LogsList>
                {isLoading && !fetchMoreLoading && <DateHeader />}
                <InfiniteScroll
                  onBottom={async () => {
                    const { currentPage = 0, totalPages = 0 } = data?.webhooks?.metadata || {}

                    if (currentPage < totalPages && !isLoading) {
                      setFetchMoreLoading(true)
                      await fetchMore({
                        variables: { page: currentPage + 1 },
                      })
                      setFetchMoreLoading(false)
                    }
                  }}
                >
                  <ListContent>
                    {(!isLoading || fetchMoreLoading) &&
                      Object.keys(groupedLogs).map((logDate) => {
                        return (
                          <div key={logDate}>
                            <DateHeader>{logDate}</DateHeader>
                            {groupedLogs[logDate].map((log) => {
                              const { id } = log

                              index += 1

                              return (
                                <div key={id}>
                                  <WebhookLogItem
                                    log={log}
                                    onClick={() => {
                                      setSelectedLogId(id)
                                      const element = document.activeElement as HTMLElement

                                      element.blur && element.blur()
                                    }}
                                    selected={selectedLogId === id}
                                    navigationProps={{
                                      id: `${WEBHOOK_ITEM_NAV_KEY}${index}`,
                                      'data-id': id,
                                    }}
                                  />
                                  {selectedLogId === id && (
                                    <LogInfos>
                                      <WebhookLogDetails log={log} />
                                    </LogInfos>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    {isLoading &&
                      [0, 1, 2].map((i) => (
                        <WebhookLogItemSkeleton key={`webhook-skeleton-item-${i}`} />
                      ))}
                  </ListContent>
                </InfiniteScroll>
              </LogsList>
            )}
          </LeftSide>
          <RightSide>
            {isLoading && (
              <>
                <HeaderBlock $loading>
                  <Skeleton variant="text" width={180} height={12} />
                </HeaderBlock>
                <LogPropertiesSkeleton>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={`skeleton-event-${i}`}>
                      <Skeleton variant="text" width={80} height={12} marginRight="72px" />
                      <Skeleton variant="text" width={240} height={12} marginRight="auto" />
                    </div>
                  ))}
                </LogPropertiesSkeleton>
                <Payload />
              </>
            )}
          </RightSide>
        </Container>
      )}
    </div>
  )
}

export default WebhookLogs

const Header = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: ${theme.spacing(4)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Title = styled(Typography)`
  margin-right: 4px;
`

const Container = styled.div`
  position: relative;
  display: flex;
  height: calc(100vh - ${NAV_HEIGHT}px);
`

const LeftSide = styled.div`
  width: 50%;

  ${theme.breakpoints.down('md')} {
    width: 100%;
  }
`

const RightSide = styled.div`
  width: 50%;
  height: 100%;
  box-shadow: ${theme.shadows[8]};
  display: flex;
  flex-direction: column;
  background-color: ${theme.palette.grey[100]};

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const HeaderBlock = styled(Typography)<{ $loading?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(12)};
  box-shadow: ${theme.shadows[7]};
  background-color: ${theme.palette.common.white};
  margin-left: 1px;

  ${({ $loading }) =>
    $loading &&
    css`
      padding-left: ${theme.spacing(8)};
    `}
`

const LogsList = styled.div`
  height: calc(100vh - (3 * ${NAV_HEIGHT}px));
  overflow: scroll;
`

const LogPropertiesSkeleton = styled.div`
  padding: ${theme.spacing(10)} ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  margin-left: 1px;
  background-color: ${theme.palette.common.white};

  > * {
    display: flex;
    &:not(:last-child) {
      margin-bottom: ${theme.spacing(7)};
    }
  }
`

const Payload = styled.div`
  flex: 1;
  box-shadow: ${theme.shadows[8]};
  background-color: ${theme.palette.grey[100]};

  ${theme.breakpoints.down('md')} {
    box-shadow: ${theme.shadows[7]};
  }
`

const LogInfos = styled.div`
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
    box-shadow: ${theme.shadows[7]};
    width: 100%;
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

const StyledGenericPlaceholder = styled(GenericPlaceholder)`
  margin: ${theme.spacing(12)};
`

const ListContent = styled.div`
  margin-bottom: ${theme.spacing(20)};
`
