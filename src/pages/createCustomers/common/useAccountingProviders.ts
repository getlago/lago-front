import { gql } from '@apollo/client'

import { useGetAccountingIntegrationsForExternalAppsAccordionQuery } from '~/generated/graphql'

gql`
  query getAccountingIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on NetsuiteIntegration {
          __typename
          id
          code
          name
        }
        ... on XeroIntegration {
          __typename
          id
          code
          name
        }
      }
    }
  }
`

export const useAccountingProviders = () => {
  const { data: accountingProviders, loading: isLoadingAccountProviders } =
    useGetAccountingIntegrationsForExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  return {
    accountingProviders,
    isLoadingAccountProviders,
  }
}
