import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import {
  ConnectionPaymentMethodsDocument,
  ConnectionPaymentMethodsQuery,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { createMockPaymentMethod } from './factories/PaymentMethod.factory'

import { useConnectionPaymentMethodsList } from '../useConnectionPaymentMethodsList'
import { PaymentMethodItem } from '../usePaymentMethodsList'

const CUSTOMER_ID = 'customer-id-123'
const CONNECTION_ID = 'connection-id-456'
const OTHER_CONNECTION_ID = 'connection-id-999'

const DEFAULT_METHODS: PaymentMethodItem[] = [
  createMockPaymentMethod({ id: 'pm_001', isDefault: true }),
  createMockPaymentMethod({ id: 'pm_002', isDefault: false }),
]

const createMockResponse = ({
  connectionId = CONNECTION_ID,
  paymentMethods = DEFAULT_METHODS,
  providerCustomer,
}: {
  connectionId?: string
  paymentMethods?: PaymentMethodItem[]
  providerCustomer?: null
} = {}): ConnectionPaymentMethodsQuery => {
  return {
    __typename: 'Query',
    customer: {
      __typename: 'Customer',
      id: CUSTOMER_ID,
      providerCustomer:
        providerCustomer === null
          ? null
          : {
              __typename: 'ProviderCustomer',
              id: connectionId,
              paymentMethods: {
                __typename: 'PaymentMethodCollection',
                collection: paymentMethods,
              },
            },
    },
  }
}

type PrepareType = {
  mock?: ConnectionPaymentMethodsQuery
  error?: boolean
  customerId?: string
  connectionId?: string
}

async function prepare({
  mock,
  error = false,
  customerId = CUSTOMER_ID,
  connectionId = CONNECTION_ID,
}: PrepareType = {}) {
  const mocks = [
    {
      request: {
        query: ConnectionPaymentMethodsDocument,
        variables: {
          customerId: CUSTOMER_ID,
          withDeleted: true,
          limit: 50,
        },
      },
      result: error
        ? {
            errors: [{ message: 'Network error' }],
          }
        : {
            data: mock || createMockResponse(),
          },
    },
  ]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })

  const { result } = renderHook(
    () => useConnectionPaymentMethodsList({ customerId, connectionId }),
    {
      wrapper: customWrapper,
    },
  )

  return { result }
}

describe('useConnectionPaymentMethodsList', () => {
  describe('GIVEN a customer with a payment connection', () => {
    describe('WHEN the query succeeds', () => {
      it('THEN returns the connection payment methods', async () => {
        const { result } = await prepare()

        expect(result.current.loading).toBeTruthy()

        await act(() => wait(0))

        expect(result.current.loading).toBeFalsy()
        expect(result.current.error).toBeFalsy()
        expect(result.current.data).toHaveLength(2)
        expect(result.current.data[0].id).toBe('pm_001')
        expect(result.current.data[1].id).toBe('pm_002')
        expect(result.current.refetch).toBeDefined()
      })
    })

    describe('WHEN the resolved connection is not the selected one', () => {
      it('THEN returns no methods instead of another connection ones', async () => {
        const { result } = await prepare({
          mock: createMockResponse({ connectionId: OTHER_CONNECTION_ID }),
        })

        await act(() => wait(0))

        expect(result.current.loading).toBeFalsy()
        expect(result.current.error).toBeFalsy()
        expect(result.current.data).toEqual([])
      })
    })

    describe('WHEN the customer has no provider connection', () => {
      it('THEN returns empty data', async () => {
        const { result } = await prepare({
          mock: createMockResponse({ providerCustomer: null }),
        })

        await act(() => wait(0))

        expect(result.current.loading).toBeFalsy()
        expect(result.current.error).toBeFalsy()
        expect(result.current.data).toEqual([])
      })
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN the error is returned', () => {
      it('THEN exposes the error state with empty data', async () => {
        const { result } = await prepare({ error: true })

        await act(() => wait(0))

        expect(result.current.loading).toBeFalsy()
        expect(result.current.error).toBeTruthy()
        expect(result.current.data).toEqual([])
      })
    })
  })

  describe('GIVEN missing identifiers', () => {
    describe.each([
      ['customerId', { customerId: '', connectionId: CONNECTION_ID }],
      ['connectionId', { customerId: CUSTOMER_ID, connectionId: '' }],
    ])('WHEN %s is empty', (_label, args) => {
      it('THEN skips the query and returns empty data', async () => {
        const { result } = await prepare(args)

        await act(() => wait(0))

        expect(result.current.loading).toBeFalsy()
        expect(result.current.error).toBeFalsy()
        expect(result.current.data).toEqual([])
      })
    })
  })
})
