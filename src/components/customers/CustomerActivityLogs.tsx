import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { InfiniteScroll } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { ActivityLogsTableDataFragmentDoc, useCustomerActivityLogsQuery } from '~/generated/graphql'
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
  const { open, setUrl } = useDeveloperTool()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useCustomerActivityLogsQuery({
    variables: {
      externalCustomerId: externalCustomerId,
      limit: 20,
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

        <InfiniteScroll
          onBottom={async () => {
            const { currentPage = 0, totalPages = 0 } = data?.activityLogs?.metadata || {}

            if (currentPage < totalPages && !loading) {
              await fetchMore({
                variables: { page: currentPage + 1 },
              })
            }
          }}
        >
          <ActivityLogsTable
            containerSize={4}
            data={data?.activityLogs?.collection ?? []}
            hasError={!!error}
            isLoading={loading}
            refetch={refetch}
            onRowActionLink={(row) => {
              const url = buildLinkToActivityLog(row.activityId)

              open()
              setUrl(url)

              // We return an empty string to avoid the default behavior of the table
              return ''
            }}
          />
        </InfiniteScroll>
      </div>
    </div>
  )
}
