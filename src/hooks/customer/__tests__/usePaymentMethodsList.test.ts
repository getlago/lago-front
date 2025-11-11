import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { PaymentMethodsDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { createMockPaymentMethodsQueryResponse } from './factories/PaymentMethod.factory'

import { usePaymentMethodsList } from '../usePaymentMethodsList'

const EXTERNAL_CUSTOMER_ID = 'customer_ext_123'

const mockPaymentMethodsQueryResponse = createMockPaymentMethodsQueryResponse()

type PrepareType = {
  mock?: Record<string, unknown>
  error?: boolean
  delay?: number
}

async function prepare({ mock, error = false, delay = 0 }: PrepareType = {}) {
  const mocks = [
    {
      request: {
        query: PaymentMethodsDocument,
        variables: { externalCustomerId: EXTERNAL_CUSTOMER_ID },
      },
      result: error
        ? {
            errors: [{ message: 'Network error' }],
          }
        : {
            data: mock || mockPaymentMethodsQueryResponse,
            delay,
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
    () => usePaymentMethodsList({ externalCustomerId: EXTERNAL_CUSTOMER_ID }),
    {
      wrapper: customWrapper,
    },
  )

  return { result }
}

describe('usePaymentMethodsList', () => {
  describe('WHEN query succeeds with data', () => {
    it('THEN returns payment methods list', async () => {
      const { result } = await prepare()

      expect(result.current.loading).toBeTruthy()

      await act(() => wait(0))

      expect(result.current.loading).toBeFalsy()
      expect(result.current.error).toBeFalsy()
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data[0].id).toBe('pm_001')
      expect(result.current.data[0].isDefault).toBe(true)
      expect(result.current.data[1].id).toBe('pm_002')
      expect(result.current.data[1].isDefault).toBe(false)
      expect(result.current.refetch).toBeDefined()
    })

    it('THEN returns empty array when data is null', async () => {
      const { result } = await prepare({
        mock: {
          paymentMethods: null,
        },
      })

      expect(result.current.loading).toBeTruthy()

      await act(() => wait(0))

      expect(result.current.loading).toBeFalsy()
      expect(result.current.error).toBeFalsy()
      expect(result.current.data).toEqual([])
    })
  })

  describe('WHEN query fails', () => {
    it('THEN returns error state', async () => {
      const { result } = await prepare({ error: true })

      expect(result.current.loading).toBeTruthy()

      await act(() => wait(0))

      expect(result.current.loading).toBeFalsy()
      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toEqual([])
    })
  })
})
