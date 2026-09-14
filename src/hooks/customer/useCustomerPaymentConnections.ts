import { gql } from '@apollo/client'

import { ConnectionComboBoxDataItem } from '~/components/customerConnections/ConnectionComboBox'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { usePaymentProviders } from '~/components/customerConnections/usePaymentProviders'
import { ProviderTypeEnum, useCustomerPaymentConnectionsQuery } from '~/generated/graphql'

// No nested `paymentMethods` here: it crashes on the manual placeholder row — the resolved
// connection's methods come from `useConnectionPaymentMethodsList`.
gql`
  query CustomerPaymentConnections($customerId: ID!) {
    customer(id: $customerId) {
      id
      paymentProviderCustomers {
        id
        code
        isDefault
        paymentProvider
      }
    }
  }
`

export type CustomerPaymentConnection = {
  id: string
  code: string
  name: string
  provider: ProviderTypeEnum | null
  isDefault: boolean
}

interface UseCustomerPaymentConnectionsReturn {
  connections: CustomerPaymentConnection[]
  options: ConnectionComboBoxDataItem[]
  defaultConnection: CustomerPaymentConnection | undefined
  loading: boolean
}

interface UseCustomerPaymentConnectionsArgs {
  customerId?: string
  skip?: boolean
}

export const useCustomerPaymentConnections = ({
  customerId = '',
  skip = false,
}: UseCustomerPaymentConnectionsArgs): UseCustomerPaymentConnectionsReturn => {
  const { data, loading } = useCustomerPaymentConnectionsQuery({
    variables: { customerId },
    skip: skip || !customerId,
  })
  const { paymentProviders, isLoadingPaymentProviders } = usePaymentProviders()

  const providerCollection = paymentProviders?.paymentProviders?.collection || []

  const connections = (data?.customer?.paymentProviderCustomers || []).reduce<
    CustomerPaymentConnection[]
  >((acc, row) => {
    if (!row.code || row.code === MANUAL_CONNECTION_CODE) return acc

    return [
      ...acc,
      {
        id: row.id,
        code: row.code,
        name: providerCollection.find((provider) => provider.code === row.code)?.name || row.code,
        provider: row.paymentProvider ?? null,
        isDefault: row.isDefault,
      },
    ]
  }, [])

  return {
    connections,
    options: connections.map((connection) => ({
      value: connection.code,
      label: connection.name,
      subLabel: connection.code,
      group: connection.provider || '',
      isDefault: connection.isDefault,
    })),
    defaultConnection: connections.find((connection) => connection.isDefault),
    loading: loading || isLoadingPaymentProviders,
  }
}
