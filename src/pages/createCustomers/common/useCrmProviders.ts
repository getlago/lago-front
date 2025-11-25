import { gql } from '@apollo/client'

import {
  GetCrmIntegrationsForExternalAppsAccordionQuery,
  useGetCrmIntegrationsForExternalAppsAccordionQuery,
} from '~/generated/graphql'

gql`
  query getCrmIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on HubspotIntegration {
          __typename
          id
          code
          name
          defaultTargetedObject
        }
        ... on SalesforceIntegration {
          __typename
          id
          code
          name
        }
      }
    }
  }
`

export const useCrmProviders = (): {
  crmProviders: GetCrmIntegrationsForExternalAppsAccordionQuery | undefined
  isLoadingCrmProviders: boolean
} => {
  const { data: crmProviders, loading: isLoadingCrmProviders } =
    useGetCrmIntegrationsForExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  return {
    crmProviders,
    isLoadingCrmProviders,
  }
}
