import { gql } from '@apollo/client'

import { ConnectionComboBoxDataItem } from '~/components/customerConnections/ConnectionComboBox'
import { INTEGRATION_TYPE_TO_CATEGORY } from '~/components/customerConnections/customerIntegrationConst'
import { IntegrationConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { IntegrationTypeEnum, useCustomerIntegrationConnectionsQuery } from '~/generated/graphql'

gql`
  query CustomerIntegrationConnections($customerId: ID!) {
    customer(id: $customerId) {
      id
      integrationCustomers {
        ... on NetsuiteCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
        ... on XeroCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
        ... on AnrokCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
        ... on AvalaraCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
        ... on HubspotCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
        ... on SalesforceCustomer {
          __typename
          id
          code
          integrationCode
          integrationType
          isDefault
        }
      }
    }
  }
`

export type CustomerIntegrationConnection = {
  id: string
  code: string
  name: string
  group: string
  integrationType: IntegrationTypeEnum
  isDefault: boolean
}

interface UseCustomerIntegrationConnectionsReturn {
  connections: CustomerIntegrationConnection[]
  options: ConnectionComboBoxDataItem[]
  defaultConnection: CustomerIntegrationConnection | undefined
  loading: boolean
}

interface UseCustomerIntegrationConnectionsArgs {
  customerId?: string
  category: IntegrationConnectionCategory
  skip?: boolean
}

export const useCustomerIntegrationConnections = ({
  customerId = '',
  category,
  skip = false,
}: UseCustomerIntegrationConnectionsArgs): UseCustomerIntegrationConnectionsReturn => {
  const { data, loading } = useCustomerIntegrationConnectionsQuery({
    variables: { customerId },
    skip: skip || !customerId,
  })
  const { connectionOptions, isLoading } = useConnectionOptions()

  const organizationIntegrations = connectionOptions[category] || []

  const connections = (data?.customer?.integrationCustomers || []).reduce<
    CustomerIntegrationConnection[]
  >((acc, row) => {
    if (!row.code || !row.integrationType) return acc
    if (INTEGRATION_TYPE_TO_CATEGORY[row.integrationType] !== category) return acc

    // `integrationCode` points at the org integration; a customer connection whose integration was
    // deleted still routes, so it falls back to its own identifiers rather than disappearing.
    const organizationIntegration = organizationIntegrations.find(
      (option) => option.value === row.integrationCode,
    )

    return [
      ...acc,
      {
        id: row.id,
        code: row.code,
        name: organizationIntegration?.label || row.integrationCode || row.code,
        group: organizationIntegration?.group || '',
        integrationType: row.integrationType,
        isDefault: row.isDefault,
      },
    ]
  }, [])

  return {
    connections,
    options: connections.map((connection) => ({
      value: connection.code,
      label: connection.name,
      subLabel: connection.name === connection.code ? undefined : connection.code,
      group: connection.group,
      isDefault: connection.isDefault,
    })),
    defaultConnection: connections.find((connection) => connection.isDefault),
    loading: loading || isLoading,
  }
}
