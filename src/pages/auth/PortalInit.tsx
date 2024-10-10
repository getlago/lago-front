import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { hasDefinedGQLError, onAccessCustomerPortal } from '~/core/apolloClient'
import { Locale, LocaleEnum } from '~/core/translations'
import { useGetPortalLocaleQuery } from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'

import CustomerPortal from '../customerPortal/CustomerPortal'

gql`
  query getPortalLocale {
    customerPortalOrganization {
      id
      premiumIntegrations
      billingConfiguration {
        id
        documentLocale
      }
    }

    customerPortalUser {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`

const PortalInit = () => {
  const { token } = useParams()
  const { isPortalAuthenticated } = useIsAuthenticated()

  const { data, error, loading } = useGetPortalLocaleQuery({
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: !isPortalAuthenticated || !token,
  })

  const documentLocale =
    (data?.customerPortalUser?.billingConfiguration?.documentLocale as Locale) ||
    (data?.customerPortalOrganization?.billingConfiguration?.documentLocale as Locale) ||
    'en'

  const { translateWithContextualLocal: translate } = useContextualLocale(documentLocale)

  useEffect(() => {
    if (token) {
      onAccessCustomerPortal(token)
    }
  }, [token])

  const isLoading = !isPortalAuthenticated || !!loading
  const isError = !!error && !isLoading && hasDefinedGQLError('Unauthorized', error)

  return (
    <CustomerPortal
      translate={translate}
      documentLocale={LocaleEnum[documentLocale]}
      portalIsLoading={isLoading}
      portalIsError={isError}
    />
  )
}

export default PortalInit
