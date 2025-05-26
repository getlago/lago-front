import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { PageSectionTitle } from '~/components/layouts/Section'
import { ActivityLogsTableDataFragmentDoc, useInvoiceActivityLogsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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
          subtitle={translate('text_1748269135971fmdsm6bs8ig')}
        />

        <ActivityLogsTable
          containerSize={0}
          data={data?.invoice?.activityLogs ?? []}
          hasError={!!error}
          isLoading={loading}
          refetch={refetch}
        />
      </div>
    </div>
  )
}
