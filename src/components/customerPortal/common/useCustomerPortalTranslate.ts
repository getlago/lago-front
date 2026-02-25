import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { Locale, LocaleEnum } from '~/core/translations'
import { useGetPortalLocaleQuery } from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'

gql`
  query getPortalLocale {
    customerPortalOrganization {
      id
      premiumIntegrations
    }

    customerPortalUser {
      id
      billingConfiguration {
        id
        documentLocale
      }
      billingEntityBillingConfiguration {
        id
        documentLocale
      }
    }
  }
`

const useCustomerPortalTranslate = () => {
  const { token } = useParams()
  const { isPortalAuthenticated } = useIsAuthenticated()
  const { data, error, loading } = useGetPortalLocaleQuery({
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    skip: !isPortalAuthenticated || !token,
  })

  const documentLocale =
    (data?.customerPortalUser?.billingConfiguration?.documentLocale as Locale) ||
    (data?.customerPortalUser?.billingEntityBillingConfiguration?.documentLocale as Locale) ||
    'en'

  const { translateWithContextualLocal: translate } = useContextualLocale(documentLocale)

  return {
    translate,
    documentLocale: documentLocale as LocaleEnum,
    error,
    loading,
  }
}

export default useCustomerPortalTranslate
