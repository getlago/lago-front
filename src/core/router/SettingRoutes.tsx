import { lazy } from 'react'

import { CustomRouteObject } from './types'

// ----------- Layouts -----------
const Settings = lazy(() => import(/* webpackChunkName: 'settings' */ '~/layouts/Settings'))

// ----------- Pages -----------
const OrganizationInformations = lazy(
  () =>
    import(
      /* webpackChunkName: 'organization-informations' */ '~/pages/settings/OrganizationInformations'
    )
)
const InvoiceSettings = lazy(
  () => import(/* webpackChunkName: 'invoice-settings' */ '~/pages/settings/InvoiceSettings')
)
const TaxesSettings = lazy(
  () => import(/* webpackChunkName: 'tax-rate-settings' */ '~/pages/settings/TaxesSettings')
)
const Members = lazy(() => import(/* webpackChunkName: 'members' */ '~/pages/settings/Members'))
const Integrations = lazy(
  () => import(/* webpackChunkName: 'integrations' */ '~/pages/settings/Integrations')
)
const StripeIntegration = lazy(
  () => import(/* webpackChunkName: 'stripe-integration' */ '~/pages/settings/StripeIntegration')
)
const GocardlessIntegration = lazy(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integration' */ '~/pages/settings/GocardlessIntegration'
    )
)
const EmailSettings = lazy(
  () => import(/* webpackChunkName: 'email-settings' */ '~/pages/settings/EmailSettings')
)
const EmailScenarioConfig = lazy(
  () =>
    import(/* webpackChunkName: 'email-scenario-config' */ '~/pages/settings/EmailScenarioConfig')
)

// ----------- Routes -----------
export const SETTINGS_ROUTE = '/settings'
export const INVOICE_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/invoice`
export const TAXES_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/taxes`
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const STRIPE_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe`
export const GOCARDLESS_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless`
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
    path: EMAILS_SCENARIO_CONFIG_ROUTE,
    private: true,
    element: <EmailScenarioConfig />,
  },
]
