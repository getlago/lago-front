import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import {
  CustomerPaymentConnectionsDocument,
  PaymentProvidersListForCustomerCreateEditExternalAppsAccordionDocument,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useCustomerPaymentConnections } from '../useCustomerPaymentConnections'

const CUSTOMER_ID = 'customer-1'

const paymentProvidersMock = {
  request: {
    query: PaymentProvidersListForCustomerCreateEditExternalAppsAccordionDocument,
    variables: { limit: 1000 },
  },
  result: {
    data: {
      paymentProviders: {
        collection: [
          { __typename: 'StripeProvider', id: '1', name: 'Stripe EU', code: 'stripe_eu' },
          { __typename: 'AdyenProvider', id: '2', name: 'Adyen Global', code: 'adyen_global' },
        ],
      },
    },
  },
}

const buildConnectionsMock = (
  paymentProviderCustomers: Array<{
    __typename: string
    id: string
    code: string | null
    isDefault: boolean
  }>,
) => ({
  request: {
    query: CustomerPaymentConnectionsDocument,
    variables: { customerId: CUSTOMER_ID },
  },
  result: {
    data: {
      customer: {
        __typename: 'Customer',
        id: CUSTOMER_ID,
        paymentProviderCustomers,
      },
    },
  },
})

const prepare = async (
  paymentProviderCustomers = [
    {
      __typename: 'ProviderCustomer',
      id: 'conn-1',
      code: 'stripe_eu',
      isDefault: true,
    },
    {
      __typename: 'ProviderCustomer',
      id: 'conn-2',
      code: 'adyen_global',
      isDefault: false,
    },
  ],
) => {
  const mocks = [paymentProvidersMock, buildConnectionsMock(paymentProviderCustomers)]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children, mocks, forceTypenames: true })

  const { result } = renderHook(() => useCustomerPaymentConnections({ customerId: CUSTOMER_ID }), {
    wrapper: customWrapper,
  })

  await act(() => wait(0))

  return { result }
}

describe('useCustomerPaymentConnections', () => {
  describe('GIVEN the customer has payment connections', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should resolve each connection name from the organization providers', async () => {
        const { result } = await prepare()

        expect(result.current.connections).toEqual([
          {
            id: 'conn-1',
            code: 'stripe_eu',
            name: 'Stripe EU',
            provider: ProviderTypeEnum.Stripe,
            isDefault: true,
          },
          {
            id: 'conn-2',
            code: 'adyen_global',
            name: 'Adyen Global',
            provider: ProviderTypeEnum.Adyen,
            isDefault: false,
          },
        ])
      })

      it('THEN should expose the default connection', async () => {
        const { result } = await prepare()

        expect(result.current.defaultConnection?.id).toBe('conn-1')
      })

      it('THEN should flag the default option for the combobox', async () => {
        const { result } = await prepare()

        expect(result.current.options).toEqual([
          {
            value: 'stripe_eu',
            label: 'Stripe EU',
            subLabel: 'stripe_eu',
            group: ProviderTypeEnum.Stripe,
            isDefault: true,
          },
          {
            value: 'adyen_global',
            label: 'Adyen Global',
            subLabel: 'adyen_global',
            group: ProviderTypeEnum.Adyen,
            isDefault: false,
          },
        ])
      })
    })
  })

  describe('GIVEN the customer carries the manual placeholder connection', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should exclude it from the selectable connections', async () => {
        const { result } = await prepare([
          {
            __typename: 'ProviderCustomer',
            id: 'conn-manual',
            code: MANUAL_CONNECTION_CODE,
            isDefault: false,
          },
          {
            __typename: 'ProviderCustomer',
            id: 'conn-1',
            code: 'stripe_eu',
            isDefault: true,
          },
        ])

        expect(result.current.connections.map((connection) => connection.id)).toEqual(['conn-1'])
      })
    })
  })

  describe('GIVEN a connection whose provider is unknown to the organization', () => {
    describe('WHEN the queries resolve', () => {
      it('THEN should fall back to the connection code as its name', async () => {
        const { result } = await prepare([
          {
            __typename: 'ProviderCustomer',
            id: 'conn-3',
            code: 'gocardless_uk',
            isDefault: false,
          },
        ])

        expect(result.current.connections[0]).toEqual(
          expect.objectContaining({ name: 'gocardless_uk', provider: null }),
        )
      })
    })
  })
})
