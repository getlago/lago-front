import { gql } from '@apollo/client'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import {
  AvailableFiltersEnum,
  Filters,
  formatFiltersForWebhookLogsQuery,
} from '~/components/designSystem/Filters'
import { WEBHOOK_LOGS_ROUTE } from '~/components/developers/devtoolsRoutes'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { WebhookLogDetails } from '~/components/developers/webhooks/WebhookLogDetails'
import { WebhookLogTable } from '~/components/developers/webhooks/WebhookLogTable'
import { SearchInput } from '~/components/SearchInput'
import { WEBHOOK_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { useGetWebhookLogLazyQuery, WebhookLogFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
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

type WebhookLogsProps = {
  webhookId: string
}

export const WebhookLogs = ({ webhookId }: WebhookLogsProps) => {
  const { logId } = useParams<{ webhookId: string; logId?: string }>()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { panelSize: size, headerOffset, webhookDetailHeaderOffset } = useDeveloperTool()

  const logListRef = useRef<ListSectionRef>(null)

  const filtersForWebhookLogsQuery = useMemo(() => {
    return formatFiltersForWebhookLogsQuery(searchParams)
  }, [searchParams])

  const [getWebhookLogs, getWebhookLogsResult] = useGetWebhookLogLazyQuery({
    variables: {
      webhookEndpointId: webhookId,
      limit: 20,
      ...filtersForWebhookLogsQuery,
    },
    notifyOnNetworkStatusChange: true,
  })

  const { data, loading, refetch } = getWebhookLogsResult

  const { debouncedSearch, isLoading: isSearchLoading } = useDebouncedSearch(
    getWebhookLogs,
    loading,
  )

  const navigateToFirstLog = useCallback(
    (logCollection?: WebhookLogFragment[]) => {
      if (logCollection?.length) {
        const firstLog = logCollection[0]

        if (firstLog && getCurrentBreakpoint() !== 'sm') {
          navigate(generatePath(WEBHOOK_LOGS_ROUTE, { webhookId, logId: firstLog.id }), {
            replace: true,
          })
        }
      }
    },
    [navigate, webhookId],
  )

  // If no logId is provided in params, navigate to the first log
  useEffect(() => {
    if (!logId) {
      navigateToFirstLog(data?.webhooks?.collection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.webhooks.collection, logId])

  // The table should highlight the selected row when the logId is provided in params
  useLayoutEffect(() => {
    if (logId && logListRef.current) {
      logListRef.current.setActiveRow(logId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logId, logListRef.current])

  const shouldDisplayLogDetails = !!logId && !!data?.webhooks.collection.length

  return (
    <div className="not-last-child:shadow-b">
      <LogsLayout.CTASection>
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

        <Button
          startIcon="reload"
          size="small"
          variant="quaternary"
          onClick={async () => {
            const result = await refetch()

            navigateToFirstLog(result.data?.webhooks?.collection)
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>
      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={
          <WebhookLogTable
            getWebhookLogsResult={getWebhookLogsResult}
            logListRef={logListRef}
            isLoading={isSearchLoading}
          />
        }
        rightSide={<WebhookLogDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
        sectionHeight={
          shouldDisplayLogDetails
            ? `calc(${size}vh - ${headerOffset + webhookDetailHeaderOffset}px)`
            : '100%'
        }
      />
    </div>
  )
}
