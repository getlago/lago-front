import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { GetAccountingIntegrationsForExternalAppsAccordionDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useAccountingProviders } from '../useAccountingProviders'

type PrepareType = {
  mockData?: Record<string, unknown>
  error?: boolean
  delay?: number
  networkError?: boolean
}

async function prepare({
  mockData,
  error = false,
  delay = 0,
  networkError = false,
}: PrepareType = {}) {
  const defaultMockData = {
    integrations: {
      collection: [
        {
          __typename: 'NetsuiteIntegration',
          id: '1',
          code: 'netsuite-prod',
          name: 'Netsuite Production',
        },
        {
          __typename: 'XeroIntegration',
          id: '2',
          code: 'xero-main',
          name: 'Xero Integration',
        },
        {
          __typename: 'NetsuiteIntegration',
          id: '3',
          code: 'netsuite-sandbox',
          name: 'Netsuite Sandbox',
        },
      ],
    },
  }

  const mocks = [
    {
      request: {
        query: GetAccountingIntegrationsForExternalAppsAccordionDocument,
        variables: { limit: 1000 },
      },
      result: error
        ? {
            errors: [{ message: 'GraphQL error occurred' }],
          }
        : {
            data: mockData || defaultMockData,
          },
      delay,
      ...(networkError && { error: new Error('Network error') }),
    },
  ]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })

  const { result } = renderHook(() => useAccountingProviders(), {
    wrapper: customWrapper,
  })

  return { result }
}

describe('useAccountingProviders', () => {
  describe('when query succeeds with data', () => {
    it('should return accounting providers data and loading state', async () => {
      const { result } = await prepare()

      // Initially loading
      expect(result.current.isLoadingAccountProviders).toBe(true)
      expect(result.current.accountingProviders).toBeUndefined()

      // Wait for the query to resolve
      await act(() => wait(0))

      // After loading completes
      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders).toBeDefined()
      expect(result.current.accountingProviders?.integrations?.collection).toHaveLength(3)

      const collection = result.current.accountingProviders?.integrations?.collection

      expect(collection?.[0]).toEqual({
        __typename: 'NetsuiteIntegration',
        id: '1',
        code: 'netsuite-prod',
        name: 'Netsuite Production',
      })
      expect(collection?.[1]).toEqual({
        __typename: 'XeroIntegration',
        id: '2',
        code: 'xero-main',
        name: 'Xero Integration',
      })
      expect(collection?.[2]).toEqual({
        __typename: 'NetsuiteIntegration',
        id: '3',
        code: 'netsuite-sandbox',
        name: 'Netsuite Sandbox',
      })
    })

    it('should handle empty integrations collection', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders?.integrations?.collection).toEqual([])
    })

    it('should handle null integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: null,
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders?.integrations).toBeNull()
    })

    it('should handle only Netsuite integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'NetsuiteIntegration',
                id: '1',
                code: 'netsuite-only',
                name: 'Netsuite Only',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.accountingProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'NetsuiteIntegration',
        id: '1',
        code: 'netsuite-only',
        name: 'Netsuite Only',
      })
    })

    it('should handle only Xero integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'XeroIntegration',
                id: '1',
                code: 'xero-only',
                name: 'Xero Only',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.accountingProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'XeroIntegration',
        id: '1',
        code: 'xero-only',
        name: 'Xero Only',
      })
    })

    it('should handle large number of integrations with correct limit', async () => {
      const manyIntegrations = Array.from({ length: 50 }, (_, index) => ({
        __typename: index % 2 === 0 ? 'NetsuiteIntegration' : 'XeroIntegration',
        id: `${index + 1}`,
        code: `integration-${index + 1}`,
        name: `Integration ${index + 1}`,
      }))

      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: manyIntegrations,
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders?.integrations?.collection).toHaveLength(50)
    })
  })

  describe('when query fails', () => {
    it('should handle GraphQL errors', async () => {
      const { result } = await prepare({ error: true })

      expect(result.current.isLoadingAccountProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders).toBeUndefined()
    })

    it('should handle network errors', async () => {
      const { result } = await prepare({ networkError: true })

      expect(result.current.isLoadingAccountProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders).toBeUndefined()
    })
  })

  describe('query configuration', () => {
    it('should use correct variables with limit of 1000', async () => {
      const { result } = await prepare()

      expect(result.current.isLoadingAccountProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingAccountProviders).toBe(false)
      // The mock configuration verifies that variables: { limit: 1000 } is used
    })

    it('should handle delayed responses', async () => {
      const { result } = await prepare({ delay: 100 })

      expect(result.current.isLoadingAccountProviders).toBe(true)
      expect(result.current.accountingProviders).toBeUndefined()

      // Before delay completes
      await act(() => wait(50))
      expect(result.current.isLoadingAccountProviders).toBe(true)

      // After delay completes
      await act(() => wait(100))
      expect(result.current.isLoadingAccountProviders).toBe(false)
      expect(result.current.accountingProviders).toBeDefined()
    })
  })

  describe('return value structure', () => {
    it('should return an object with accountingProviders and isLoadingAccountProviders', async () => {
      const { result } = await prepare()

      expect(typeof result.current).toBe('object')
      expect('accountingProviders' in result.current).toBe(true)
      expect('isLoadingAccountProviders' in result.current).toBe(true)
      expect(Object.keys(result.current)).toHaveLength(2)

      await act(() => wait(0))

      expect(typeof result.current.accountingProviders).toBe('object')
      expect(typeof result.current.isLoadingAccountProviders).toBe('boolean')
    })
  })

  describe('integration with GraphQL fragments', () => {
    it('should properly handle NetsuiteIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'NetsuiteIntegration',
                id: 'netsuite-1',
                code: 'NETSUITE_PROD',
                name: 'Netsuite Production Environment',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const netsuiteIntegration = result.current.accountingProviders?.integrations?.collection?.[0]

      if (!netsuiteIntegration || !('id' in netsuiteIntegration)) {
        throw new Error('Netsuite integration not found in the result')
      }

      expect(netsuiteIntegration.__typename).toBe('NetsuiteIntegration')
      expect(netsuiteIntegration.id).toBe('netsuite-1')
      expect(netsuiteIntegration.code).toBe('NETSUITE_PROD')
      expect(netsuiteIntegration.name).toBe('Netsuite Production Environment')
    })

    it('should properly handle XeroIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'XeroIntegration',
                id: 'xero-1',
                code: 'XERO_MAIN',
                name: 'Xero Main Account',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const xeroIntegration = result.current.accountingProviders?.integrations?.collection?.[0]

      if (!xeroIntegration || !('id' in xeroIntegration)) {
        throw new Error('Netsuite integration not found in the result')
      }

      expect(xeroIntegration?.__typename).toBe('XeroIntegration')
      expect(xeroIntegration?.id).toBe('xero-1')
      expect(xeroIntegration?.code).toBe('XERO_MAIN')
      expect(xeroIntegration?.name).toBe('Xero Main Account')
    })
  })
})
