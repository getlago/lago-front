import { renderHook } from '@testing-library/react'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  AddCustomerDrawerFragment,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'

import { useCustomerConnectionsPersistence } from '../useCustomerConnectionsPersistence'

const mockUpdateCustomer = jest.fn(() => Promise.resolve({ errors: undefined }))
const mockClientQuery = jest.fn(() => Promise.resolve({ data: { customer: null } }))
const mockAddToast = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateCustomerMutation: () => [mockUpdateCustomer],
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

const NETSUITE_ECHOED_ENTRY = {
  id: 'nc-1',
  integrationCode: 'ns-1',
  integrationType: IntegrationTypeEnum.Netsuite,
  syncWithProvider: false,
  externalCustomerId: 'ns_cus_1',
  subsidiaryId: 'sub-1',
}

const HUBSPOT_ECHOED_ENTRY = {
  id: 'hc-1',
  integrationCode: 'hub-1',
  integrationType: IntegrationTypeEnum.Hubspot,
  syncWithProvider: true,
  externalCustomerId: 'hub_cus_1',
  targetedObject: HubspotTargetedObjectsEnum.Companies,
}

const setup = () => renderHook(() => useCustomerConnectionsPersistence({ customer })).result

const sentInput = (): UpdateCustomerInput =>
  (
    mockUpdateCustomer.mock.calls[0] as unknown as [{ variables: { input: UpdateCustomerInput } }]
  )[0].variables.input

describe('useCustomerConnectionsPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateCustomer.mockResolvedValue({ errors: undefined })
    mockClientQuery.mockResolvedValue({ data: { customer: null } } as never)
  })

  describe('GIVEN a payment connection save', () => {
    describe('WHEN the drawer values carry a provider mapping', () => {
      it('THEN should send only the base and payment keys', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
            syncWithProvider: false,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
              [ProviderPaymentMethodsEnum.SepaDebit]: false,
            },
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(true)
        expect(sentInput()).toEqual({
          id: 'cust-1',
          externalId: 'ext-1',
          paymentProvider: ProviderTypeEnum.Stripe,
          paymentProviderCode: 'stripe-eu',
          providerCustomer: {
            providerCustomerId: 'cus_123',
            syncWithProvider: false,
            providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
          },
        })
      })

      it('THEN should never send unrelated customer fields', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        const input = sentInput()

        expect(input).not.toHaveProperty('metadata')
        expect(input).not.toHaveProperty('currency')
        expect(input).not.toHaveProperty('integrationCustomers')
        expect(input).not.toHaveProperty('name')
      })
    })

    describe('WHEN there is neither a mapping nor a provider-side sync', () => {
      it('THEN should send a null providerCustomer (no provider-side customer)', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'cashfree-1',
            providerType: ProviderTypeEnum.Cashfree,
            externalCustomerId: '',
            syncWithProvider: false,
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(sentInput().providerCustomer).toBeNull()
      })
    })

    describe('WHEN the provider type cannot be resolved', () => {
      it('THEN should abort without calling the mutation', async () => {
        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: undefined,
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(false)
        expect(mockUpdateCustomer).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN a payment connection delete', () => {
    describe('WHEN confirmed', () => {
      it('THEN should send the explicit null removal keys and nothing else', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Payment)

        expect(succeeded).toBe(true)
        expect(sentInput()).toEqual({
          id: 'cust-1',
          externalId: 'ext-1',
          paymentProvider: null,
          providerCustomer: null,
        })
      })
    })
  })

  describe('GIVEN an integration connection save', () => {
    describe('WHEN adding a NEW tax connection', () => {
      it('THEN should echo the sibling links verbatim and append the new entry without id', async () => {
        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
            syncWithProvider: false,
          } as ConnectionFormValues,
          { isEdition: false },
        )

        expect(sentInput()).toEqual({
          id: 'cust-1',
          externalId: 'ext-1',
          integrationCustomers: [
            NETSUITE_ECHOED_ENTRY,
            {
              id: undefined,
              integrationCode: 'anrok-1',
              integrationType: IntegrationTypeEnum.Anrok,
              syncWithProvider: false,
              externalCustomerId: 'anrok_cus_1',
            },
            HUBSPOT_ECHOED_ENTRY,
          ],
        })
      })

      it('THEN should refresh silently and stop as soon as the async-created link lands', async () => {
        // The link is already there on the first (awaited) refresh → no poll
        mockClientQuery.mockResolvedValue({
          data: {
            customer: {
              ...customer,
              anrokCustomer: {
                id: 'ac-1',
                integrationCode: 'anrok-1',
                integrationType: IntegrationTypeEnum.Anrok,
              },
            },
          },
        } as never)

        const result = setup()

        await result.current.saveConnection(
          ConnectionCategory.Tax,
          {
            providerCode: 'anrok-1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok_cus_1',
          } as ConnectionFormValues,
          { isEdition: false },
        )

        expect(mockClientQuery).toHaveBeenCalledTimes(1)
        expect(mockClientQuery).toHaveBeenCalledWith(
          expect.objectContaining({ fetchPolicy: 'network-only' }),
        )
      })

      it('THEN should keep polling in the background while the link is missing', async () => {
        jest.useFakeTimers()

        try {
          // Refreshes keep returning the stale customer (link never lands)
          mockClientQuery.mockResolvedValue({ data: { customer } } as never)

          const result = setup()

          await result.current.saveConnection(
            ConnectionCategory.Tax,
            {
              providerCode: 'anrok-1',
              providerType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'anrok_cus_1',
            } as ConnectionFormValues,
            { isEdition: false },
          )

          // Awaited refresh right after the mutation
          expect(mockClientQuery).toHaveBeenCalledTimes(1)

          // Background poll: one more silent refresh per interval, bounded
          await jest.advanceTimersByTimeAsync(1000)
          expect(mockClientQuery).toHaveBeenCalledTimes(2)

          await jest.advanceTimersByTimeAsync(3000)
          expect(mockClientQuery).toHaveBeenCalledTimes(4)
        } finally {
          jest.useRealTimers()
        }
      })
    })

    describe('WHEN editing the accounting connection without changing it', () => {
      it('THEN should keep the persisted link id and the drawer values', async () => {
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

        expect(sentInput().integrationCustomers).toEqual([
          {
            id: 'nc-1',
            integrationCode: 'ns-1',
            integrationType: IntegrationTypeEnum.Netsuite,
            syncWithProvider: true,
            externalCustomerId: 'ns_cus_UPDATED',
            subsidiaryId: 'sub-2',
          },
          HUBSPOT_ECHOED_ENTRY,
        ])
      })

      it('THEN should not poll (a single silent consistency refresh only)', async () => {
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

        // Fire-and-forget refresh — flush the microtask
        await Promise.resolve()

        expect(mockClientQuery).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN switching the accounting connection to another integration', () => {
      it('THEN should drop the link id so the backend creates a new link', async () => {
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

        const entries = sentInput().integrationCustomers

        expect(entries?.find((e) => e.integrationCode === 'xero-1')?.id).toBeUndefined()
        // Sibling untouched
        expect(entries?.find((e) => e.integrationCode === 'hub-1')).toEqual(HUBSPOT_ECHOED_ENTRY)
      })
    })
  })

  describe('GIVEN an integration connection delete', () => {
    describe('WHEN deleting the CRM connection', () => {
      it('THEN should resend only the remaining links, ids preserved', async () => {
        const result = setup()

        const succeeded = await result.current.deleteConnection(ConnectionCategory.Crm)

        expect(succeeded).toBe(true)
        expect(sentInput()).toEqual({
          id: 'cust-1',
          externalId: 'ext-1',
          integrationCustomers: [NETSUITE_ECHOED_ENTRY],
        })
      })
    })
  })

  describe('GIVEN the mutation fails', () => {
    describe('WHEN saving', () => {
      it('THEN should return false and show no success toast', async () => {
        mockUpdateCustomer.mockResolvedValue({ errors: [{}] } as never)

        const result = setup()

        const succeeded = await result.current.saveConnection(
          ConnectionCategory.Payment,
          {
            providerCode: 'stripe-eu',
            providerType: ProviderTypeEnum.Stripe,
            externalCustomerId: 'cus_123',
          } as ConnectionFormValues,
          { isEdition: true },
        )

        expect(succeeded).toBe(false)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })
  })
})
