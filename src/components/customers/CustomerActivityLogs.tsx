import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { PageSectionTitle } from '~/components/layouts/Section'
import { ActivityLogsTableDataFragmentDoc, useCustomerActivityLogsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query CustomerActivityLogs($customerId: ID!) {
    customer(id: $customerId) {
      activityLogs {
        ...ActivityLogsTableData
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface CustomerActivityLogsProps {
  customerId: string
}

export const CustomerActivityLogs = ({ customerId }: CustomerActivityLogsProps) => {
  const { translate } = useInternationalization()

  const { data, loading, error, refetch } = useCustomerActivityLogsQuery({
    variables: {
      customerId,
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
          data={data?.customer?.activityLogs ?? []}
          hasError={!!error}
          isLoading={loading}
          refetch={refetch}
        />
      </div>
    </div>
  )
}
