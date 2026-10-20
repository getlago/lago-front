import { gql } from '@apollo/client'

import { ActivityLogsTableDataFragmentDoc } from '~/generated/graphql'

gql`
  query AppliedRateCardActivityLogs(
    $page: Int
    $limit: Int
    $resourceTypes: [ResourceTypeEnum!]
    $resourceIds: [String!]
  ) {
    activityLogs(
      page: $page
      limit: $limit
      resourceTypes: $resourceTypes
      resourceIds: $resourceIds
    ) {
      collection {
        ...ActivityLogsTableData
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`
