import { gql } from '@apollo/client'
import { Avatar } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Alert, Chip, NavigationTab, Selector, Typography } from '~/components/designSystem'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  SettingsListItem,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddAnrokDialog,
  AddAnrokDialogRef,
} from '~/components/settings/integrations/AddAnrokDialog'
import {
  AddAvalaraDialog,
  AddAvalaraDialogRef,
} from '~/components/settings/integrations/AddAvalaraDialog'
import {
  AddCashfreeDialog,
  AddCashfreeDialogRef,
} from '~/components/settings/integrations/AddCashfreeDialog'
import {
  AddFlutterwaveDialog,
  AddFlutterwaveDialogRef,
} from '~/components/settings/integrations/AddFlutterwaveDialog'
import {
  AddGocardlessDialog,
  AddGocardlessDialogRef,
} from '~/components/settings/integrations/AddGocardlessDialog'
import {
  AddHubspotDialog,
  AddHubspotDialogRef,
} from '~/components/settings/integrations/AddHubspotDialog'
import {
  AddLagoTaxManagementDialog,
  AddLagoTaxManagementDialogRef,
} from '~/components/settings/integrations/AddLagoTaxManagementDialog'
import {
  AddMoneyhashDialog,
  AddMoneyhashDialogRef,
} from '~/components/settings/integrations/AddMoneyhashDialog'
import {
  AddNetsuiteDialog,
  AddNetsuiteDialogRef,
} from '~/components/settings/integrations/AddNetsuiteDialog'
import {
  AddSalesforceDialog,
  AddSalesforceDialogRef,
} from '~/components/settings/integrations/AddSalesforceDialog'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import { AddXeroDialog, AddXeroDialogRef } from '~/components/settings/integrations/AddXeroDialog'
import {
  DOCUMENTATION_AIRBYTE,
  DOCUMENTATION_HIGHTTOUCH,
  DOCUMENTATION_OSO,
  DOCUMENTATION_SEGMENT,
} from '~/core/constants/externalUrls'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  ADYEN_INTEGRATION_ROUTE,
  ANROK_INTEGRATION_ROUTE,
  AVALARA_INTEGRATION_ROUTE,
  CASHFREE_INTEGRATION_ROUTE,
  FLUTTERWAVE_INTEGRATION_ROUTE,
  GOCARDLESS_INTEGRATION_ROUTE,
  HUBSPOT_INTEGRATION_ROUTE,
  INTEGRATIONS_ROUTE,
  MONEYHASH_INTEGRATION_ROUTE,
  NETSUITE_INTEGRATION_ROUTE,
  SALESFORCE_INTEGRATION_ROUTE,
  STRIPE_INTEGRATION_ROUTE,
  TAX_MANAGEMENT_INTEGRATION_ROUTE,
  XERO_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  PremiumIntegrationTypeEnum,
  useGetBillingEntitiesQuery,
  useIntegrationsSettingQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Adyen from '~/public/images/adyen.svg'
import Airbyte from '~/public/images/airbyte.svg'
import Anrok from '~/public/images/anrok.svg'
import Avalara from '~/public/images/avalara.svg'
import Cashfree from '~/public/images/cashfree.svg'
import Flutterwave from '~/public/images/flutterwave.svg'
import GoCardless from '~/public/images/gocardless.svg'
import HightTouch from '~/public/images/hightouch.svg'
import Hubspot from '~/public/images/hubspot.svg'
import LagoTaxManagement from '~/public/images/lago-tax-management.svg'
import Moneyhash from '~/public/images/moneyhash.svg'
import Netsuite from '~/public/images/netsuite.svg'
import Oso from '~/public/images/oso.svg'
import Salesforce from '~/public/images/salesforce.svg'
import Segment from '~/public/images/segment.svg'
import Stripe from '~/public/images/stripe.svg'
import Xero from '~/public/images/xero.svg'

gql`
  query integrationsSetting($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on MoneyhashProvider {
          id
        }

        ... on StripeProvider {
          id
        }

        ... on GocardlessProvider {
          id
        }

        ... on AdyenProvider {
          id
        }

        ... on CashfreeProvider {
          id
        }

        ... on FlutterwaveProvider {
          id
        }
      }
    }

    integrations(limit: $limit) {
      collection {
        ... on AnrokIntegration {
          id
        }
        ... on AvalaraIntegration {
          id
        }
        ... on NetsuiteIntegration {
          id
        }
        ... on XeroIntegration {
          id
        }
        ... on HubspotIntegration {
          id
        }
        ... on SalesforceIntegration {
          id
        }
      }
    }
  }
`

const Integrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const addAnrokDialogRef = useRef<AddAnrokDialogRef>(null)
  const addAvalaraDialogRef = useRef<AddAvalaraDialogRef>(null)
  const addStripeDialogRef = useRef<AddStripeDialogRef>(null)
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const addGocardlessDialogRef = useRef<AddGocardlessDialogRef>(null)
  const addCashfreeDialogRef = useRef<AddCashfreeDialogRef>(null)
  const addLagoTaxManagementDialog = useRef<AddLagoTaxManagementDialogRef>(null)
  const addNetsuiteDialogRef = useRef<AddNetsuiteDialogRef>(null)
  const addSalesforceDialogRef = useRef<AddSalesforceDialogRef>(null)
  const addXeroDialogRef = useRef<AddXeroDialogRef>(null)
  const addHubspotDialogRef = useRef<AddHubspotDialogRef>(null)
  const addMoneyhashDialogRef = useRef<AddMoneyhashDialogRef>(null)
  const addFlutterwaveDialogRef = useRef<AddFlutterwaveDialogRef>(null)

  const { data, loading } = useIntegrationsSettingQuery({
    variables: { limit: 1000 },
  })

  const { data: billingEntitiesData } = useGetBillingEntitiesQuery()

  const hasBillingEntitiesWithTaxManagement =
    billingEntitiesData?.billingEntities?.collection?.find(
      (billingEntity) => billingEntity?.euTaxManagement,
    )

  const hasAdyenIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'AdyenProvider',
  )
  const hasStripeIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'StripeProvider',
  )
  const hasGocardlessIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'GocardlessProvider',
  )
  const hasCashfreeIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'CashfreeProvider',
  )
  const hasMoneyhashIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'MoneyhashProvider',
  )
  const hasFlutterwaveIntegration = data?.paymentProviders?.collection?.some(
    (provider) => provider?.__typename === 'FlutterwaveProvider',
  )
  const hasTaxManagement = !!hasBillingEntitiesWithTaxManagement
  const hasAccessToAvalaraPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Avalara,
  )
  const hasAccessToNetsuitePremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Netsuite,
  )
  const hasAccessToXeroPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Xero,
  )
  const hasAccessToHubspotPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Hubspot,
  )
  const hasAccessToSalesforcePremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Salesforce,
  )
  const hasNetsuiteIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'NetsuiteIntegration',
  )
  const hasAnrokIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'AnrokIntegration',
  )
  const hasAvalaraIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'AvalaraIntegration',
  )
  const hasXeroIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'XeroIntegration',
  )
  const hasHubspotIntegration = data?.integrations?.collection?.some(
    (integration) => integration?.__typename === 'HubspotIntegration',
  )
  const hasSalesforceIntegration = data?.integrations?.collection.some(
    (integration) => integration.__typename === 'SalesforceIntegration',
  )

  const getEndIcon = ({
    showSparkles,
    showConnectedBadge,
  }: {
    showSparkles?: boolean
    showConnectedBadge?: boolean
  }) => {
    if (showSparkles === true) {
      return 'sparkles'
    }

    if (showConnectedBadge === true) {
      return <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
    }

    return undefined
  }

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_62b1edddbf5f461ab9712733')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <SettingsPaddedContainer className="gap-8">
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_62b1edddbf5f461ab9712750')}</Typography>
          <Typography>{translate('text_62b1edddbf5f461ab9712765')}</Typography>
        </SettingsPageHeaderContainer>

        <NavigationTab
          tabs={[
            {
              title: translate('text_1733303404276jppxvximavl'),
              link: generatePath(INTEGRATIONS_ROUTE, {
                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
              }),
              component: (
                <SettingsListWrapper>
                  {!!loading ? (
                    <SettingsListItemLoadingSkeleton count={2} />
                  ) : (
                    <SettingsListItem>
                      <Selector
                        title={translate('text_645d071272418a14c1c76a6d')}
                        subtitle={translate('text_634ea0ecc6147de10ddb6631')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <Adyen />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasAdyenIntegration,
                        })}
                        onClick={() => {
                          if (hasAdyenIntegration) {
                            navigate(
                              generatePath(ADYEN_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            const element = document.activeElement as HTMLElement

                            element.blur && element.blur()
                            addAdyenDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                      <Selector
                        fullWidth
                        title={translate('text_6668821d94e4da4dfd8b3834')}
                        subtitle={translate('text_6668821d94e4da4dfd8b3840')}
                        endIcon={getEndIcon({
                          showSparkles: !isPremium,
                          showConnectedBadge: hasAnrokIntegration,
                        })}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Anrok />}
                          </Avatar>
                        }
                        onClick={() => {
                          if (!isPremium) {
                            premiumWarningDialogRef.current?.openDialog({
                              title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                              description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                              mailtoSubject: translate('text_666887641443e4a75b9ead3d'),
                              mailtoBody: translate('text_666887641443e4a75b9ead3e'),
                            })
                          } else if (hasAnrokIntegration) {
                            navigate(
                              generatePath(ANROK_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addAnrokDialogRef.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        fullWidth
                        title={translate('text_1744293609277s53zn6jcoq4')}
                        subtitle={translate('text_6668821d94e4da4dfd8b3840')}
                        endIcon={getEndIcon({
                          showSparkles: !hasAccessToAvalaraPremiumIntegration,
                          showConnectedBadge: hasAvalaraIntegration,
                        })}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Avalara />}
                          </Avatar>
                        }
                        onClick={() => {
                          if (!hasAccessToAvalaraPremiumIntegration) {
                            premiumWarningDialogRef.current?.openDialog({
                              title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                              description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                              mailtoSubject: translate('text_1744296980972iaigqgcpb8t'),
                              mailtoBody: translate('text_1744296980972op5ch5zpl78'),
                            })
                          } else if (hasAvalaraIntegration) {
                            navigate(
                              generatePath(AVALARA_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addAvalaraDialogRef.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        title={translate('text_63e26d8308d03687188221a5')}
                        subtitle={translate('text_63e26d8308d03687188221a6')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Oso />}
                          </Avatar>
                        }
                        onClick={() => {
                          window.open(DOCUMENTATION_OSO, '_blank')
                        }}
                        fullWidth
                      />
                      <Selector
                        title={translate('text_634ea0ecc6147de10ddb6625')}
                        subtitle={translate('text_634ea0ecc6147de10ddb6631')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <GoCardless />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasGocardlessIntegration,
                        })}
                        onClick={() => {
                          if (hasGocardlessIntegration) {
                            navigate(
                              generatePath(GOCARDLESS_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addGocardlessDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                      <Selector
                        title={translate('text_641b41f3cec373009a265e9e')}
                        subtitle={translate('text_641b41fa604ef10070cab5ea')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<HightTouch />}
                          </Avatar>
                        }
                        onClick={() => {
                          window.open(DOCUMENTATION_HIGHTTOUCH, '_blank')
                        }}
                        fullWidth
                      />
                      <Selector
                        title={translate('text_1727189568053s79ks5q07tr')}
                        subtitle={translate('text_1727189568053q2gpkjzpmxr')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Hubspot />}
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showSparkles: !hasAccessToHubspotPremiumIntegration,
                          showConnectedBadge: hasHubspotIntegration,
                        })}
                        onClick={() => {
                          if (!hasAccessToHubspotPremiumIntegration) {
                            premiumWarningDialogRef.current?.openDialog({
                              title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                              description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                              mailtoSubject: translate('text_172718956805392syzumhdlm'),
                              mailtoBody: translate('text_1727189568053f91r4b3f4rl'),
                            })
                          } else if (hasHubspotIntegration) {
                            navigate(
                              generatePath(HUBSPOT_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addHubspotDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                      <Selector
                        fullWidth
                        title={translate('text_657078c28394d6b1ae1b9713')}
                        subtitle={translate('text_657078c28394d6b1ae1b971f')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<LagoTaxManagement />}
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasTaxManagement,
                        })}
                        onClick={() => {
                          if (hasTaxManagement) {
                            navigate(
                              generatePath(TAX_MANAGEMENT_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addLagoTaxManagementDialog.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        fullWidth
                        title={translate('text_661ff6e56ef7e1b7c542b239')}
                        subtitle={translate('text_661ff6e56ef7e1b7c542b245')}
                        endIcon={getEndIcon({
                          showSparkles: !hasAccessToNetsuitePremiumIntegration,
                          showConnectedBadge: hasNetsuiteIntegration,
                        })}
                        icon={
                          <Avatar size="big" variant="connector-full">
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
                            navigate(
                              generatePath(NETSUITE_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addNetsuiteDialogRef.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        fullWidth
                        title={translate('text_1731507195246vu9kt6xnhv6')}
                        subtitle={translate('text_1731507195246zr2p61vihmw')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Salesforce />}
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showSparkles: !hasAccessToSalesforcePremiumIntegration,
                        })}
                        onClick={() => {
                          if (!hasAccessToSalesforcePremiumIntegration) {
                            premiumWarningDialogRef.current?.openDialog({
                              title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                              description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                              mailtoSubject: translate('text_173150719524652xb2nd3f7r'),
                              mailtoBody: translate('text_1731507195246xxr17pdnb7s'),
                            })
                          } else if (hasSalesforceIntegration) {
                            navigate(
                              generatePath(SALESFORCE_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addSalesforceDialogRef.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        title={translate('text_641b42035d62fd004e07cdde')}
                        subtitle={translate('text_641b420ccd75240062f2386e')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Segment />}
                          </Avatar>
                        }
                        onClick={() => {
                          window.open(DOCUMENTATION_SEGMENT, '_blank')
                        }}
                        fullWidth
                      />
                      <Selector
                        title={translate('text_62b1edddbf5f461ab971277d')}
                        subtitle={translate('text_62b1edddbf5f461ab9712795')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <Stripe />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasStripeIntegration,
                        })}
                        onClick={() => {
                          if (hasStripeIntegration) {
                            navigate(
                              generatePath(STRIPE_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            const element = document.activeElement as HTMLElement

                            element.blur && element.blur()
                            addStripeDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                      <Selector
                        fullWidth
                        title={translate('text_6672ebb8b1b50be550eccaf8')}
                        subtitle={translate('text_661ff6e56ef7e1b7c542b245')}
                        endIcon={getEndIcon({
                          showSparkles: !hasAccessToXeroPremiumIntegration,
                          showConnectedBadge: hasXeroIntegration,
                        })}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            {<Xero />}
                          </Avatar>
                        }
                        onClick={() => {
                          if (!hasAccessToXeroPremiumIntegration) {
                            premiumWarningDialogRef.current?.openDialog({
                              title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                              description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                              mailtoSubject: translate('text_6672ebb8b1b50be550ecca09'),
                              mailtoBody: translate('text_6672ebb8b1b50be550ecca13'),
                            })
                          } else if (hasXeroIntegration) {
                            navigate(
                              generatePath(XERO_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                              }),
                            )
                          } else {
                            addXeroDialogRef.current?.openDialog()
                          }
                        }}
                      />
                    </SettingsListItem>
                  )}
                </SettingsListWrapper>
              ),
            },
            {
              title: translate('text_173330340427732b341qnuny'),
              link: generatePath(INTEGRATIONS_ROUTE, {
                integrationGroup: IntegrationsTabsOptionsEnum.Community,
              }),
              component: (
                <SettingsListWrapper>
                  <Alert type="warning">{translate('text_1736764955395763x9k5gqkj')}</Alert>
                  {!!loading ? (
                    <SettingsListItemLoadingSkeleton count={2} />
                  ) : (
                    <SettingsListItem>
                      <Selector
                        fullWidth
                        title={translate('text_639c334c3fa0e9c6ca3512b2')}
                        subtitle={translate('text_639c334c3fa0e9c6ca3512b4')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <Airbyte />
                          </Avatar>
                        }
                        onClick={() => {
                          window.open(DOCUMENTATION_AIRBYTE, '_blank')
                        }}
                      />
                      <Selector
                        fullWidth
                        title={translate('text_1727619878796wmgcntkfycn')}
                        subtitle={translate('text_634ea0ecc6147de10ddb6631')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <Cashfree />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasCashfreeIntegration,
                        })}
                        onClick={() => {
                          if (hasCashfreeIntegration) {
                            navigate(
                              generatePath(CASHFREE_INTEGRATION_ROUTE, {
                                integrationGroup: IntegrationsTabsOptionsEnum.Community,
                              }),
                            )
                          } else {
                            addCashfreeDialogRef.current?.openDialog()
                          }
                        }}
                      />
                      <Selector
                        title={translate('text_1733427981129n3wxjui0bex')}
                        subtitle={translate('text_634ea0ecc6147de10ddb6631')}
                        icon={
                          <Avatar size="big" variant="connector-full">
                            <Moneyhash />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasMoneyhashIntegration,
                        })}
                        onClick={() => {
                          if (hasMoneyhashIntegration) {
                            navigate(MONEYHASH_INTEGRATION_ROUTE)
                          } else {
                            const element = document.activeElement as HTMLElement

                            element.blur && element.blur()
                            addMoneyhashDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                      <Selector
                        title={translate('text_1749724395108m0swrna0zt4')}
                        subtitle={translate('text_634ea0ecc6147de10ddb6631')}
                        icon={
                          <Avatar size="big" variant="connector-full" className="bg-white">
                            <Flutterwave />
                          </Avatar>
                        }
                        endIcon={getEndIcon({
                          showConnectedBadge: hasFlutterwaveIntegration,
                        })}
                        onClick={() => {
                          if (hasFlutterwaveIntegration) {
                            navigate(FLUTTERWAVE_INTEGRATION_ROUTE)
                          } else {
                            const element = document.activeElement as HTMLElement

                            element.blur && element.blur()
                            addFlutterwaveDialogRef.current?.openDialog()
                          }
                        }}
                        fullWidth
                      />
                    </SettingsListItem>
                  )}
                </SettingsListWrapper>
              ),
            },
          ]}
          loading={loading}
        />
      </SettingsPaddedContainer>

      <AddAnrokDialog ref={addAnrokDialogRef} />
      <AddAvalaraDialog ref={addAvalaraDialogRef} />
      <AddAdyenDialog ref={addAdyenDialogRef} />
      <AddStripeDialog ref={addStripeDialogRef} />
      <AddCashfreeDialog ref={addCashfreeDialogRef} />
      <AddMoneyhashDialog ref={addMoneyhashDialogRef} />
      <AddGocardlessDialog ref={addGocardlessDialogRef} />
      <AddLagoTaxManagementDialog ref={addLagoTaxManagementDialog} />
      <AddNetsuiteDialog ref={addNetsuiteDialogRef} />
      <AddXeroDialog ref={addXeroDialogRef} />
      <AddHubspotDialog ref={addHubspotDialogRef} />
      <AddSalesforceDialog ref={addSalesforceDialogRef} />
      <AddFlutterwaveDialog ref={addFlutterwaveDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default Integrations
