import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

import { Avatar, Chip, Selector, SelectorSkeleton, Typography } from '~/components/designSystem'
import {
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddLagoTaxManagementDialog,
  AddLagoTaxManagementDialogRef,
} from '~/components/settings/integrations/AddLagoTaxManagementDialog'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import { envGlobalVar } from '~/core/apolloClient'
import {
  DOCUMENTATION_AIRBYTE,
  DOCUMENTATION_HIGHTTOUCH,
  DOCUMENTATION_OSO,
  DOCUMENTATION_SEGMENT,
} from '~/core/constants/externalUrls'
import {
  ADYEN_INTEGRATION_ROUTE,
  GOCARDLESS_INTEGRATION_ROUTE,
  STRIPE_INTEGRATION_ROUTE,
  TAX_MANAGEMENT_INTEGRATION_ROUTE,
} from '~/core/router'
import { useIntegrationsSettingQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Airbyte from '~/public/images/airbyte.svg'
import GoCardless from '~/public/images/gocardless.svg'
import HightTouch from '~/public/images/hightouch.svg'
import LagoTaxManagement from '~/public/images/lago-tax-management.svg'
import Oso from '~/public/images/oso.svg'
import Segment from '~/public/images/segment.svg'
import Stripe from '~/public/images/stripe.svg'
import { theme } from '~/styles'

gql`
  query integrationsSetting {
    organization {
      id
      euTaxManagement
      country
      stripePaymentProvider {
        id
      }
      gocardlessPaymentProvider {
        id
      }
      adyenPaymentProvider {
        id
      }
    }
  }
`

const Integrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const addStripeDialogRef = useRef<AddStripeDialogRef>(null)
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const addLagoTaxManagementDialog = useRef<AddLagoTaxManagementDialogRef>(null)
  const { data, loading } = useIntegrationsSettingQuery()

  const organization = data?.organization
  const hasAdyenIntegration = !!organization?.adyenPaymentProvider?.id
  const hasStripeIntegration = !!organization?.stripePaymentProvider?.id
  const hasGocardlessIntegration = !!organization?.gocardlessPaymentProvider?.id
  const hasTaxManagement = !!organization?.euTaxManagement
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
            title={translate('text_645d071272418a14c1c76a6d')}
            subtitle={translate('text_634ea0ecc6147de10ddb6631')}
            icon={
              <Avatar variant="connector">
                <Adyen />
              </Avatar>
            }
            endIcon={
              hasAdyenIntegration ? (
                <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
              ) : undefined
            }
            onClick={() => {
              if (hasAdyenIntegration) {
                navigate(ADYEN_INTEGRATION_ROUTE)
              } else {
                const element = document.activeElement as HTMLElement

                element.blur && element.blur()
                addAdyenDialogRef.current?.openDialog()
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
            title={translate('text_641b41f3cec373009a265e9e')}
            subtitle={translate('text_641b41fa604ef10070cab5ea')}
            icon={<Avatar variant="connector">{<HightTouch />}</Avatar>}
            onClick={() => {
              window.open(DOCUMENTATION_HIGHTTOUCH, '_blank')
            }}
            fullWidth
          />
          <StyledSelector
            fullWidth
            title={translate('text_657078c28394d6b1ae1b9713')}
            subtitle={translate('text_657078c28394d6b1ae1b971f')}
            icon={<Avatar variant="connector">{<LagoTaxManagement />}</Avatar>}
            endIcon={
              hasTaxManagement ? (
                <Chip label={translate('text_634ea0ecc6147de10ddb6646')} />
              ) : undefined
            }
            onClick={() => {
              if (hasTaxManagement) {
                navigate(TAX_MANAGEMENT_INTEGRATION_ROUTE)
              } else {
                const element = document.activeElement as HTMLElement

                element.blur && element.blur()
                addLagoTaxManagementDialog.current?.openDialog()
              }
            }}
          />
          <StyledSelector
            title={translate('text_641b42035d62fd004e07cdde')}
            subtitle={translate('text_641b420ccd75240062f2386e')}
            icon={<Avatar variant="connector">{<Segment />}</Avatar>}
            onClick={() => {
              window.open(DOCUMENTATION_SEGMENT, '_blank')
            }}
            fullWidth
          />
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
                addStripeDialogRef.current?.openDialog()
              }
            }}
            fullWidth
          />
        </>
      )}

      <AddAdyenDialog ref={addAdyenDialogRef} />
      <AddStripeDialog ref={addStripeDialogRef} />
      <AddLagoTaxManagementDialog
        country={organization?.country}
        ref={addLagoTaxManagementDialog}
      />
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
