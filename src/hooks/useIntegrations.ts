import { gql } from '@apollo/client'

import { IntegrationTypeEnum, useGetTaxProviderPresenceQuery } from '~/generated/graphql'

gql`
  query getTaxProviderPresence($limit: Int, $integrationsType: IntegrationTypeEnum) {
    integrations(limit: $limit, type: $integrationsType) {
      collection {
        ... on AnrokIntegration {
          id
        }
      }
    }
  }
`

type UseIntegrations = () => {
  loading: boolean
  hasTaxProvider: boolean
}

export const useIntegrations: UseIntegrations = () => {
  const { data, loading } = useGetTaxProviderPresenceQuery({
    variables: {
      limit: 1,
      integrationsType: IntegrationTypeEnum.Anrok,
    },
    fetchPolicy: 'cache-first',
  })

  return {
    loading,
    hasTaxProvider: !!data?.integrations?.collection.length,
  }
}
