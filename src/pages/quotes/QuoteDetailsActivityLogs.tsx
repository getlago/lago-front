import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  QuoteDetailItemFragment,
  useQuoteDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query QuoteDetailsActivityLogs($page: Int, $limit: Int, $resourceIds: [String!]) {
    activityLogs(page: $page, limit: $limit, resourceIds: $resourceIds) {
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
  quote: QuoteDetailItemFragment | null | undefined
  loading: boolean
}

const QuoteDetailsActivityLogs = ({
  quote,
  loading,
}: QuoteDetailsActivityLogsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])
  const canViewOrderForms = hasPermissions(['orderFormsView'])
  const canViewOrders = hasPermissions(['ordersView'])

  // The timeline spans the quote and everything downstream of it. Order form and order rows link
  // to their own detail pages, so they are only requested when the user may open those pages —
  // same gating as the order-forms tab in QuoteDetails.
  const resourceIds = quote
    ? [
        quote.id,
        ...(canViewOrderForms ? quote.orderForms.map((orderForm) => orderForm.id) : []),
        ...(canViewOrders
          ? quote.orderForms.flatMap((orderForm) => (orderForm.order ? [orderForm.order.id] : []))
          : []),
      ]
    : []

  const {
    data,
    loading: logsLoading,
    error,
    refetch,
    fetchMore,
  } = useQuoteDetailsActivityLogsQuery({
    // Resource ids are UUIDs, so they select the right rows on their own — no resourceTypes needed
    variables: {
      resourceIds,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    // Firing before the order form ids are known would render a quote-only timeline that then
    // visibly grows
    skip: !canViewLogs || !quote,
  })

  return (
    <div
      className="w-full px-4 pb-20 pt-6 md:px-12"
      data-test={QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID}
    >
      <ActivityLogsSection
        subtitle={translate('text_1786975404383a9uh5csux55')}
        activityLogs={data?.activityLogs}
        loading={loading || logsLoading}
        error={error}
        refetch={refetch}
        fetchMore={fetchMore}
      />
    </div>
  )
}

export default QuoteDetailsActivityLogs
