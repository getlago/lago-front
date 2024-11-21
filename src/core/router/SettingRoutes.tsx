import AnrokIntegrationDetails from '~/pages/settings/AnrokIntegrationDetails'
import AnrokIntegrations from '~/pages/settings/AnrokIntegrations'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Layouts -----------
const Settings = lazyLoad(() => import(/* webpackChunkName: 'settings' */ '~/layouts/Settings'))

// ----------- Pages -----------
const OrganizationInformations = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'organization-informations' */ '~/pages/settings/OrganizationInformations'
    ),
)
const InvoiceSettings = lazyLoad(
  () =>
    import(/* webpackChunkName: 'invoice-settings' */ '~/pages/settings/Invoices/InvoiceSettings'),
)
const TaxesSettings = lazyLoad(
  () => import(/* webpackChunkName: 'tax-settings' */ '~/pages/settings/TaxesSettings'),
)
const Members = lazyLoad(() => import(/* webpackChunkName: 'members' */ '~/pages/settings/Members'))
const Integrations = lazyLoad(
  () => import(/* webpackChunkName: 'integrations' */ '~/pages/settings/Integrations'),
)
const Authentication = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'authentication' */ '~/pages/settings/Authentication/Authentication'
    ),
)
const OktaAuthenticationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'okta-authentication-details' */ '~/pages/settings/Authentication/OktaAuthenticationDetails'
    ),
)
const AdyenIntegrations = lazyLoad(
  () => import(/* webpackChunkName: 'adyen-integrations' */ '~/pages/settings/AdyenIntegrations'),
)
const NetsuiteIntegrations = lazyLoad(
  () =>
    import(/* webpackChunkName: 'netsuite-integrations' */ '~/pages/settings/NetsuiteIntegrations'),
)
const AdyenIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'adyen-integration-details' */ '~/pages/settings/AdyenIntegrationDetails'
    ),
)
const HubspotIntegrations = lazyLoad(
  () =>
    import(/* webpackChunkName: 'hubspot-integrations' */ '~/pages/settings/HubspotIntegrations'),
)
const HubspotIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'hubspot-integration-details' */ '~/pages/settings/HubspotIntegrationDetails'
    ),
)
const NetsuiteIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'netsuite-integration-details' */ '~/pages/settings/NetsuiteIntegrationDetails'
    ),
)
const SalesforceIntegrations = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'salesforce-integrations' */ '~/pages/settings/SalesforceIntegrations'
    ),
)
const SalesforceIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'salesforce-integration-details' */ '~/pages/settings/SalesforceIntegrationDetails'
    ),
)
const StripeIntegrations = lazyLoad(
  () => import(/* webpackChunkName: 'stripe-integrations' */ '~/pages/settings/StripeIntegrations'),
)
const StripeIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'stripe-integration-details' */ '~/pages/settings/StripeIntegrationDetails'
    ),
)
const GocardlessIntegrationOauthCallback = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integration-oauth-callback' */ '~/pages/settings/GocardlessIntegrationOauthCallback'
    ),
)
const GocardlessIntegrations = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integrations' */ '~/pages/settings/GocardlessIntegrations'
    ),
)
const GocardlessIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integration-details' */ '~/pages/settings/GocardlessIntegrationDetails'
    ),
)
const TaxManagementIntegration = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'tax-management-integration' */ '~/pages/settings/LagoTaxManagementIntegration'
    ),
)
const EmailSettings = lazyLoad(
  () => import(/* webpackChunkName: 'email-settings' */ '~/pages/settings/EmailSettings'),
)
const EmailScenarioConfig = lazyLoad(
  () =>
    import(/* webpackChunkName: 'email-scenario-config' */ '~/pages/settings/EmailScenarioConfig'),
)
const XeroIntegrations = lazyLoad(
  () => import(/* webpackChunkName: 'xero-integration' */ '~/pages/settings/XeroIntegrations'),
)
const XeroIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'xero-integration-details' */ '~/pages/settings/XeroIntegrationDetails'
    ),
)
const DunningsSettings = lazyLoad(
  () => import(/* webpackChunkName: 'dunnings-settings' */ '~/pages/settings/Dunnings/Dunnings'),
)
const CreateDunning = lazyLoad(
  () => import(/* webpackChunkName: 'create-dunning' */ '~/pages/settings/Dunnings/CreateDunning'),
)

// ----------- Routes -----------
export const SETTINGS_ROUTE = '/settings'
export const INVOICE_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/invoice`
export const TAXES_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/taxes`
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const AUTHENTICATION_ROUTE = `${SETTINGS_ROUTE}/authentication`
export const OKTA_AUTHENTICATION_ROUTE = `${AUTHENTICATION_ROUTE}/okta/:integrationId`
export const ANROK_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/anrok`
export const ANROK_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/anrok/:integrationId/:tab`
export const ADYEN_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/adyen`
export const ADYEN_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/adyen/:integrationId`
export const HUBSPOT_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/hubspot`
export const HUBSPOT_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/hubspot/:integrationId`
export const NETSUITE_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/netsuite`
export const NETSUITE_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/netsuite/:integrationId/:tab`
export const SALESFORCE_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/salesforce`
export const SALESFORCE_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/salesforce/:integrationId`
export const STRIPE_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/stripe`
export const STRIPE_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/stripe/:integrationId`
export const GOCARDLESS_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/gocardless`
export const GOCARDLESS_INTEGRATION_OAUTH_CALLBACK_ROUTE = `${INTEGRATIONS_ROUTE}/gocardless/callback`
export const GOCARDLESS_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/gocardless/:integrationId`
export const TAX_MANAGEMENT_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/lago-tax-management`
export const MEMBERS_ROUTE = `${SETTINGS_ROUTE}/members`
export const EMAILS_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/emails`
export const EMAILS_SCENARIO_CONFIG_ROUTE = `${SETTINGS_ROUTE}/emails/config/:type`
export const XERO_INTEGRATION_ROUTE = `${INTEGRATIONS_ROUTE}/xero`
export const XERO_INTEGRATION_DETAILS_ROUTE = `${INTEGRATIONS_ROUTE}/xero/:integrationId/:tab`
export const DUNNINGS_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/dunnings`
export const CREATE_DUNNING_ROUTE = `${SETTINGS_ROUTE}/dunnings/create`
export const UPDATE_DUNNING_ROUTE = `${SETTINGS_ROUTE}/dunnings/:campaignId/edit`

export const settingRoutes: CustomRouteObject[] = [
  {
    private: true,
    element: <Settings />,
    children: [
      {
        path: [SETTINGS_ROUTE, ORGANIZATION_INFORMATIONS_ROUTE],
        private: true,
        element: <OrganizationInformations />,
        permissions: ['organizationView'],
      },
      {
        path: [INVOICE_SETTINGS_ROUTE],
        private: true,
        element: <InvoiceSettings />,
        permissions: ['organizationInvoicesView'],
      },
      {
        path: [TAXES_SETTINGS_ROUTE],
        private: true,
        element: <TaxesSettings />,
        permissions: ['organizationTaxesView'],
      },
      {
        path: EMAILS_SETTINGS_ROUTE,
        private: true,
        element: <EmailSettings />,
        permissions: ['organizationEmailsView'],
      },
      {
        path: INTEGRATIONS_ROUTE,
        private: true,
        element: <Integrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: AUTHENTICATION_ROUTE,
        private: true,
        element: <Authentication />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: OKTA_AUTHENTICATION_ROUTE,
        private: true,
        element: <OktaAuthenticationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: MEMBERS_ROUTE,
        private: true,
        element: <Members />,
        permissions: ['organizationMembersView'],
      },
      {
        path: ANROK_INTEGRATION_ROUTE,
        private: true,
        element: <AnrokIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: ANROK_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <AnrokIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: ADYEN_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <AdyenIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: ADYEN_INTEGRATION_ROUTE,
        private: true,
        element: <AdyenIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: HUBSPOT_INTEGRATION_ROUTE,
        private: true,
        element: <HubspotIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: HUBSPOT_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <HubspotIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: NETSUITE_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <NetsuiteIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: NETSUITE_INTEGRATION_ROUTE,
        private: true,
        element: <NetsuiteIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: SALESFORCE_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <SalesforceIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: SALESFORCE_INTEGRATION_ROUTE,
        private: true,
        element: <SalesforceIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: STRIPE_INTEGRATION_ROUTE,
        private: true,
        element: <StripeIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: STRIPE_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <StripeIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: GOCARDLESS_INTEGRATION_OAUTH_CALLBACK_ROUTE,
        private: true,
        element: <GocardlessIntegrationOauthCallback />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: GOCARDLESS_INTEGRATION_ROUTE,
        private: true,
        element: <GocardlessIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: GOCARDLESS_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <GocardlessIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: TAX_MANAGEMENT_INTEGRATION_ROUTE,
        private: true,
        element: <TaxManagementIntegration />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: EMAILS_SCENARIO_CONFIG_ROUTE,
        private: true,
        element: <EmailScenarioConfig />,
        permissions: ['organizationEmailsUpdate', 'organizationEmailsView'],
      },
      {
        path: XERO_INTEGRATION_DETAILS_ROUTE,
        private: true,
        element: <XeroIntegrationDetails />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: XERO_INTEGRATION_ROUTE,
        private: true,
        element: <XeroIntegrations />,
        permissions: ['organizationIntegrationsView'],
      },
      {
        path: DUNNINGS_SETTINGS_ROUTE,
        private: true,
        element: <DunningsSettings />,
        permissions: ['dunningCampaignsView'],
      },
    ],
  },
  {
    path: [CREATE_DUNNING_ROUTE, UPDATE_DUNNING_ROUTE],
    private: true,
    element: <CreateDunning />,
    permissions: ['dunningCampaignsCreate', 'dunningCampaignsView', 'dunningCampaignsUpdate'],
  },
]
