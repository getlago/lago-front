import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ActivityLogsTableDataFragmentDoc,
  useGetPlanDetilsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  query getPlanDetilsActivityLogs($planId: ID!) {
    plan(id: $planId) {
      activityLogs {
        ...ActivityLogsTableData
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
  const { open, setUrl } = useDeveloperTool()

  const { data, loading, error, refetch } = useGetPlanDetilsActivityLogsQuery({
    variables: { planId },
  })

  return (
    <div className="w-full px-12 pb-20 pt-8">
      <div className="flex flex-col gap-12">
        <div>
          <PageSectionTitle
            title={translate('text_1747314141347qq6rasuxisl')}
            subtitle={translate('text_1748867310812uxo0zoljxaj')}
          />

          <ActivityLogsTable
            containerSize={4}
            data={data?.plan?.activityLogs ?? []}
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
        </div>
      </div>
    </div>
  )
}
