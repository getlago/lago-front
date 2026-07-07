import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { PageSectionTitle } from '~/components/layouts/Section'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  useCustomerActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
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
  const { openPanel: open, setUrl } = useDeveloperTool()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useCustomerActivityLogsQuery({
    variables: {
      externalCustomerId: externalCustomerId,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    // Skip the cache on entry so re-opening the tab loads a fresh page 1 (skeleton), instead of
    // flashing the previously-viewed page.
    fetchPolicy: 'network-only',
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="flex flex-col gap-12">
      <div>
        <PageSectionTitle
          title={translate('text_1747314141347qq6rasuxisl')}
          subtitle={translate('text_17488655909682qx92pqwbzv')}
        />

        <PaginatedContent
          metadata={data?.activityLogs?.metadata}
          loading={loading}
          onPageChange={(page) => fetchMore({ variables: { page } })}
          sticky={false}
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
  )
}
