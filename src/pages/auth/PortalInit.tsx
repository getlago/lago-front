import { useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'

import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { hasDefinedGQLError, onAccessCustomerPortal } from '~/core/apolloClient'
import { Avatar, Icon, Typography } from '~/components/designSystem'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useGetPortalLocaleQuery } from '~/generated/graphql'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { Locale } from '~/core/translations'
import { theme } from '~/styles'

import CustomerPortal from '../customerPortal/CustomerPortal'

gql`
  query getPortalLocale {
    customerPortalOrganization {
      id
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
  const { translateWithContextualLocal: translate } = useContextualLocale(
    (data?.customerPortalUser?.billingConfiguration?.documentLocale as Locale) ||
      (data?.customerPortalOrganization?.billingConfiguration?.documentLocale as Locale) ||
      'en'
  )

  useEffect(() => {
    if (token) {
      onAccessCustomerPortal(token)
    }
  }, [token])

  if (!isPortalAuthenticated || !!loading) {
    return (
      <Loader>
        <Icon name="processing" color="info" size="large" animation="spin" />
      </Loader>
    )
  }

  return (
    <>
      {!!error && !loading && hasDefinedGQLError('Unauthorized', error) ? (
        <CenteredErrorWrapper>
          <Avatar variant="connector" size="large">
            <Icon name="warning-unfilled" size="large" />
          </Avatar>
          <Typography variant="subhead">{translate('text_641c6acee4bc20004e62c534')}</Typography>
          <InlineItems>
            <InlinePoweredByTypography variant="note" color="grey500">
              {translate('text_6419c64eace749372fc72b03')}
            </InlinePoweredByTypography>
            <StyledLogo />
          </InlineItems>
        </CenteredErrorWrapper>
      ) : (
        <CustomerPortal translate={translate} />
      )}
    </>
  )
}

const Loader = styled.div`
  height: 100%;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CenteredErrorWrapper = styled.div`
  width: 496px;
  margin: ${theme.spacing(20)} auto 0 auto;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(5)};
  }
`

const InlineItems = styled.div`
  display: flex;
  align-items: center;
`

const InlinePoweredByTypography = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const StyledLogo = styled(Logo)`
  width: 40px;
`

export default PortalInit
