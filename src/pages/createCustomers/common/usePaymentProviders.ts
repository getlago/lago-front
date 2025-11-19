import { gql } from '@apollo/client'

import {
  ProviderTypeEnum,
  usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery,
} from '~/generated/graphql'

gql`
  query paymentProvidersListForCustomerCreateEditExternalAppsAccordion($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on CashfreeProvider {
          __typename
          id
          name
          code
        }

        ... on FlutterwaveProvider {
          __typename
          id
          name
          code
        }

        ... on StripeProvider {
          __typename
          id
          name
          code
        }

        ... on GocardlessProvider {
          __typename
          id
          name
          code
        }

        ... on AdyenProvider {
          __typename
          id
          name
          code
        }

        ... on MoneyhashProvider {
          __typename
          id
          name
          code
        }
      }
    }
  }
`

export const usePaymentProviders = () => {
  const { data: { paymentProviders } = {}, loading: isLoadingPaymentProviders } =
    usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  const getPaymentProvider = (code: string | undefined) => {
    if (!code) return undefined

    const provider = paymentProviders?.collection.find((p) => p.code === code)

    if (!provider) return undefined

    return provider.__typename.toLocaleLowerCase().replace('provider', '') as ProviderTypeEnum
  }

  return { paymentProviders, isLoadingPaymentProviders, getPaymentProvider }
}
