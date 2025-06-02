import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ActivityLogsTableDataFragmentDoc,
  useBillableMetricActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  query BillableMetricActivityLogs($billableMetricId: ID!) {
    billableMetric(id: $billableMetricId) {
      activityLogs {
        ...ActivityLogsTableData
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface BillableMetricDetailsActivityLogsProps {
  billableMetricId: string
}

export const BillableMetricDetailsActivityLogs = ({
  billableMetricId,
}: BillableMetricDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { open, setUrl } = useDeveloperTool()

  const { data, loading, error, refetch } = useBillableMetricActivityLogsQuery({
    variables: {
      billableMetricId,
    },
  })

  return (
    <section className="flex flex-col gap-12">
      <section>
        <PageSectionTitle
          title={translate('text_1747314141347qq6rasuxisl')}
          subtitle={translate('text_1748269135971fmdsm6bs8ig')}
        />

        <ActivityLogsTable
          containerSize={4}
          data={data?.billableMetric?.activityLogs ?? []}
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
      </section>
    </section>
  )
}
