import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { CustomerIntegrationConnectionsDocument, IntegrationTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useCustomerIntegrationConnections } from '../useCustomerIntegrationConnections'

const CUSTOMER_ID = 'customer-1'

const ORGANIZATION_OPTIONS = {
  accounting: [
    { value: 'netsuite_eu', label: 'Netsuite EU', subLabel: 'netsuite_eu', group: 'Netsuite' },
    { value: 'xero_uk', label: 'Xero UK', subLabel: 'xero_uk', group: 'Xero' },
  ],
  crm: [
    { value: 'hubspot_main', label: 'Hubspot Main', subLabel: 'hubspot_main', group: 'Hubspot' },
  ],
  tax: [{ value: 'anrok_eu', label: 'Anrok EU', subLabel: 'anrok_eu', group: 'Anrok' }],
}

const categoryOptionsArgs: { current: { category: string; skip?: boolean } | null } = {
  current: null,
}

jest.mock('~/components/customerConnections/useCategoryIntegrationOptions', () => ({
  useCategoryIntegrationOptions: (args: {
    category: keyof typeof ORGANIZATION_OPTIONS
    skip?: boolean
  }) => {
    categoryOptionsArgs.current = args

    return {
      options: args.skip ? [] : ORGANIZATION_OPTIONS[args.category],
      isLoading: false,
    }
  },
}))

type IntegrationCustomerRow = {
  __typename: string
  id: string
  code: string | null
  integrationCode: string | null
  integrationType: IntegrationTypeEnum
  isDefault: boolean
}

const NETSUITE_ROW: IntegrationCustomerRow = {
  __typename: 'NetsuiteCustomer',
  id: 'ic-1',
  code: 'customer_netsuite',
  integrationCode: 'netsuite_eu',
  integrationType: IntegrationTypeEnum.Netsuite,
  isDefault: true,
}

const XERO_ROW: IntegrationCustomerRow = {
  __typename: 'XeroCustomer',
  id: 'ic-2',
  code: 'customer_xero',
  integrationCode: 'xero_uk',
  integrationType: IntegrationTypeEnum.Xero,
  isDefault: false,
}

const HUBSPOT_ROW: IntegrationCustomerRow = {
  __typename: 'HubspotCustomer',
  id: 'ic-3',
  code: 'customer_hubspot',
  integrationCode: 'hubspot_main',
  integrationType: IntegrationTypeEnum.Hubspot,
  isDefault: true,
}

const ANROK_ROW: IntegrationCustomerRow = {
  __typename: 'AnrokCustomer',
  id: 'ic-4',
  code: 'customer_anrok',
  integrationCode: 'anrok_eu',
  integrationType: IntegrationTypeEnum.Anrok,
  isDefault: false,
}

const ALL_ROWS = [NETSUITE_ROW, XERO_ROW, HUBSPOT_ROW, ANROK_ROW]

const prepare = async (
  category: IntegrationConnectionCategory,
  integrationCustomers: IntegrationCustomerRow[] = ALL_ROWS,
) => {
  const mocks = [
    {
      request: {
        query: CustomerIntegrationConnectionsDocument,
        variables: { customerId: CUSTOMER_ID },
      },
      result: {
        data: {
          customer: { __typename: 'Customer', id: CUSTOMER_ID, integrationCustomers },
        },
      },
    },
  ]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children, mocks, forceTypenames: true })

  const { result } = renderHook(
    () => useCustomerIntegrationConnections({ customerId: CUSTOMER_ID, category }),
    { wrapper: customWrapper },
  )

  await act(() => wait(0))

  return { result }
}

describe('useCustomerIntegrationConnections', () => {
  beforeEach(() => {
    categoryOptionsArgs.current = null
  })

  describe('GIVEN a customer carrying connections in every category', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should keep only the rows belonging to the requested category', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting)

        expect(result.current.connections.map((connection) => connection.id)).toEqual([
          'ic-1',
          'ic-2',
        ])
      })

      it.each([
        [ConnectionCategory.Crm, ['ic-3']],
        [ConnectionCategory.Tax, ['ic-4']],
      ])('THEN should answer the %s category with its own rows only', async (category, ids) => {
        const { result } = await prepare(category as IntegrationConnectionCategory)

        expect(result.current.connections.map((connection) => connection.id)).toEqual(ids)
      })

      it('THEN should resolve each name and group from the organization integrations', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting)

        expect(result.current.connections).toEqual([
          {
            id: 'ic-1',
            code: 'customer_netsuite',
            name: 'Netsuite EU',
            group: 'Netsuite',
            integrationType: IntegrationTypeEnum.Netsuite,
            isDefault: true,
          },
          {
            id: 'ic-2',
            code: 'customer_xero',
            name: 'Xero UK',
            group: 'Xero',
            integrationType: IntegrationTypeEnum.Xero,
            isDefault: false,
          },
        ])
      })

      it('THEN should flag the default option for the combobox', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting)

        expect(result.current.options).toEqual([
          {
            value: 'customer_netsuite',
            label: 'Netsuite EU',
            subLabel: 'customer_netsuite',
            group: 'Netsuite',
            isDefault: true,
          },
          {
            value: 'customer_xero',
            label: 'Xero UK',
            subLabel: 'customer_xero',
            group: 'Xero',
            isDefault: false,
          },
        ])
      })

      it('THEN should expose the category default connection', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting)

        expect(result.current.defaultConnection?.id).toBe('ic-1')
      })

      it('THEN should report the queries as settled', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting)

        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('GIVEN a customer with no default connection in the category', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should expose no default connection', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting, [XERO_ROW])

        expect(result.current.defaultConnection).toBeUndefined()
      })
    })
  })

  describe('GIVEN a connection whose organization integration is gone', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should fall back to the integration code and drop the group', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting, [
          { ...NETSUITE_ROW, integrationCode: 'deleted_netsuite' },
        ])

        expect(result.current.connections[0]).toEqual(
          expect.objectContaining({ name: 'deleted_netsuite', group: '' }),
        )
      })
    })
  })

  describe('GIVEN a connection whose name equals its code', () => {
    describe('WHEN the options are built', () => {
      it('THEN should suppress the duplicated sub label', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting, [
          { ...NETSUITE_ROW, code: 'dangling_netsuite', integrationCode: 'dangling_netsuite' },
        ])

        expect(result.current.options[0]).toEqual(
          expect.objectContaining({ label: 'dangling_netsuite', subLabel: undefined }),
        )
      })
    })
  })

  describe('GIVEN a connection carrying no code', () => {
    describe('WHEN the queries resolve', () => {
      // `code` is what `ConnectionChoiceInput.code` routes on: a codeless row could never be sent.
      it('THEN should drop it from the selectable connections', async () => {
        const { result } = await prepare(ConnectionCategory.Accounting, [
          { ...NETSUITE_ROW, code: null },
          XERO_ROW,
        ])

        expect(result.current.connections.map((connection) => connection.id)).toEqual(['ic-2'])
      })
    })
  })

  describe('GIVEN no customer id yet', () => {
    describe('WHEN the hook runs', () => {
      it('THEN should skip the query and return nothing', async () => {
        const customWrapper = ({ children }: { children: React.ReactNode }) =>
          AllTheProviders({ children, mocks: [], forceTypenames: true })

        const { result } = renderHook(
          () => useCustomerIntegrationConnections({ category: ConnectionCategory.Accounting }),
          { wrapper: customWrapper },
        )

        await act(() => wait(0))

        expect(result.current.connections).toEqual([])
        expect(result.current.options).toEqual([])
        expect(result.current.defaultConnection).toBeUndefined()
      })

      it('THEN should skip the organization integrations too', async () => {
        const customWrapper = ({ children }: { children: React.ReactNode }) =>
          AllTheProviders({ children, mocks: [], forceTypenames: true })

        renderHook(
          () => useCustomerIntegrationConnections({ category: ConnectionCategory.Accounting }),
          { wrapper: customWrapper },
        )

        await act(() => wait(0))

        expect(categoryOptionsArgs.current).toEqual({
          category: ConnectionCategory.Accounting,
          skip: true,
        })
      })
    })
  })

  describe('GIVEN the caller skips the hook', () => {
    describe('WHEN it runs with a customer id', () => {
      it('THEN should skip the organization integrations as well', async () => {
        const customWrapper = ({ children }: { children: React.ReactNode }) =>
          AllTheProviders({ children, mocks: [], forceTypenames: true })

        renderHook(
          () =>
            useCustomerIntegrationConnections({
              customerId: CUSTOMER_ID,
              category: ConnectionCategory.Accounting,
              skip: true,
            }),
          { wrapper: customWrapper },
        )

        await act(() => wait(0))

        expect(categoryOptionsArgs.current).toEqual({
          category: ConnectionCategory.Accounting,
          skip: true,
        })
      })
    })
  })

  describe('GIVEN the hook runs for a category', () => {
    describe('WHEN the customer query is active', () => {
      it('THEN should ask the organization integrations for that category only', async () => {
        await prepare(ConnectionCategory.Crm)

        expect(categoryOptionsArgs.current).toEqual({
          category: ConnectionCategory.Crm,
          skip: false,
        })
      })
    })
  })
})
