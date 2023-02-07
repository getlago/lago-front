import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { Typography, Selector, Avatar, SelectorSkeleton, Chip } from '~/components/designSystem'
import Stripe from '~/public/images/stripe.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Airbyte from '~/public/images/airbyte.svg'
import Oso from '~/public/images/oso.svg'
import { useIntegrationsSettingQuery } from '~/generated/graphql'
import { STRIPE_INTEGRATION_ROUTE, GOCARDLESS_INTEGRATION_ROUTE } from '~/core/router'
import { envGlobalVar } from '~/core/apolloClient'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import { DOCUMENTATION_AIRBYTE, DOCUMENTATION_OSO } from '~/externalUrls'

gql`
  query integrationsSetting {
    organization {
      id
      stripePaymentProvider {
        id
      }
      gocardlessPaymentProvider {
        id
      }
    }
  }
`

const Integrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const addDialogRef = useRef<AddStripeDialogRef>(null)
  const { data, loading } = useIntegrationsSettingQuery()
  const hasStripeIntegration = !!data?.organization?.stripePaymentProvider?.id
  const hasGocardlessIntegration = !!data?.organization?.gocardlessPaymentProvider?.id
  const { lagoOauthProxyUrl } = envGlobalVar()

  return (
    <Page>
      <Title variant="headline">{translate('text_62b1edddbf5f461ab9712750')}</Title>
      <Subtitle>{translate('text_62b1edddbf5f461ab9712765')}</Subtitle>

      {loading ? (
        <LoadingContainer>
          {[0, 1, 2].map((i) => (
            <SelectorSkeleton fullWidth key={`skeleton-${i}`} />
          ))}
        </LoadingContainer>
      ) : (
        <>
          <StyledSelector
            title={translate('text_62b1edddbf5f461ab971277d')}
            subtitle={translate('text_62b1edddbf5f461ab9712795')}
            icon={
              <Avatar variant="connector">
                <Stripe />
              </Avatar>
            }
            endIcon={
              hasStripeIntegration ? (
                <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
              ) : undefined
            }
            onClick={() => {
              if (hasStripeIntegration) {
                navigate(STRIPE_INTEGRATION_ROUTE)
              } else {
                const element = document.activeElement as HTMLElement

                element.blur && element.blur()
                addDialogRef.current?.openDialog()
              }
            }}
            fullWidth
          />
          <StyledSelector
            title={translate('text_634ea0ecc6147de10ddb6625')}
            subtitle={translate('text_634ea0ecc6147de10ddb6631')}
            icon={
              <Avatar variant="connector">
                <GoCardless />
              </Avatar>
            }
            endIcon={
              hasGocardlessIntegration ? (
                <Chip label={translate('text_634ea0ecc6147de10ddb6646')} />
              ) : undefined
            }
            onClick={() => {
              if (hasGocardlessIntegration) {
                navigate(GOCARDLESS_INTEGRATION_ROUTE)
              } else {
                window.open(`${lagoOauthProxyUrl}/gocardless/auth`, '_blank')
              }
            }}
            fullWidth
          />
          <StyledSelector
            title={translate('text_639c334c3fa0e9c6ca3512b2')}
            subtitle={translate('text_639c334c3fa0e9c6ca3512b4')}
            icon={<Avatar variant="connector">{<Airbyte />}</Avatar>}
            onClick={() => {
              window.open(DOCUMENTATION_AIRBYTE, '_blank')
            }}
            fullWidth
          />
          <StyledSelector
            title={translate('text_63e26d8308d03687188221a5')}
            subtitle={translate('text_63e26d8308d03687188221a6')}
            icon={<Avatar variant="connector">{<Oso />}</Avatar>}
            onClick={() => {
              window.open(DOCUMENTATION_OSO, '_blank')
            }}
            fullWidth
          />
        </>
      )}
      <AddStripeDialog ref={addDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const StyledSelector = styled(Selector)`
  margin-bottom: ${theme.spacing(4)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const LoadingContainer = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

export default Integrations
