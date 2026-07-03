import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { PageSectionTitle } from '~/components/layouts/Section'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  usePlanDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query PlanDetailsActivityLogs(
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

interface PlanDetailsActivityLogsProps {
  planId: string
}

export const PlanDetailsActivityLogs = ({ planId }: PlanDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { openPanel: open, setUrl } = useDeveloperTool()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = usePlanDetailsActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Plan],
      resourceIds: [planId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="w-full px-4 pb-20 pt-6 md:px-12">
      <div className="flex flex-col gap-12">
        <div>
          <PageSectionTitle
            title={translate('text_1747314141347qq6rasuxisl')}
            subtitle={translate('text_1748867310812uxo0zoljxaj')}
          />

          <PaginatedContent
            metadata={data?.activityLogs?.metadata}
            loading={loading}
            onPageChange={(page) => fetchMore({ variables: { page } })}
          >
            <ActivityLogsTable
              containerSize={4}
              data={data?.activityLogs?.collection ?? []}
              error={error}
              isLoading={loading}
              loadingRowCount={DEFAULT_PAGE_SIZE}
              refetch={refetch}
              onRowActionLink={(row) => {
                const url = buildLinkToActivityLog(row.activityId)

                open()
                setUrl(url)

                // We return an empty string to avoid the default behavior of the table
                return ''
              }}
            />
          </PaginatedContent>
        </div>
      </div>
    </div>
  )
}
