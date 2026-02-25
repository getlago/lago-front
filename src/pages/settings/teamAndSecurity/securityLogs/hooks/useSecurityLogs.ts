import { gql } from '@apollo/client'
import { DateTime } from 'luxon'

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

const formatSecurityLogs = (securityLogs: SecurityLogs): Array<SecurityLogWithId> => {
  return securityLogs.map((securityLog) => ({ id: securityLog.logId, ...securityLog }))
}

export const useSecurityLogs = () => {
  const defaultToDateTime = DateTime.now().endOf('day').toISO()

  const {
    data,
    loading: isLoadingSecurityLogs,
    fetchMore: fetchMoreSecurityLogs,
  } = useGetSecurityLogsQuery({
    variables: { limit: 20, toDate: defaultToDateTime },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
  })

  return {
    securityLogs: formatSecurityLogs(data?.securityLogs?.collection ?? []),
    securityLogsMetadata: data?.securityLogs?.metadata,
    isLoadingSecurityLogs,
    fetchMoreSecurityLogs,
  }
}
