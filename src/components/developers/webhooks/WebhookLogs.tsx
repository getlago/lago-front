import { gql } from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  Button,
  InfiniteScroll,
  NavigationTab,
  Skeleton,
  Status,
  Table,
  TabManagedBy,
  Typography,
} from '~/components/designSystem'
import {
  AvailableFiltersEnum,
  Filters,
  formatFiltersForWebhookLogsQuery,
} from '~/components/designSystem/Filters'
import { WEBHOOK_LOGS_ROUTE, WEBHOOKS_ROUTE } from '~/components/developers/DevtoolsRouter'
import { WebhookLogDetails } from '~/components/developers/webhooks/WebhookLogDetails'
import { SearchInput } from '~/components/SearchInput'
import { WEBHOOK_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { statusWebhookMapping } from '~/core/constants/statusWebhookMapping'
import { useGetWebhookInformationsQuery, useGetWebhookLogLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

gql`
  query getWebhookInformations($id: ID!) {
    webhookEndpoint(id: $id) {
      id
      webhookUrl
    }
  }

  fragment WebhookLog on Webhook {
    id
    status
    webhookType
    createdAt
    updatedAt
    endpoint
  }

  query getWebhookLog(
    $page: Int
    $limit: Int
    $webhookEndpointId: String!
    $status: WebhookStatusEnum
    $searchTerm: String
  ) {
    webhooks(
      page: $page
      limit: $limit
      webhookEndpointId: $webhookEndpointId
      status: $status
      searchTerm: $searchTerm
    ) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...WebhookLog
      }
    }
  }
`

export const WebhookLogs = () => {
  const { webhookId = '', logId } = useParams<{ webhookId: string; logId: string }>()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { size } = useDeveloperTool()

  const filtersForWebhookLogsQuery = useMemo(() => {
    return formatFiltersForWebhookLogsQuery(searchParams)
  }, [searchParams])

  const { data: webhookUrlData, loading: webhookUrlLoading } = useGetWebhookInformationsQuery({
    variables: { id: webhookId },
    skip: !webhookId,
  })

  const [getWebhookLogs, { data, error, refetch, fetchMore, variables, loading: logsLoading }] =
    useGetWebhookLogLazyQuery({
      variables: {
        webhookEndpointId: webhookId,
        limit: 20,
        ...filtersForWebhookLogsQuery,
      },
      notifyOnNetworkStatusChange: true,
    })

  const loading = logsLoading || webhookUrlLoading
  const { debouncedSearch, isLoading } = useDebouncedSearch(getWebhookLogs, loading)

  // If no logId is provided in params, navigate to the first log
  useEffect(() => {
    if (!logId) {
      const firstLog = data?.webhooks.collection[0]

      if (firstLog) {
        navigate(generatePath(WEBHOOK_LOGS_ROUTE, { webhookId, logId: firstLog.id }), {
          replace: true,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.webhooks])

  const shouldDisplayLogDetails = logId && !!data?.webhooks.collection.length

  return (
    <div>
      <div className="flex flex-col items-start gap-2 p-4 shadow-b">
        <Button variant="inline" startIcon="arrow-left" onClick={() => navigate(WEBHOOKS_ROUTE)}>
          {translate('text_1746622271766rvabvdcmo7v')}
        </Button>
        <Typography variant="headline">
          {webhookUrlLoading ? (
            <Skeleton variant="text" className="w-60" />
          ) : (
            webhookUrlData?.webhookEndpoint?.webhookUrl
          )}
        </Typography>
      </div>

      <NavigationTab
        className="px-4"
        name="webhook-logs"
        managedBy={TabManagedBy.INDEX}
        loading={loading}
        tabs={[
          {
            title: translate('text_1746622271766kgqyug3llin'),
            component: (
              <div>
                <section className="flex flex-row items-center gap-4 p-4 shadow-b">
                  <SearchInput
                    onChange={debouncedSearch}
                    placeholder={translate('text_1746622271766lr6wf4y0ppn')}
                  />

                  <div>
                    <Filters.Provider
                      filtersNamePrefix={WEBHOOK_LOGS_FILTER_PREFIX}
                      availableFilters={[AvailableFiltersEnum.webhookStatus]}
                      displayInDialog
                    >
                      <Filters.Component />
                    </Filters.Provider>
                  </div>

                  <div className="h-8 w-px shadow-r" />

                  <div>
                    <Button
                      startIcon="reload"
                      size="small"
                      variant="quaternary"
                      onClick={async () => await refetch()}
                    >
                      {translate('text_1738748043939zqoqzz350yj')}
                    </Button>
                  </div>
                </section>
                <section
                  className="flex min-h-20 flex-row overflow-hidden"
                  // 222px is the height of the headers (52px+96px+72px+2px of borders)
                  style={{ height: shouldDisplayLogDetails ? `calc(${size}vh - 222px)` : '100%' }}
                >
                  <div
                    className={tw(
                      shouldDisplayLogDetails ? 'h-full w-1/2 overflow-auto' : 'w-full',
                    )}
                  >
                    <InfiniteScroll
                      mode="element"
                      onBottom={async () => {
                        const { currentPage = 0, totalPages = 0 } = data?.webhooks?.metadata || {}

                        if (currentPage < totalPages && !isLoading) {
                          await fetchMore({
                            variables: { page: currentPage + 1 },
                          })
                        }
                      }}
                    >
                      <Table
                        name="webhook-logs"
                        containerClassName="h-auto"
                        containerSize={16}
                        rowSize={48}
                        data={data?.webhooks.collection || []}
                        hasError={!!error}
                        isLoading={loading}
                        onRowActionLink={({ id }) => {
                          const currentParams = searchParams.toString()
                          const path = generatePath(WEBHOOK_LOGS_ROUTE, {
                            webhookId,
                            logId: id,
                          })

                          return currentParams ? `${path}?${currentParams}` : path
                        }}
                        columns={[
                          {
                            title: translate('text_63ac86d797f728a87b2f9fa7'),
                            key: 'status',
                            content: ({ status }) => <Status {...statusWebhookMapping(status)} />,
                          },
                          {
                            title: translate('text_1746622271766rmi2hgoq1sb'),
                            key: 'webhookType',
                            content: ({ webhookType }) => (
                              <Typography color="grey700" variant="captionCode">
                                {webhookType}
                              </Typography>
                            ),
                            maxSpace: true,
                          },
                          {
                            title: translate('text_664cb90097bfa800e6efa3f5'),
                            key: 'updatedAt',
                            content: ({ updatedAt }) => (
                              <Typography noWrap>
                                {formatTimeOrgaTZ(updatedAt, 'LLL dd, hh:mm:ss a')}
                              </Typography>
                            ),
                          },
                        ]}
                        placeholder={{
                          emptyState: {
                            title: translate(
                              !!variables?.searchTerm
                                ? 'text_63ebafd12755e50052a86e13'
                                : 'text_63ebaf555f88d954d73beb7e',
                            ),
                            subtitle: !variables?.searchTerm ? (
                              <Typography
                                className="[&_a]:text-blue"
                                html={translate('text_63ebafc2c3d08550e5c0341c')}
                              />
                            ) : (
                              translate('text_63ebafd92755e50052a86e14')
                            ),
                          },
                        }}
                      />
                    </InfiniteScroll>
                  </div>
                  {shouldDisplayLogDetails && (
                    <div className="w-1/2 overflow-auto shadow-l">
                      <WebhookLogDetails />
                    </div>
                  )}
                </section>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
