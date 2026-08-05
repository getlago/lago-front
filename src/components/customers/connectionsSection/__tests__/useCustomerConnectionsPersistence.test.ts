import { renderHook } from '@testing-library/react'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import {
  AddCustomerDrawerFragment,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'

import { useCustomerConnectionsPersistence } from '../useCustomerConnectionsPersistence'

const mockCreatePayment = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockUpdatePayment = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockDestroyPayment = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockCreateIntegration = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockUpdateIntegration = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockDestroyIntegration = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockClientQuery = jest.fn(() => Promise.resolve({ data: { customer: null } }))
const mockAddToast = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateCustomerPaymentConnectionMutation: () => [mockCreatePayment],
  useUpdateCustomerPaymentConnectionMutation: () => [mockUpdatePayment],
  useDestroyCustomerPaymentConnectionMutation: () => [mockDestroyPayment],
  useCreateCustomerIntegrationConnectionMutation: () => [mockCreateIntegration],
  useUpdateCustomerIntegrationConnectionMutation: () => [mockUpdateIntegration],
  useDestroyCustomerIntegrationConnectionMutation: () => [mockDestroyIntegration],
}))

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ query: mockClientQuery }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

/**
 * Customer with a Stripe payment connection, a NetSuite accounting link and a
 * Hubspot CRM link persisted — tax slot empty.
 */
const customer = {
  id: 'cust-1',
  externalId: 'ext-1',
  paymentProvider: ProviderTypeEnum.Stripe,
  paymentProviderCode: 'stripe-eu',
  providerCustomer: {
    id: 'pc-1',
    providerCustomerId: 'cus_123',
    syncWithProvider: false,
    providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
  },
  netsuiteCustomer: {
    __typename: 'NetsuiteCustomer',
    id: 'nc-1',
    integrationId: 'int-ns',
    integrationCode: 'ns-1',
    integrationType: IntegrationTypeEnum.Netsuite,
    externalCustomerId: 'ns_cus_1',
    syncWithProvider: false,
    subsidiaryId: 'sub-1',
  },
  hubspotCustomer: {
    __typename: 'HubspotCustomer',
    id: 'hc-1',
    integrationId: 'int-hub',
    integrationCode: 'hub-1',
    integrationType: IntegrationTypeEnum.Hubspot,
    externalCustomerId: 'hub_cus_1',
    syncWithProvider: true,
    targetedObject: HubspotTargetedObjectsEnum.Companies,
  },
  xeroCustomer: null,
  anrokCustomer: null,
  avalaraCustomer: null,
  salesforceCustomer: null,
} as unknown as AddCustomerDrawerFragment

/** Org lists resolving each connection code to its integration id */
const connectionOptions = {
  allAccountingIntegrations: [
    { __typename: 'NetsuiteIntegration', id: 'org-int-ns', code: 'ns-1', name: 'NetSuite Prod' },
    { __typename: 'XeroIntegration', id: 'org-int-xero', code: 'xero-1', name: 'Xero Main' },
  ],
  allTaxIntegrations: [
    { __typename: 'AnrokIntegration', id: 'org-int-anrok', code: 'anrok-1', name: 'Anrok Main' },
  ],
  allCrmIntegrations: [
    { __typename: 'HubspotIntegration', id: 'org-int-hub', code: 'hub-1', name: 'Hubspot Main' },
  ],
} as unknown as ReturnType<typeof useConnectionOptions>

const setup = () =>
  renderHook(() => useCustomerConnectionsPersistence({ customer, connectionOptions })).result

describe('useCustomerConnectionsPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a payment connection save', () => {
    describe('WHEN editing the existing connection (same code)', () => {
      it('THEN should update the link in place by its id', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_456',
            syncWithProvider: true,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
              [ProviderPaymentMethodsEnum.SepaDebit]: false,
            },
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(true)
        expect(mockUpdatePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'pc-1',
              providerCustomerId: 'cus_456',
              syncWithProvider: true,
              providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
            },
          },
        })
        expect(mockCreatePayment).not.toHaveBeenCalled()
        expect(mockDestroyPayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN switching to another payment provider', () => {
      it('THEN should destroy the old link before creating the new one', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'adyen-eu',
            providerType: ProviderTypeEnum.Adyen,
            externalCustomerId: 'adyen_cus_1',
            syncWithProvider: false,
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(mockDestroyPayment).toHaveBeenCalledWith({
          variables: { input: { id: 'pc-1' } },
        })
        expect(mockCreatePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'cust-1',
              paymentProvider: ProviderTypeEnum.Adyen,
              paymentProviderCode: 'adyen-eu',
              providerCustomerId: 'adyen_cus_1',
              syncWithProvider: false,
              providerPaymentMethods: [],
            },
          },
        })
        expect(mockDestroyPayment.mock.invocationCallOrder[0]).toBeLessThan(
          mockCreatePayment.mock.invocationCallOrder[0],
        )
        expect(mockUpdatePayment).not.toHaveBeenCalled()
      })

      it('THEN should not create when the destroy half fails', async () => {
        mockDestroyPayment.mockResolvedValueOnce({ errors: [{}] } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'adyen-eu',
            providerType: ProviderTypeEnum.Adyen,
            externalCustomerId: 'adyen_cus_1',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(false)
        expect(mockCreatePayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the customer has no payment connection yet', () => {
      it('THEN should create without destroying anything', async () => {
        const bareCustomer = {
          ...customer,
          paymentProvider: null,
          paymentProviderCode: null,
          providerCustomer: null,
        } as unknown as AddCustomerDrawerFragment

        const result = renderHook(() =>
          useCustomerConnectionsPersistence({ customer: bareCustomer, connectionOptions }),
        ).result

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: false },
        )

        expect(mockCreatePayment).toHaveBeenCalledTimes(1)
        expect(mockDestroyPayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the provider type cannot be resolved', () => {
      it('THEN should abort without calling any mutation', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          { providerCode: 'stripe-eu', providerType: undefined } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(false)
        expect(mockCreatePayment).not.toHaveBeenCalled()
        expect(mockUpdatePayment).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN an integration connection save', () => {
    describe('WHEN adding a NEW tax connection', () => {
      it('THEN should create the link against the org integration id resolved from the code', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
            syncWithProvider: false,
          } as ConnectionFormValues,
          { isEdition: false },
        )

        expect(succeeded).toBe(true)
        expect(mockCreateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'cust-1',
              integrationId: 'org-int-anrok',
              externalCustomerId: 'anrok_cus_1',
              syncWithProvider: false,
            },
          },
        })
        expect(mockUpdateIntegration).not.toHaveBeenCalled()
        expect(mockDestroyIntegration).not.toHaveBeenCalled()
      })
    })

    describe('WHEN editing the accounting connection without changing it', () => {
      it('THEN should update the link in place, carrying the subsidiary', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Accounting,
          {
            providerCode: 'ns-1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'ns_cus_UPDATED',
            syncWithProvider: true,
            subsidiaryId: 'sub-2',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(mockUpdateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'nc-1',
              externalCustomerId: 'ns_cus_UPDATED',
              syncWithProvider: true,
              subsidiaryId: 'sub-2',
            },
          },
        })
        expect(mockCreateIntegration).not.toHaveBeenCalled()
      })
    })

    describe('WHEN editing the CRM connection', () => {
      it('THEN should carry the targeted object', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Crm,
          {
            providerCode: 'hub-1',
            providerType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'hub_cus_1',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Contacts,
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(mockUpdateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'hc-1',
              externalCustomerId: 'hub_cus_1',
              syncWithProvider: true,
              targetedObject: HubspotTargetedObjectsEnum.Contacts,
            },
          },
        })
      })
    })

    describe('WHEN switching the accounting connection to another integration', () => {
      it('THEN should destroy the old link before creating the new one', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Accounting,
          {
            providerCode: 'xero-1',
            providerType: IntegrationTypeEnum.Xero,
            externalCustomerId: 'xero_cus_1',
            syncWithProvider: false,
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(mockDestroyIntegration).toHaveBeenCalledWith({
          variables: { input: { id: 'nc-1' } },
        })
        expect(mockCreateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'cust-1',
              integrationId: 'org-int-xero',
              externalCustomerId: 'xero_cus_1',
              syncWithProvider: false,
            },
          },
        })
        expect(mockDestroyIntegration.mock.invocationCallOrder[0]).toBeLessThan(
          mockCreateIntegration.mock.invocationCallOrder[0],
        )
      })
    })

    describe('WHEN the connection code cannot be resolved to an org integration', () => {
      it('THEN should abort without calling any mutation', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            providerCode: 'ghost-integration',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
          } as ConnectionFormValues,
          { isEdition: false },
        )

        expect(succeeded).toBe(false)
        expect(mockCreateIntegration).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN a connection delete', () => {
    describe('WHEN deleting the payment connection', () => {
      it('THEN should destroy the link by its id', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Payment)

        expect(succeeded).toBe(true)
        expect(mockDestroyPayment).toHaveBeenCalledWith({
          variables: { input: { id: 'pc-1' } },
        })
      })
    })

    describe('WHEN deleting the CRM connection', () => {
      it('THEN should destroy the link by its id', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Crm)

        expect(succeeded).toBe(true)
        expect(mockDestroyIntegration).toHaveBeenCalledWith({
          variables: { input: { id: 'hc-1' } },
        })
      })
    })

    describe('WHEN there is no persisted link for the category', () => {
      it('THEN should abort without calling any mutation', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Tax)

        expect(succeeded).toBe(false)
        expect(mockDestroyIntegration).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN the silent customer refresh', () => {
    describe('WHEN a save succeeds', () => {
      it('THEN should query the customer once, network-only', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Accounting,
          {
            providerCode: 'ns-1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'ns_cus_1',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(mockClientQuery).toHaveBeenCalledTimes(1)
        expect(mockClientQuery).toHaveBeenCalledWith(
          expect.objectContaining({ fetchPolicy: 'network-only' }),
        )
      })
    })

    describe('WHEN a provider switch fails after its destroy half', () => {
      it('THEN should still refresh so the section shows the real state', async () => {
        mockCreatePayment.mockResolvedValueOnce({ errors: [{}] } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'adyen-eu',
            providerType: ProviderTypeEnum.Adyen,
            externalCustomerId: 'adyen_cus_1',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(false)
        expect(mockClientQuery).toHaveBeenCalledTimes(1)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })
  })

  describe('GIVEN the success toasts', () => {
    it.each([
      ['updated toast on edition', true],
      ['added toast on creation', false],
    ])('THEN should show the %s', async (_, isEdition) => {
      const result = setup()

      await result.current.saveConnection(
        ConnectionCategory.Accounting,
        {
          providerCode: 'ns-1',
          providerType: IntegrationTypeEnum.Netsuite,
          externalCustomerId: 'ns_cus_1',
        } as ConnectionFormValues,
        { isEdition },
      )

      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
  })
})
