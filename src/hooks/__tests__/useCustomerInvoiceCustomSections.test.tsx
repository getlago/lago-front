import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  DefaultContext,
  InMemoryCache,
  Observable,
} from '@apollo/client'
import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { GetCustomerInvoiceCustomSectionsDocument, LagoApiError } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useCustomerInvoiceCustomSections } from '../useCustomerInvoiceCustomSections'

const CUSTOMER_ID = 'customer-123'

const mockCustomerResponse = {
  customer: {
    __typename: 'Customer',
    id: CUSTOMER_ID,
    externalId: 'ext-customer-123',
    hasOverwrittenInvoiceCustomSectionsSelection: true,
    skipInvoiceCustomSections: false,
    configurableInvoiceCustomSections: [
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-1',
        name: 'Section 1',
      },
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-2',
        name: 'Section 2',
      },
    ],
  },
}

type PrepareType = {
  customerId?: string
  mock?: Record<string, unknown>
  error?: boolean
  delay?: number
  skipQuery?: boolean
}

async function prepare({
  customerId,
  mock,
  error = false,
  delay = 0,
  skipQuery = false,
}: PrepareType = {}) {
  const actualCustomerId = customerId ?? CUSTOMER_ID
  const mocks = skipQuery
    ? []
    : [
        {
          request: {
            query: GetCustomerInvoiceCustomSectionsDocument,
            variables: { customerId: actualCustomerId },
          },
          result: error
            ? {
                errors: [{ message: 'Network error' }],
              }
            : {
                data: mock || mockCustomerResponse,
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

  const hookCustomerId = skipQuery ? undefined : actualCustomerId
  const { result } = renderHook(() => useCustomerInvoiceCustomSections(hookCustomerId), {
    wrapper: customWrapper,
  })

  return { result }
}

describe('useCustomerInvoiceCustomSections', () => {
  describe('WHEN query succeeds with complete data', () => {
    it('THEN returns correctly transformed customer invoice custom sections data', async () => {
      const { result } = await prepare()

      await act(() => wait(0))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
      expect(result.current.data).toEqual({
        configurableInvoiceCustomSections: [
          { id: 'section-1', name: 'Section 1' },
          { id: 'section-2', name: 'Section 2' },
        ],
        hasOverwrittenInvoiceCustomSectionsSelection: true,
        skipInvoiceCustomSections: false,
      })
      expect(result.current.customer).toEqual(mockCustomerResponse.customer)
    })
  })

  describe('WHEN customerId is undefined', () => {
    it('THEN skips the query and returns null data', async () => {
      const { result } = await prepare({ skipQuery: true })

      await act(() => wait(0))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(false)
      expect(result.current.data).toBe(null)
      expect(result.current.customer).toBe(null)
    })
  })

  describe('WHEN query fails', () => {
    it('THEN returns error state and null data', async () => {
      const { result } = await prepare({ error: true })

      await act(() => wait(0))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.customer).toBe(null)
    })
  })

  describe('GIVEN the customer was soft-deleted', () => {
    // The root `customer(id:)` resolver has no `withDeleted` argument, so it
    // answers a legitimate 404 while the subscription page around it renders
    // fine. Without the silencing context the global error link turns that 404
    // into a red toast and a Sentry event (LAGO-1844).
    describe('WHEN the query is issued', () => {
      it('THEN declares not_found as an expected error code', async () => {
        let capturedContext: DefaultContext | undefined

        const client = new ApolloClient({
          cache: new InMemoryCache(),
          link: new ApolloLink((operation) => {
            capturedContext = operation.getContext()

            return new Observable((observer) => {
              observer.next({
                errors: [
                  {
                    message: 'Resource not found',
                    extensions: { status: 404, code: LagoApiError.NotFound },
                  },
                ],
              })
              observer.complete()
            })
          }),
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ApolloProvider client={client}>{children}</ApolloProvider>
        )

        renderHook(() => useCustomerInvoiceCustomSections(CUSTOMER_ID), { wrapper })

        await act(() => wait(0))

        expect(capturedContext?.silentErrorCodes).toEqual([LagoApiError.NotFound])
        // Nothing is silenced beyond that one code: a genuine failure on this
        // query must still reach Sentry and the user.
        expect(capturedContext?.silentError).toBeUndefined()
      })
    })
  })
})
