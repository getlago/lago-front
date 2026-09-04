import { renderHook } from '@testing-library/react'

import {
  ConnectionFormValues,
  CustomerConnectionDrawerFormApi,
} from '~/components/customerConnections/CustomerConnectionDrawer'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import {
  INTEGRATION_POLLING_INTERVAL,
  MAX_INTEGRATION_POLLING_ATTEMPTS,
} from '~/core/constants/integrationPolling'
import {
  AddCustomerDrawerFragment,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  LagoApiError,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'

import { useCustomerConnectionsPersistence } from '../useCustomerConnectionsPersistence'

const mockCreatePayment = jest.fn(() =>
  Promise.resolve({ data: { createPaymentProviderCustomer: { id: 'pc-new' } } }),
)
const mockUpdatePayment = jest.fn(() =>
  Promise.resolve({ data: { updatePaymentProviderCustomer: { id: 'pc-1' } } }),
)
const mockDestroyPayment = jest.fn(() =>
  Promise.resolve({ data: { destroyPaymentProviderCustomer: { id: 'pc-1' } } }),
)
const mockCreateIntegration = jest.fn(() =>
  Promise.resolve({ data: { createIntegrationCustomer: { __typename: 'AnrokCustomer' } } }),
)
const mockUpdateIntegration = jest.fn(() =>
  Promise.resolve({ data: { updateIntegrationCustomer: { __typename: 'NetsuiteCustomer' } } }),
)
const mockDestroyIntegration = jest.fn(() =>
  Promise.resolve({ data: { destroyIntegrationCustomer: { id: 'link-1' } } }),
)
const mockClearPaymentProvider = jest.fn(() =>
  Promise.resolve({ data: { updateCustomer: { id: 'cust-1' } } }),
)
const mockClientQuery = jest.fn(() => Promise.resolve({ data: { customer: null } }))
const mockAddToast = jest.fn()
const mockApplyExistingCodeError = jest.fn()

const formApi = {} as CustomerConnectionDrawerFormApi

/** Options the four save mutations are registered with, keyed by mutation name */
const mutationOptions: Record<string, unknown> = {}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateCustomerPaymentConnectionMutation: (options: unknown) => {
    mutationOptions.createPayment = options

    return [mockCreatePayment]
  },
  useUpdateCustomerPaymentConnectionMutation: (options: unknown) => {
    mutationOptions.updatePayment = options

    return [mockUpdatePayment]
  },
  useDestroyCustomerPaymentConnectionMutation: () => [mockDestroyPayment],
  useCreateCustomerIntegrationConnectionMutation: (options: unknown) => {
    mutationOptions.createIntegration = options

    return [mockCreateIntegration]
  },
  useUpdateCustomerIntegrationConnectionMutation: (options: unknown) => {
    mutationOptions.updateIntegration = options

    return [mockUpdateIntegration]
  },
  useDestroyCustomerIntegrationConnectionMutation: () => [mockDestroyIntegration],
  useClearCustomerPaymentProviderMutation: () => [mockClearPaymentProvider],
}))

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ query: mockClientQuery }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('~/core/form/existingCodeError', () => ({
  ...jest.requireActual('~/core/form/existingCodeError'),
  applyExistingCodeError: (...args: unknown[]) => mockApplyExistingCodeError(...args),
}))

/** The backend's non-persisted manual placeholder, prepended to the array */
const MANUAL_PLACEHOLDER_CONNECTION = {
  __typename: 'ProviderCustomer',
  id: 'cust-1-manual',
  code: MANUAL_CONNECTION_CODE,
  isDefault: false,
}

/**
 * Customer with a Stripe payment connection (behind the manual placeholder), a
 * NetSuite accounting link and a Hubspot CRM link persisted — no tax link.
 */
const customer = {
  id: 'cust-1',
  externalId: 'ext-1',
  paymentProvider: ProviderTypeEnum.Stripe,
  paymentProviderCode: 'stripe-eu',
  paymentProviderCustomers: [
    MANUAL_PLACEHOLDER_CONNECTION,
    {
      __typename: 'ProviderCustomer',
      id: 'pc-1',
      code: 'stripe',
      isDefault: true,
      providerCustomerId: 'cus_123',
      syncWithProvider: false,
      providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
    },
  ],
  integrationCustomers: [
    {
      __typename: 'NetsuiteCustomer',
      id: 'nc-1',
      integrationId: 'int-ns',
      integrationCode: 'ns-1',
      integrationType: IntegrationTypeEnum.Netsuite,
      externalCustomerId: 'ns_cus_1',
      syncWithProvider: false,
      subsidiaryId: 'sub-1',
    },
    {
      __typename: 'HubspotCustomer',
      id: 'hc-1',
      integrationId: 'int-hub',
      integrationCode: 'hub-1',
      integrationType: IntegrationTypeEnum.Hubspot,
      externalCustomerId: 'hub_cus_1',
      syncWithProvider: true,
      targetedObject: HubspotTargetedObjectsEnum.Companies,
    },
  ],
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
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(true)
        expect(mockUpdatePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: true, formApi },
        )

        expect(mockDestroyPayment).toHaveBeenCalledWith({
          variables: { input: { id: 'pc-1' } },
        })
        expect(mockCreatePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockCreatePayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the customer has only the manual placeholder in its payment array', () => {
      it('THEN should create without destroying anything', async () => {
        const bareCustomer = {
          ...customer,
          paymentProvider: null,
          paymentProviderCode: null,
          paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION],
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
          { isEdition: false, formApi },
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
          { isEdition: true, formApi },
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
          { isEdition: false, formApi },
        )

        expect(succeeded).toBe(true)
        expect(mockCreateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: true, formApi },
        )

        expect(mockUpdateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: true, formApi },
        )

        expect(mockUpdateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: true, formApi },
        )

        expect(mockDestroyIntegration).toHaveBeenCalledWith({
          variables: { input: { id: 'nc-1' } },
        })
        expect(mockCreateIntegration).toHaveBeenCalledWith({
          variables: {
            input: {
              code: null,
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
          { isEdition: false, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockCreateIntegration).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN a connection delete', () => {
    describe('WHEN deleting the payment connection', () => {
      it('THEN should destroy the provider link by its id, never the manual row', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Payment)

        expect(succeeded).toBe(true)
        expect(mockDestroyPayment).toHaveBeenCalledTimes(1)
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

    describe('WHEN the payment array holds nothing but a manual row', () => {
      it('THEN should clear the payment provider with explicit nulls instead of destroying the manual row', async () => {
        const linklessCustomer = {
          ...customer,
          paymentProviderCustomers: [MANUAL_PLACEHOLDER_CONNECTION],
        } as unknown as AddCustomerDrawerFragment

        const result = renderHook(() =>
          useCustomerConnectionsPersistence({ customer: linklessCustomer, connectionOptions }),
        ).result

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Payment)

        expect(succeeded).toBe(true)
        // paymentProviderCode must be nulled too: with no provider customer to
        // discard, the backend leaves it behind as a dangling code
        expect(mockClearPaymentProvider).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'cust-1',
              externalId: 'ext-1',
              paymentProvider: null,
              paymentProviderCode: null,
              providerCustomer: null,
            },
          },
        })
        expect(mockDestroyPayment).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
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
          { isEdition: true, formApi },
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
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockClientQuery).toHaveBeenCalledTimes(1)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })

    describe('WHEN the backend has not created the integration link yet', () => {
      afterEach(() => {
        jest.useRealTimers()
      })

      const saveTaxConnection = (result: ReturnType<typeof setup>) =>
        result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
          } as ConnectionFormValues,
          { isEdition: false, formApi },
        )

      it('THEN should read again until the saved link shows up', async () => {
        jest.useFakeTimers()

        // The first read still misses the link, the second carries it
        mockClientQuery
          .mockResolvedValueOnce({ data: { customer } } as never)
          .mockResolvedValueOnce({
            data: {
              customer: {
                ...customer,
                integrationCustomers: [
                  {
                    __typename: 'AnrokCustomer',
                    id: 'an-1',
                    integrationCode: 'anrok-1',
                    integrationType: IntegrationTypeEnum.Anrok,
                  },
                ],
              },
            },
          } as never)

        const saving = saveTaxConnection(setup())

        await jest.advanceTimersByTimeAsync(INTEGRATION_POLLING_INTERVAL)

        expect(await saving).toBe(true)
        expect(mockClientQuery).toHaveBeenCalledTimes(2)
      })

      it('THEN should give up after the shared attempt budget', async () => {
        jest.useFakeTimers()

        // The link never lands: every read comes back without it
        for (let attempt = 0; attempt < MAX_INTEGRATION_POLLING_ATTEMPTS; attempt++) {
          mockClientQuery.mockResolvedValueOnce({ data: { customer } } as never)
        }

        const saving = saveTaxConnection(setup())

        await jest.advanceTimersByTimeAsync(
          INTEGRATION_POLLING_INTERVAL * MAX_INTEGRATION_POLLING_ATTEMPTS,
        )

        expect(await saving).toBe(true)
        expect(mockClientQuery).toHaveBeenCalledTimes(MAX_INTEGRATION_POLLING_ATTEMPTS)
      })
    })
  })

  describe('GIVEN a mutation that throws (network error)', () => {
    describe('WHEN deleting a connection', () => {
      it('THEN should resolve false instead of bubbling an unhandled rejection', async () => {
        mockDestroyIntegration.mockRejectedValueOnce(new Error('network'))

        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Crm)

        expect(succeeded).toBe(false)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })

    describe('WHEN saving a connection', () => {
      it('THEN should resolve false and show no success toast', async () => {
        mockUpdateIntegration.mockRejectedValueOnce(new Error('network'))

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Accounting,
          {
            providerCode: 'ns-1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'ns_cus_1',
          } as ConnectionFormValues,
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })
  })

  describe('GIVEN a mutation that resolves without its payload', () => {
    describe('WHEN saving', () => {
      it('THEN should treat the write as failed', async () => {
        mockUpdateIntegration.mockResolvedValueOnce({ data: {} } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Accounting,
          {
            providerCode: 'ns-1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'ns_cus_1',
          } as ConnectionFormValues,
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
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
        { isEdition, formApi },
      )

      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
  })
  describe('GIVEN the connection code', () => {
    describe('WHEN creating a payment connection with a code', () => {
      it('THEN should send it to the create mutation', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            code: 'stripe-eu-2',
            providerCode: 'adyen-eu',
            providerType: ProviderTypeEnum.Adyen,
            externalCustomerId: 'adyen_cus_1',
          } as ConnectionFormValues,
          { isEdition: false, formApi },
        )

        expect(mockCreatePayment).toHaveBeenCalledWith({
          variables: { input: expect.objectContaining({ code: 'stripe-eu-2' }) },
        })
      })
    })

    describe('WHEN editing a payment connection code', () => {
      it('THEN should send it to the update mutation', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            code: 'stripe-renamed',
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: true, formApi },
        )

        expect(mockUpdatePayment).toHaveBeenCalledWith({
          variables: { input: expect.objectContaining({ code: 'stripe-renamed' }) },
        })
      })
    })

    describe('WHEN the code input is left empty', () => {
      it.each([
        ['payment', ConnectionCategory.Payment, () => mockUpdatePayment],
        ['integration', ConnectionCategory.Accounting, () => mockUpdateIntegration],
      ])(
        'THEN should send an explicit null on the %s update mutation, for the backend to backfill',
        async (_, category, getMock) => {
          const result = setup()

          await result.current.saveConnection(
            category,
            {
              code: '',
              providerCode: category === ConnectionCategory.Payment ? 'stripe-eu' : 'ns-1',
              providerType:
                category === ConnectionCategory.Payment
                  ? ProviderTypeEnum.Stripe
                  : IntegrationTypeEnum.Netsuite,
              externalCustomerId: 'cus_123',
            } as ConnectionFormValues,
            { isEdition: true, formApi },
          )

          expect(getMock()).toHaveBeenCalledWith({
            variables: { input: expect.objectContaining({ code: null }) },
          })
        },
      )
    })

    describe('WHEN creating an integration connection with a code', () => {
      it('THEN should send it to the create mutation', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            code: 'anrok-eu',
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
          } as ConnectionFormValues,
          { isEdition: false, formApi },
        )

        expect(mockCreateIntegration).toHaveBeenCalledWith({
          variables: { input: expect.objectContaining({ code: 'anrok-eu' }) },
        })
      })
    })

    describe('WHEN the save mutations are registered', () => {
      it.each([
        ['payment create', 'createPayment'],
        ['payment update', 'updatePayment'],
        ['integration create', 'createIntegration'],
        ['integration update', 'updateIntegration'],
      ])(
        'THEN should let the %s mutation report a duplicate value itself, not the global link',
        (_, mutationName) => {
          setup()

          expect(mutationOptions[mutationName]).toEqual({
            context: { silentErrorDetails: [LagoApiError.ValueAlreadyExist] },
          })
        },
      )
    })

    describe('WHEN the backend rejects another field as already used', () => {
      it('THEN should report it on a toast rather than on the Code input', async () => {
        mockUpdatePayment.mockResolvedValueOnce({
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: { details: { providerCustomerId: ['value_already_exist'] } },
            },
          ],
        } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            code: 'payment-eu',
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockApplyExistingCodeError).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })

    describe('WHEN the backend rejects the code as already used', () => {
      it('THEN should surface it on the drawer Code input', async () => {
        mockUpdatePayment.mockResolvedValueOnce({
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: { details: { code: ['value_already_exist'] } },
            },
          ],
        } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            code: 'already-used',
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: true, formApi },
        )

        expect(succeeded).toBe(false)
        expect(mockApplyExistingCodeError).toHaveBeenCalledWith(formApi)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })
  })
})
