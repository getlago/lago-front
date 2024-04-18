import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

import { Avatar, Chip, Selector, SelectorSkeleton, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddGocardlessDialog,
  AddGocardlessDialogRef,
} from '~/components/settings/integrations/AddGocardlessDialog'
import {
  AddLagoTaxManagementDialog,
  AddLagoTaxManagementDialogRef,
} from '~/components/settings/integrations/AddLagoTaxManagementDialog'
import {
  AddNetsuiteDialog,
  AddNetsuiteDialogRef,
} from '~/components/settings/integrations/AddNetsuiteDialog'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import {
  DOCUMENTATION_AIRBYTE,
  DOCUMENTATION_HIGHTTOUCH,
  DOCUMENTATION_OSO,
  DOCUMENTATION_SEGMENT,
} from '~/core/constants/externalUrls'
import {
  ADYEN_INTEGRATION_ROUTE,
  GOCARDLESS_INTEGRATION_ROUTE,
  NETSUITE_INTEGRATION_ROUTE,
  STRIPE_INTEGRATION_ROUTE,
  TAX_MANAGEMENT_INTEGRATION_ROUTE,
} from '~/core/router'
import { IntegrationTypeEnum, useIntegrationsSettingQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Airbyte from '~/public/images/airbyte.svg'
import GoCardless from '~/public/images/gocardless.svg'
import HightTouch from '~/public/images/hightouch.svg'
import LagoTaxManagement from '~/public/images/lago-tax-management.svg'
import Netsuite from '~/public/images/netsuite.svg'
import Oso from '~/public/images/oso.svg'
import Segment from '~/public/images/segment.svg'
import Stripe from '~/public/images/stripe.svg'
import { theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

gql`
  query integrationsSetting($limit: Int) {
    organization {
      id
      euTaxManagement
      country
      premiumIntegrations
    }

    paymentProviders(limit: $limit) {
      collection {
        ... on StripeProvider {
          id
        }

        ... on GocardlessProvider {
          id
        }

        ... on AdyenProvider {
          id
        }
      }
    }

    integrations(limit: $limit) {
      collection {
        ... on NetsuiteIntegration {
          id
        }
      }
    }
  }
`

const Integrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const addStripeDialogRef = useRef<AddStripeDialogRef>(null)
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const addGocardlessnDialogRef = useRef<AddGocardlessDialogRef>(null)
  const addLagoTaxManagementDialog = useRef<AddLagoTaxManagementDialogRef>(null)
  const addNetsuiteDialogRef = useRef<AddNetsuiteDialogRef>(null)
  const { data, loading } = useIntegrationsSettingQuery({
    variables: { limit: 1000 },
  })

  const organization = data?.organization
  const hasAdyenIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'AdyenProvider',
  )
  const hasStripeIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'StripeProvider',
  )
  const hasGocardlessIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'GocardlessProvider',
  )
  const hasTaxManagement = !!organization?.euTaxManagement
  const hasAccessToNetsuitePremiumIntegration = !!organization?.premiumIntegrations?.includes(
    IntegrationTypeEnum.Netsuite,
  )
  const hasNetsuiteIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'NetsuiteIntegration',
  )

  return (
    <>
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62b1edddbf5f461ab9712733')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
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
                <Avatar size="big" variant="connector">
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
              icon={
                <Avatar size="big" variant="connector">
                  {<Airbyte />}
                </Avatar>
              }
              onClick={() => {
                window.open(DOCUMENTATION_AIRBYTE, '_blank')
              }}
              fullWidth
            />
            <StyledSelector
              title={translate('text_63e26d8308d03687188221a5')}
              subtitle={translate('text_63e26d8308d03687188221a6')}
              icon={
                <Avatar size="big" variant="connector">
                  {<Oso />}
                </Avatar>
              }
              onClick={() => {
                window.open(DOCUMENTATION_OSO, '_blank')
              }}
              fullWidth
            />
            <StyledSelector
              title={translate('text_634ea0ecc6147de10ddb6625')}
              subtitle={translate('text_634ea0ecc6147de10ddb6631')}
              icon={
                <Avatar size="big" variant="connector">
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
                  addGocardlessnDialogRef.current?.openDialog()
                }
              }}
              fullWidth
            />
            <StyledSelector
              title={translate('text_641b41f3cec373009a265e9e')}
              subtitle={translate('text_641b41fa604ef10070cab5ea')}
              icon={
                <Avatar size="big" variant="connector">
                  {<HightTouch />}
                </Avatar>
              }
              onClick={() => {
                window.open(DOCUMENTATION_HIGHTTOUCH, '_blank')
              }}
              fullWidth
            />
            <StyledSelector
              fullWidth
              title={translate('text_657078c28394d6b1ae1b9713')}
              subtitle={translate('text_657078c28394d6b1ae1b971f')}
              icon={
                <Avatar size="big" variant="connector">
                  {<LagoTaxManagement />}
                </Avatar>
              }
              endIcon={
                hasTaxManagement ? (
                  <Chip label={translate('text_634ea0ecc6147de10ddb6646')} />
                ) : undefined
              }
              onClick={() => {
                if (hasTaxManagement) {
                  navigate(TAX_MANAGEMENT_INTEGRATION_ROUTE)
                } else {
                  addLagoTaxManagementDialog.current?.openDialog()
                }
              }}
            />
            <StyledSelector
              fullWidth
              title={translate('text_661ff6e56ef7e1b7c542b239')}
              subtitle={translate('text_661ff6e56ef7e1b7c542b245')}
              endIcon={
                !hasAccessToNetsuitePremiumIntegration ? (
                  'sparkles'
                ) : hasNetsuiteIntegration ? (
                  <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
                ) : undefined
              }
              icon={
                <Avatar size="big" variant="connector">
                  {<Netsuite />}
                </Avatar>
              }
              onClick={() => {
                if (!hasAccessToNetsuitePremiumIntegration) {
                  premiumWarningDialogRef.current?.openDialog({
                    title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                    description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                    mailtoSubject: translate('text_661ff6e56ef7e1b7c542b220'),
                    mailtoBody: translate('text_661ff6e56ef7e1b7c542b238'),
                  })
                } else if (hasNetsuiteIntegration) {
                  navigate(NETSUITE_INTEGRATION_ROUTE)
                } else {
                  addNetsuiteDialogRef.current?.openDialog()
                }
              }}
            />
            <StyledSelector
              title={translate('text_641b42035d62fd004e07cdde')}
              subtitle={translate('text_641b420ccd75240062f2386e')}
              icon={
                <Avatar size="big" variant="connector">
                  {<Segment />}
                </Avatar>
              }
              onClick={() => {
                window.open(DOCUMENTATION_SEGMENT, '_blank')
              }}
              fullWidth
            />
            <StyledSelector
              title={translate('text_62b1edddbf5f461ab971277d')}
              subtitle={translate('text_62b1edddbf5f461ab9712795')}
              icon={
                <Avatar size="big" variant="connector">
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
      </SettingsPageContentWrapper>

      <AddAdyenDialog ref={addAdyenDialogRef} />
      <AddStripeDialog ref={addStripeDialogRef} />
      <AddGocardlessDialog ref={addGocardlessnDialogRef} />
      <AddLagoTaxManagementDialog
        country={organization?.country}
        ref={addLagoTaxManagementDialog}
      />
      <AddNetsuiteDialog ref={addNetsuiteDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

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
