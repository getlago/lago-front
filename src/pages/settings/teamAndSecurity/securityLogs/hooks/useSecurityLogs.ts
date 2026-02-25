import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formatFiltersForSecurityLogsQuery } from '~/components/designSystem/Filters'
import { LagoApiError, useGetSecurityLogsQuery } from '~/generated/graphql'

import { SecurityLogs, SecurityLogWithId } from '../common/securityLogsTypes'

gql`
  fragment SecurityLogItem on SecurityLog {
    logId
    logEvent
    logType
    deviceInfo
    resources
    loggedAt
    userEmail
  }

  query getSecurityLogs(
    $page: Int
    $limit: Int
    $logEvents: [LogEventEnum!]
    $logTypes: [LogTypeEnum!]
    $fromDate: ISO8601DateTime
    $toDate: ISO8601DateTime!
    $userIds: [ID!]
  ) {
    securityLogs(
      page: $page
      limit: $limit
      logEvents: $logEvents
      logTypes: $logTypes
      fromDatetime: $fromDate
      toDatetime: $toDate
      userIds: $userIds
    ) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...SecurityLogItem
      }
    }
  }
`

export const formatSecurityLogs = (securityLogs: SecurityLogs): Array<SecurityLogWithId> => {
  return securityLogs.map((securityLog) => ({ id: securityLog.logId, ...securityLog }))
}

export const useSecurityLogs = () => {
  const [searchParams] = useSearchParams()
  const defaultToDateTime = DateTime.now().endOf('day').toISO()

  const filtersForSecurityLogsQuery = useMemo(() => {
    return formatFiltersForSecurityLogsQuery(searchParams)
  }, [searchParams])

  const {
    data,
    loading: isLoadingSecurityLogs,
    fetchMore: fetchMoreSecurityLogs,
    refetch,
  } = useGetSecurityLogsQuery({
    variables: { limit: 20, toDate: defaultToDateTime, ...filtersForSecurityLogsQuery },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
  })

  const refetchSecurityLogs = () => {
    refetch({
      toDate: defaultToDateTime,
      ...filtersForSecurityLogsQuery,
      page: 1,
    })
  }

  return {
    securityLogs: formatSecurityLogs(data?.securityLogs?.collection ?? []),
    securityLogsMetadata: data?.securityLogs?.metadata,
    isLoadingSecurityLogs,
    fetchMoreSecurityLogs,
    refetchSecurityLogs,
  }
}
