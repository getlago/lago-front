import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useQuoteDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query QuoteDetailsActivityLogs(
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

export const QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID = 'quote-activity-logs-container'

interface QuoteDetailsActivityLogsProps {
  quoteId: string
}

const QuoteDetailsActivityLogs = ({ quoteId }: QuoteDetailsActivityLogsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useQuoteDetailsActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Quote],
      resourceIds: [quoteId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div
      className="w-full px-4 pb-20 pt-6 md:px-12"
      data-test={QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID}
    >
      <ActivityLogsSection
        subtitle={translate('text_1786955447407qdfyv707tf8')}
        activityLogs={data?.activityLogs}
        loading={loading}
        error={error}
        refetch={refetch}
        fetchMore={fetchMore}
      />
    </div>
  )
}

export default QuoteDetailsActivityLogs
