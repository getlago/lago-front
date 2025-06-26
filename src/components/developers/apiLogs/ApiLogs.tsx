import { gql } from '@apollo/client'
import { Button, Typography } from 'lago-design-system'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  ApiLogsAvailableFilters,
  Filters,
  formatFiltersForApiLogsQuery,
} from '~/components/designSystem/Filters'
import { ApiLogDetails } from '~/components/developers/apiLogs/ApiLogDetails'
import { ApiLogsTable } from '~/components/developers/apiLogs/ApiLogsTable'
import { API_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { API_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { ApiLogItemFragment, useGetApiLogsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  fragment ApiLogItem on ApiLog {
    requestId
    httpMethod
    httpStatus
    requestPath
    loggedAt
  }

  query getApiLogs(
    $page: Int
    $limit: Int
    $requestIds: [String!]
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
    $apiKeyIds: [String!]
    $httpMethods: [HttpMethodEnum!]
    $httpStatuses: [HttpStatus!]
    $requestPaths: [String!]
  ) {
    apiLogs(
      page: $page
      limit: $limit
      fromDate: $fromDate
      toDate: $toDate
      apiKeyIds: $apiKeyIds
      httpMethods: $httpMethods
      httpStatuses: $httpStatuses
      requestIds: $requestIds
      requestPaths: $requestPaths
    ) {
      collection {
        ...ApiLogItem
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }
`

export const ApiLogs = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { logId } = useParams<{ logId: string }>()
  const [searchParams] = useSearchParams()
  const { size } = useDeveloperTool()
  const logListRef = useRef<ListSectionRef>(null)

  const filtersForApiLogsQuery = useMemo(() => {
    return formatFiltersForApiLogsQuery(searchParams)
  }, [searchParams])

  const getApiLogsResult = useGetApiLogsQuery({
    variables: { limit: 20, ...filtersForApiLogsQuery },
    notifyOnNetworkStatusChange: true,
  })

  const { data, loading, refetch } = getApiLogsResult

  const navigateToFirstLog = useCallback(
    (logCollection?: ApiLogItemFragment[], currentSearchParams?: URLSearchParams) => {
      if (logCollection?.length) {
        const firstLog = logCollection[0]

        if (firstLog && getCurrentBreakpoint() !== 'sm') {
          navigate(
            {
              pathname: generatePath(API_LOG_ROUTE, { logId: firstLog.requestId }),
              search: currentSearchParams?.toString(),
            },
            {
              replace: true,
            },
          )
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (!logId) {
      navigateToFirstLog(data?.apiLogs?.collection, searchParams)
    } else {
      const existingLog = data?.apiLogs?.collection.find((log) => log.requestId === logId)

      if (!existingLog) {
        navigateToFirstLog(data?.apiLogs?.collection, searchParams)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.apiLogs?.collection, logId, searchParams])

  // The table should highlight the selected row when the logId is provided in params
  useLayoutEffect(() => {
    if (!!logId) {
      logListRef.current?.setActiveRow(logId)
    }
  }, [logId])

  const shouldDisplayLogDetails = !!logId && !!data?.apiLogs?.collection.length

  return (
    <div className="not-last-child:shadow-b">
      <Typography variant="headline" className="p-4">
        {translate('text_1749644023729atl2vw7ad3z')}
      </Typography>

      <LogsLayout.CTASection>
        <div>
          <Filters.Provider
            displayInDialog
            filtersNamePrefix={API_LOGS_FILTER_PREFIX}
            availableFilters={ApiLogsAvailableFilters}
          >
            <Filters.Component />
          </Filters.Provider>
        </div>

        <div className="h-8 w-px shadow-r" />

        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          loading={loading}
          onClick={async () => {
            const result = await refetch()

            navigateToFirstLog(result.data?.apiLogs?.collection, searchParams)
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>

      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={<ApiLogsTable getApiLogsResult={getApiLogsResult} logListRef={logListRef} />}
        rightSide={<ApiLogDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
        sectionHeight={
          shouldDisplayLogDetails ? `calc(${size}vh - 182px)` : '100%' // 182px is the height of the headers (52px+64px+64px+2px of borders)
        }
      />
    </div>
  )
}
