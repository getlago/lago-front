import { screen } from '@testing-library/react'

import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { buildNetsuiteCustomerUrl, buildStripeCustomerUrl } from '~/core/constants/externalUrls'
import {
  CustomerDetailsFragment,
  HubspotTargetedObjectsEnum,
  IntegrationsListForCustomerMainInfosQuery,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { ConnectionDetailsPanel } from '../ConnectionDetailsPanel'
import {
  CONNECTION_DETAILS_PANEL_TEST_ID,
  CONNECTION_EXTERNAL_LINK_TEST_ID,
  CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID,
} from '../constants'

const PAYMENT_ROW: CustomerConnectionRow = {
  id: 'payment-stripe-eu',
  category: ConnectionCategory.Payment,
  name: 'Stripe EU',
  code: 'stripe-eu',
}

const ACCOUNTING_ROW: CustomerConnectionRow = {
  id: 'accounting-ns-1',
  category: ConnectionCategory.Accounting,
  name: 'NetSuite Prod',
  code: 'ns-1',
}

const CRM_ROW: CustomerConnectionRow = {
  id: 'crm-hub-1',
  category: ConnectionCategory.Crm,
  name: 'Hubspot Main',
  code: 'hub-1',
}

/** The backend's non-persisted manual placeholder, prepended to the array */
const MANUAL_PLACEHOLDER_CONNECTION = {
  __typename: 'ProviderCustomer',
  id: 'cust-1-manual',
  code: MANUAL_CONNECTION_CODE,
  isDefault: false,
}

const STRIPE_PAYMENT_CONNECTION = {
  __typename: 'ProviderCustomer',
  id: 'pc-1',
  code: 'stripe',
  isDefault: true,
  providerCustomerId: 'cus_123',
  syncWithProvider: false,
  providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
}

const NETSUITE_INTEGRATION_CONNECTION = {
  __typename: 'NetsuiteCustomer',
  id: 'nc-1',
  integrationId: 'int-ns',
  integrationCode: 'ns-1',
  integrationType: IntegrationTypeEnum.Netsuite,
  externalCustomerId: 'ns_cus_1',
  syncWithProvider: false,
  subsidiaryId: 'sub-1',
}

const buildCustomer = (overrides: Record<string, unknown> = {}): CustomerDetailsFragment =>
  ({
    id: 'cust-1',
    externalId: 'ext-1',
    paymentProvider: ProviderTypeEnum.Stripe,
    paymentProviderCode: 'stripe-eu',
    // The manual row comes first: the panel must read the provider row
    paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION, STRIPE_PAYMENT_CONNECTION],
    integrationCustomers: [NETSUITE_INTEGRATION_CONNECTION],
    ...overrides,
  }) as unknown as CustomerDetailsFragment

const INTEGRATIONS_DATA = {
  integrations: {
    collection: [
      {
        __typename: 'NetsuiteIntegration',
        id: 'int-ns',
        name: 'NetSuite Prod',
        accountId: 'acc-1',
      },
      {
        __typename: 'HubspotIntegration',
        id: 'int-hub',
        name: 'Hubspot Main',
        portalId: 'portal-1',
      },
    ],
  },
} as unknown as IntegrationsListForCustomerMainInfosQuery

describe('ConnectionDetailsPanel', () => {
  describe('GIVEN the Stripe payment connection', () => {
    describe('WHEN it is selected', () => {
      it('THEN should deep-link the provider customer id to Stripe', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            customer={buildCustomer()}
            integrationsLoading={false}
          />,
        )

        const link = screen.getByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)

        expect(link).toHaveAttribute('href', buildStripeCustomerUrl('cus_123'))
        expect(link).toHaveTextContent('cus_123')
      })

      it('THEN should list the enabled payment methods', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            customer={buildCustomer()}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByText('Card')).toBeInTheDocument()
      })

      it('THEN should read the provider row, never the manual one', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            // Manual row last this time: the lookup is code-based, not positional
            customer={buildCustomer({
              paymentProviderCustomers: [STRIPE_PAYMENT_CONNECTION, MANUAL_PLACEHOLDER_CONNECTION],
            })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)).toHaveTextContent('cus_123')
        expect(
          screen.queryByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the provider is not Stripe', () => {
      it('THEN should show the provider customer id as plain text', () => {
        render(
          <ConnectionDetailsPanel
            row={{ ...PAYMENT_ROW, id: 'payment-adyen-eu', name: 'Adyen EU', code: 'adyen-eu' }}
            customer={buildCustomer({ paymentProvider: ProviderTypeEnum.Adyen })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByText('cus_123')).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a NetSuite accounting connection', () => {
    describe('WHEN it is selected', () => {
      it('THEN should deep-link the external customer id to NetSuite', () => {
        render(
          <ConnectionDetailsPanel
            row={ACCOUNTING_ROW}
            customer={buildCustomer()}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)).toHaveAttribute(
          'href',
          buildNetsuiteCustomerUrl('acc-1', 'ns_cus_1'),
        )
      })

      it('THEN should show the integration name and code', () => {
        render(
          <ConnectionDetailsPanel
            row={ACCOUNTING_ROW}
            customer={buildCustomer()}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        const panel = screen.getByTestId(CONNECTION_DETAILS_PANEL_TEST_ID)

        expect(panel).toHaveTextContent('NetSuite Prod')
        expect(panel).toHaveTextContent('ns-1')
      })
    })

    describe('WHEN the integrations query is still loading', () => {
      it('THEN should show a skeleton instead of the grid', () => {
        render(
          <ConnectionDetailsPanel
            row={ACCOUNTING_ROW}
            customer={buildCustomer()}
            integrationsLoading
          />,
        )

        expect(screen.queryByText('ns_cus_1')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a Hubspot CRM connection without a targeted object', () => {
    describe('WHEN it is selected', () => {
      it('THEN should show the external id without a deep link', () => {
        render(
          <ConnectionDetailsPanel
            row={CRM_ROW}
            customer={buildCustomer({
              integrationCustomers: [
                {
                  __typename: 'HubspotCustomer',
                  id: 'hc-1',
                  integrationId: 'int-hub',
                  integrationCode: 'hub-1',
                  integrationType: IntegrationTypeEnum.Hubspot,
                  externalCustomerId: 'hub_cus_1',
                  syncWithProvider: false,
                  targetedObject: null,
                },
              ],
            })}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByText('hub_cus_1')).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a Hubspot CRM connection with a targeted object', () => {
    describe('WHEN it is selected', () => {
      it('THEN should deep-link the external id to the Hubspot object', () => {
        render(
          <ConnectionDetailsPanel
            row={CRM_ROW}
            customer={buildCustomer({
              integrationCustomers: [
                {
                  __typename: 'HubspotCustomer',
                  id: 'hc-1',
                  integrationId: 'int-hub',
                  integrationCode: 'hub-1',
                  integrationType: IntegrationTypeEnum.Hubspot,
                  externalCustomerId: 'hub_cus_1',
                  syncWithProvider: false,
                  targetedObject: HubspotTargetedObjectsEnum.Companies,
                },
              ],
            })}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_EXTERNAL_LINK_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a connection whose provider customer id is missing', () => {
    describe('WHEN an Anrok tax connection is selected', () => {
      // Anrok always syncs with its provider, so its own copy must win over
      // the generic "sync in progress" one
      it('THEN should explain the id lands with the first invoice', () => {
        render(
          <ConnectionDetailsPanel
            row={{ ...ACCOUNTING_ROW, category: ConnectionCategory.Tax, id: 'tax-anrok-1' }}
            customer={buildCustomer({
              integrationCustomers: [
                {
                  __typename: 'AnrokCustomer',
                  id: 'ac-1',
                  integrationId: 'int-anrok',
                  integrationCode: 'anrok-1',
                  integrationType: IntegrationTypeEnum.Anrok,
                  externalCustomerId: null,
                  syncWithProvider: true,
                },
              ],
            })}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID)).toHaveTextContent(
          /after the first invoice/i,
        )
      })
    })

    describe('WHEN a NetSuite connection is still syncing with its provider', () => {
      it('THEN should say the id is on its way rather than blame the settings', () => {
        render(
          <ConnectionDetailsPanel
            row={ACCOUNTING_ROW}
            customer={buildCustomer({
              integrationCustomers: [
                {
                  ...NETSUITE_INTEGRATION_CONNECTION,
                  externalCustomerId: null,
                  syncWithProvider: true,
                },
              ],
            })}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID)).toHaveTextContent(
          /being created and will appear shortly/i,
        )
      })
    })

    describe('WHEN a NetSuite connection has nothing pending', () => {
      it('THEN should point the user back to the integration settings', () => {
        render(
          <ConnectionDetailsPanel
            row={ACCOUNTING_ROW}
            customer={buildCustomer({
              integrationCustomers: [
                {
                  ...NETSUITE_INTEGRATION_CONNECTION,
                  externalCustomerId: null,
                  syncWithProvider: false,
                },
              ],
            })}
            integrationsData={INTEGRATIONS_DATA}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID)).toHaveTextContent(
          /unable to link this customer/i,
        )
      })
    })

    describe('WHEN a payment connection is still syncing with its provider', () => {
      it('THEN should say the id is on its way rather than blame the settings', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            customer={buildCustomer({
              paymentProviderCustomers: [
                MANUAL_PLACEHOLDER_CONNECTION,
                {
                  ...STRIPE_PAYMENT_CONNECTION,
                  providerCustomerId: null,
                  syncWithProvider: true,
                },
              ],
            })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID)).toHaveTextContent(
          /being created and will appear shortly/i,
        )
      })
    })

    describe('WHEN a payment connection is selected', () => {
      it('THEN should point the user back to the integration settings', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            customer={buildCustomer({
              paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION],
            })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID)).toHaveTextContent(
          /unable to link this customer/i,
        )
      })

      it('THEN should keep the Provider customer ID row visible', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            customer={buildCustomer({
              paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION],
            })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByText('Provider customer ID')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a payment provider that has no provider-customer mapping', () => {
    describe.each([
      ['Cashfree', ProviderTypeEnum.Cashfree],
      ['Flutterwave', ProviderTypeEnum.Flutterwave],
    ])('WHEN the %s connection is selected', (_, paymentProvider) => {
      it('THEN should drop the Provider customer ID row instead of reporting a broken connection', () => {
        render(
          <ConnectionDetailsPanel
            row={PAYMENT_ROW}
            // No provider connection at all: these providers never get one
            customer={buildCustomer({ paymentProvider, paymentProviderCustomers: [] })}
            integrationsLoading={false}
          />,
        )

        expect(screen.queryByText('Provider customer ID')).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
