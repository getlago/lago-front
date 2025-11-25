import { gql } from '@apollo/client'

import {
  GetTaxIntegrationsForExternalAppsAccordionQuery,
  useGetTaxIntegrationsForExternalAppsAccordionQuery,
} from '~/generated/graphql'

gql`
  query getTaxIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on AnrokIntegration {
          __typename
          id
          code
          name
        }
        ... on AvalaraIntegration {
          __typename
          id
          code
          name
        }
      }
    }
  }
`

export const useTaxProviders = (): {
  taxProviders: GetTaxIntegrationsForExternalAppsAccordionQuery | undefined
  isLoadingTaxProviders: boolean
} => {
  const { data: taxProviders, loading: isLoadingTaxProviders } =
    useGetTaxIntegrationsForExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  return {
    taxProviders,
    isLoadingTaxProviders,
  }
}
