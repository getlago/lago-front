import { screen } from '@testing-library/react'

import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { buildNetsuiteCustomerUrl, buildStripeCustomerUrl } from '~/core/constants/externalUrls'
import {
  CustomerDetailsFragment,
  HubspotTargetedObjectsEnum,
  IntegrationsListForCustomerMainInfosQuery,
  IntegrationTypeEnum,
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

const buildCustomer = (overrides: Record<string, unknown> = {}): CustomerDetailsFragment =>
  ({
    id: 'cust-1',
    externalId: 'ext-1',
    paymentProvider: ProviderTypeEnum.Stripe,
    paymentProviderCode: 'stripe-eu',
    providerCustomer: {
      id: 'pc-1',
      providerCustomerId: 'cus_123',
      syncWithProvider: false,
      providerPaymentMethods: ['card'],
    },
    netsuiteCustomer: {
      id: 'nc-1',
      integrationId: 'int-ns',
      integrationCode: 'ns-1',
      integrationType: IntegrationTypeEnum.Netsuite,
      externalCustomerId: 'ns_cus_1',
      syncWithProvider: false,
      subsidiaryId: 'sub-1',
    },
    hubspotCustomer: null,
    xeroCustomer: null,
    anrokCustomer: null,
    avalaraCustomer: null,
    salesforceCustomer: null,
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
              hubspotCustomer: {
                id: 'hc-1',
                integrationId: 'int-hub',
                integrationCode: 'hub-1',
                integrationType: IntegrationTypeEnum.Hubspot,
                externalCustomerId: 'hub_cus_1',
                syncWithProvider: false,
                targetedObject: null,
              },
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
              hubspotCustomer: {
                id: 'hc-1',
                integrationId: 'int-hub',
                integrationCode: 'hub-1',
                integrationType: IntegrationTypeEnum.Hubspot,
                externalCustomerId: 'hub_cus_1',
                syncWithProvider: false,
                targetedObject: HubspotTargetedObjectsEnum.Companies,
              },
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
              netsuiteCustomer: null,
              anrokCustomer: {
                id: 'ac-1',
                integrationId: 'int-anrok',
                integrationCode: 'anrok-1',
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: null,
                syncWithProvider: true,
              },
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
              netsuiteCustomer: {
                id: 'nc-1',
                integrationId: 'int-ns',
                integrationCode: 'ns-1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: null,
                syncWithProvider: true,
              },
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
              netsuiteCustomer: {
                id: 'nc-1',
                integrationId: 'int-ns',
                integrationCode: 'ns-1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: null,
                syncWithProvider: false,
              },
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
              providerCustomer: {
                id: 'pc-1',
                providerCustomerId: null,
                syncWithProvider: true,
                providerPaymentMethods: ['card'],
              },
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
            customer={buildCustomer({ providerCustomer: null })}
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
            customer={buildCustomer({ providerCustomer: null })}
            integrationsLoading={false}
          />,
        )

        expect(screen.getByText('Provider customer ID')).toBeInTheDocument()
      })
    })
  })
})
