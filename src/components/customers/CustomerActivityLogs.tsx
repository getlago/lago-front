import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { usePageSearchParam } from '~/components/designSystem/Pagination'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  useCustomerActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query CustomerActivityLogs($page: Int, $limit: Int, $externalCustomerId: String) {
    activityLogs(page: $page, limit: $limit, externalCustomerId: $externalCustomerId) {
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

interface CustomerActivityLogsProps {
  externalCustomerId: string
}

export const CustomerActivityLogs = ({ externalCustomerId }: CustomerActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { page, goToPage } = usePageSearchParam()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch } = useCustomerActivityLogsQuery({
    variables: {
      externalCustomerId: externalCustomerId,
      limit: DEFAULT_PAGE_SIZE,
      page,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="flex flex-col gap-12">
      <div>
        <ActivityLogsSection
          subtitle={translate('text_17488655909682qx92pqwbzv')}
          activityLogs={data?.activityLogs}
          loading={loading}
          error={error}
          refetch={refetch}
          onPageChange={goToPage}
        />
      </div>
    </div>
  )
}
