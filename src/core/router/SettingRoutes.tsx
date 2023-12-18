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
  () => import(/* webpackChunkName: 'invoice-settings' */ '~/pages/settings/InvoiceSettings'),
)
const TaxesSettings = lazyLoad(
  () => import(/* webpackChunkName: 'tax-settings' */ '~/pages/settings/TaxesSettings'),
)
const Members = lazyLoad(() => import(/* webpackChunkName: 'members' */ '~/pages/settings/Members'))
const Integrations = lazyLoad(
  () => import(/* webpackChunkName: 'integrations' */ '~/pages/settings/Integrations'),
)
const AdyenIntegrations = lazyLoad(
  () => import(/* webpackChunkName: 'adyen-integrations' */ '~/pages/settings/AdyenIntegrations'),
)
const AdyenIntegrationDetails = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'adyen-integration-details' */ '~/pages/settings/AdyenIntegrationDetails'
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

// ----------- Routes -----------
export const SETTINGS_ROUTE = '/settings'
export const INVOICE_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/invoice`
export const TAXES_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/taxes`
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const ADYEN_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/adyen`
export const ADYEN_INTEGRATION_DETAILS_ROUTE = `${SETTINGS_ROUTE}/integrations/adyen/:integrationId`
export const STRIPE_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe`
export const STRIPE_INTEGRATION_DETAILS_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe/:integrationId`
export const GOCARDLESS_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless`
export const GOCARDLESS_INTEGRATION_OAUTH_CALLBACK_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless/callback`
export const GOCARDLESS_INTEGRATION_DETAILS_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless/:integrationId`
export const TAX_MANAGEMENT_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/lago-tax-management`
export const MEMBERS_ROUTE = `${SETTINGS_ROUTE}/members`
export const EMAILS_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/emails`
export const EMAILS_SCENARIO_CONFIG_ROUTE = `${SETTINGS_ROUTE}/emails/config/:type`

export const settingRoutes: CustomRouteObject[] = [
  {
    private: true,
    element: <Settings />,
    children: [
      {
        path: [SETTINGS_ROUTE, ORGANIZATION_INFORMATIONS_ROUTE],
        private: true,
        element: <OrganizationInformations />,
      },
      {
        path: [INVOICE_SETTINGS_ROUTE],
        private: true,
        element: <InvoiceSettings />,
      },
      {
        path: [TAXES_SETTINGS_ROUTE],
        private: true,
        element: <TaxesSettings />,
      },
      {
        path: EMAILS_SETTINGS_ROUTE,
        private: true,
        element: <EmailSettings />,
      },
      {
        path: INTEGRATIONS_ROUTE,
        private: true,
        element: <Integrations />,
      },
      {
        path: MEMBERS_ROUTE,
        private: true,
        element: <Members />,
      },
    ],
  },
  {
    path: ADYEN_INTEGRATION_DETAILS_ROUTE,
    private: true,
    element: <AdyenIntegrationDetails />,
  },
  {
    path: ADYEN_INTEGRATION_ROUTE,
    private: true,
    element: <AdyenIntegrations />,
  },
  {
    path: STRIPE_INTEGRATION_ROUTE,
    private: true,
    element: <StripeIntegrations />,
  },
  {
    path: STRIPE_INTEGRATION_DETAILS_ROUTE,
    private: true,
    element: <StripeIntegrationDetails />,
  },
  {
    path: GOCARDLESS_INTEGRATION_OAUTH_CALLBACK_ROUTE,
    private: true,
    element: <GocardlessIntegrationOauthCallback />,
  },
  {
    path: GOCARDLESS_INTEGRATION_ROUTE,
    private: true,
    element: <GocardlessIntegrations />,
  },
  {
    path: GOCARDLESS_INTEGRATION_DETAILS_ROUTE,
    private: true,
    element: <GocardlessIntegrationDetails />,
  },
  {
    path: TAX_MANAGEMENT_INTEGRATION_ROUTE,
    private: true,
    element: <TaxManagementIntegration />,
  },
  {
    path: EMAILS_SCENARIO_CONFIG_ROUTE,
    private: true,
    element: <EmailScenarioConfig />,
  },
]
