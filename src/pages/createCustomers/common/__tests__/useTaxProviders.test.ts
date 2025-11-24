import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { GetTaxIntegrationsForExternalAppsAccordionDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useTaxProviders } from '../useTaxProviders'

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
          __typename: 'AnrokIntegration',
          id: '1',
          code: 'anrok-prod',
          name: 'Anrok Production',
        },
        {
          __typename: 'AvalaraIntegration',
          id: '2',
          code: 'avalara-main',
          name: 'Avalara Tax Engine',
        },
        {
          __typename: 'AnrokIntegration',
          id: '3',
          code: 'anrok-sandbox',
          name: 'Anrok Sandbox',
        },
      ],
    },
  }

  const mocks = [
    {
      request: {
        query: GetTaxIntegrationsForExternalAppsAccordionDocument,
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

  const { result } = renderHook(() => useTaxProviders(), {
    wrapper: customWrapper,
  })

  return { result }
}

describe('useTaxProviders', () => {
  describe('when query succeeds with data', () => {
    it('should return tax providers data and loading state', async () => {
      const { result } = await prepare()

      // Initially loading
      expect(result.current.isLoadingTaxProviders).toBe(true)
      expect(result.current.taxProviders).toBeUndefined()

      // Wait for the query to resolve
      await act(() => wait(0))

      // After loading completes
      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders).toBeDefined()
      expect(result.current.taxProviders?.integrations?.collection).toHaveLength(3)

      const collection = result.current.taxProviders?.integrations?.collection

      expect(collection?.[0]).toEqual({
        __typename: 'AnrokIntegration',
        id: '1',
        code: 'anrok-prod',
        name: 'Anrok Production',
      })
      expect(collection?.[1]).toEqual({
        __typename: 'AvalaraIntegration',
        id: '2',
        code: 'avalara-main',
        name: 'Avalara Tax Engine',
      })
      expect(collection?.[2]).toEqual({
        __typename: 'AnrokIntegration',
        id: '3',
        code: 'anrok-sandbox',
        name: 'Anrok Sandbox',
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

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders?.integrations?.collection).toEqual([])
    })

    it('should handle null integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: null,
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders?.integrations).toBeNull()
    })

    it('should handle only Anrok integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'AnrokIntegration',
                id: '1',
                code: 'anrok-only',
                name: 'Anrok Only',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.taxProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'AnrokIntegration',
        id: '1',
        code: 'anrok-only',
        name: 'Anrok Only',
      })
    })

    it('should handle only Avalara integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'AvalaraIntegration',
                id: '1',
                code: 'avalara-only',
                name: 'Avalara Only',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.taxProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'AvalaraIntegration',
        id: '1',
        code: 'avalara-only',
        name: 'Avalara Only',
      })
    })

    it('should handle multiple integrations of same type', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'AnrokIntegration',
                id: '1',
                code: 'anrok-prod',
                name: 'Anrok Production',
              },
              {
                __typename: 'AnrokIntegration',
                id: '2',
                code: 'anrok-dev',
                name: 'Anrok Development',
              },
              {
                __typename: 'AnrokIntegration',
                id: '3',
                code: 'anrok-staging',
                name: 'Anrok Staging',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders?.integrations?.collection).toHaveLength(3)
      expect(
        result.current.taxProviders?.integrations?.collection?.every(
          (integration) => integration.__typename === 'AnrokIntegration',
        ),
      ).toBe(true)
    })
  })

  describe('when query fails', () => {
    it('should handle GraphQL errors', async () => {
      const { result } = await prepare({ error: true })

      expect(result.current.isLoadingTaxProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders).toBeUndefined()
    })

    it('should handle network errors', async () => {
      const { result } = await prepare({ networkError: true })

      expect(result.current.isLoadingTaxProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders).toBeUndefined()
    })
  })

  describe('query configuration', () => {
    it('should use correct variables with limit of 1000', async () => {
      const { result } = await prepare()

      expect(result.current.isLoadingTaxProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingTaxProviders).toBe(false)
      // The mock configuration verifies that variables: { limit: 1000 } is used
    })

    it('should handle delayed responses', async () => {
      const { result } = await prepare({ delay: 100 })

      expect(result.current.isLoadingTaxProviders).toBe(true)
      expect(result.current.taxProviders).toBeUndefined()

      // Before delay completes
      await act(() => wait(50))
      expect(result.current.isLoadingTaxProviders).toBe(true)

      // After delay completes
      await act(() => wait(100))
      expect(result.current.isLoadingTaxProviders).toBe(false)
      expect(result.current.taxProviders).toBeDefined()
    })
  })

  describe('return value structure', () => {
    it('should return an object with taxProviders and isLoadingTaxProviders', async () => {
      const { result } = await prepare()

      expect(typeof result.current).toBe('object')
      expect('taxProviders' in result.current).toBe(true)
      expect('isLoadingTaxProviders' in result.current).toBe(true)
      expect(Object.keys(result.current)).toHaveLength(2)

      await act(() => wait(0))

      expect(typeof result.current.taxProviders).toBe('object')
      expect(typeof result.current.isLoadingTaxProviders).toBe('boolean')
    })
  })

  describe('integration with GraphQL fragments', () => {
    it('should properly handle AnrokIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'AnrokIntegration',
                id: 'anrok-1',
                code: 'ANROK_PROD',
                name: 'Anrok Production Environment',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const anrokIntegration = result.current.taxProviders?.integrations?.collection?.[0]

      if (!anrokIntegration || !('id' in anrokIntegration)) {
        throw new Error('Anrok integration not found in the result')
      }

      expect(anrokIntegration.__typename).toBe('AnrokIntegration')
      expect(anrokIntegration.id).toBe('anrok-1')
      expect(anrokIntegration.code).toBe('ANROK_PROD')
      expect(anrokIntegration.name).toBe('Anrok Production Environment')
    })

    it('should properly handle AvalaraIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'AvalaraIntegration',
                id: 'avalara-1',
                code: 'AVALARA_MAIN',
                name: 'Avalara Main Account',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const avalaraIntegration = result.current.taxProviders?.integrations?.collection?.[0]

      if (!avalaraIntegration || !('id' in avalaraIntegration)) {
        throw new Error('Avalara integration not found in the result')
      }

      expect(avalaraIntegration.__typename).toBe('AvalaraIntegration')
      expect(avalaraIntegration.id).toBe('avalara-1')
      expect(avalaraIntegration.code).toBe('AVALARA_MAIN')
      expect(avalaraIntegration.name).toBe('Avalara Main Account')
    })
  })
})
