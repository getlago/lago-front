import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PageSectionTitle } from '~/components/layouts/Section'
import { ActivityLogsTableDataFragmentDoc, useInvoiceActivityLogsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  query InvoiceActivityLogs($invoiceId: ID!) {
    invoice(id: $invoiceId) {
      activityLogs {
        ...ActivityLogsTableData
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface InvoiceActivityLogsProps {
  invoiceId: string
}

export const InvoiceActivityLogs = ({ invoiceId }: InvoiceActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { open, setUrl } = useDeveloperTool()

  const { data, loading, error, refetch } = useInvoiceActivityLogsQuery({
    variables: {
      invoiceId,
    },
  })

  return (
    <div className="flex flex-col gap-12">
      <div>
        <PageSectionTitle
          title={translate('text_1747314141347qq6rasuxisl')}
          subtitle={translate('text_17488660976163zo6rqtqwyf')}
        />

        <ActivityLogsTable
          containerSize={4}
          data={data?.invoice?.activityLogs ?? []}
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
  )
}
