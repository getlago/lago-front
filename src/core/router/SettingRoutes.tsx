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
const AdyenIntegration = lazyLoad(
  () => import(/* webpackChunkName: 'adyen-integration' */ '~/pages/settings/AdyenIntegration'),
)
const StripeIntegration = lazyLoad(
  () => import(/* webpackChunkName: 'stripe-integration' */ '~/pages/settings/StripeIntegration'),
)
const GocardlessIntegration = lazyLoad(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integration' */ '~/pages/settings/GocardlessIntegration'
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

const PinetIntegration = lazyLoad(
  () => import(/* webpackChunkName: 'stripe-integration' */ '~/pages/settings/PinetIntegration'),
)

// ----------- Routes -----------
export const SETTINGS_ROUTE = '/settings'
export const INVOICE_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/invoice`
export const TAXES_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/taxes`
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const ADYEN_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/adyen`
export const STRIPE_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe`
export const GOCARDLESS_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless`
export const TAX_MANAGEMENT_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/lago-tax-management`
export const PINET_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/pinet`
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
    path: ADYEN_INTEGRATION_ROUTE,
    private: true,
    element: <AdyenIntegration />,
  },
  {
    path: STRIPE_INTEGRATION_ROUTE,
    private: true,
    element: <StripeIntegration />,
  },
  {
    path: GOCARDLESS_INTEGRATION_ROUTE,
    private: true,
    element: <GocardlessIntegration />,
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
  {
    path: PINET_INTEGRATION_ROUTE,
    private: true,
    element: <PinetIntegration />,
  },
]
