import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import React from 'react'

import { GetCrmIntegrationsForExternalAppsAccordionDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useCrmProviders } from '../useCrmProviders'

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
          __typename: 'HubspotIntegration',
          id: '1',
          code: 'hubspot-main',
          name: 'Hubspot CRM',
          defaultTargetedObject: 'COMPANIES',
        },
        {
          __typename: 'SalesforceIntegration',
          id: '2',
          code: 'salesforce-prod',
          name: 'Salesforce Production',
        },
        {
          __typename: 'HubspotIntegration',
          id: '3',
          code: 'hubspot-sandbox',
          name: 'Hubspot Sandbox',
          defaultTargetedObject: 'CONTACTS',
        },
      ],
    },
  }

  const mocks = [
    {
      request: {
        query: GetCrmIntegrationsForExternalAppsAccordionDocument,
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

  const { result } = renderHook(() => useCrmProviders(), {
    wrapper: customWrapper,
  })

  return { result }
}

describe('useCrmProviders', () => {
  describe('when query succeeds with data', () => {
    it('should return CRM providers data and loading state', async () => {
      const { result } = await prepare()

      // Initially loading
      expect(result.current.isLoadingCrmProviders).toBe(true)
      expect(result.current.crmProviders).toBeUndefined()

      // Wait for the query to resolve
      await act(() => wait(0))

      // After loading completes
      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders).toBeDefined()
      expect(result.current.crmProviders?.integrations?.collection).toHaveLength(3)

      const collection = result.current.crmProviders?.integrations?.collection

      expect(collection?.[0]).toEqual({
        __typename: 'HubspotIntegration',
        id: '1',
        code: 'hubspot-main',
        name: 'Hubspot CRM',
        defaultTargetedObject: 'COMPANIES',
      })
      expect(collection?.[1]).toEqual({
        __typename: 'SalesforceIntegration',
        id: '2',
        code: 'salesforce-prod',
        name: 'Salesforce Production',
      })
      expect(collection?.[2]).toEqual({
        __typename: 'HubspotIntegration',
        id: '3',
        code: 'hubspot-sandbox',
        name: 'Hubspot Sandbox',
        defaultTargetedObject: 'CONTACTS',
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

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders?.integrations?.collection).toEqual([])
    })

    it('should handle null integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: null,
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders?.integrations).toBeNull()
    })

    it('should handle only Hubspot integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'HubspotIntegration',
                id: '1',
                code: 'hubspot-only',
                name: 'Hubspot Only',
                defaultTargetedObject: 'COMPANIES',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.crmProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'HubspotIntegration',
        id: '1',
        code: 'hubspot-only',
        name: 'Hubspot Only',
        defaultTargetedObject: 'COMPANIES',
      })
    })

    it('should handle only Salesforce integrations', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'SalesforceIntegration',
                id: '1',
                code: 'salesforce-only',
                name: 'Salesforce Only',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders?.integrations?.collection).toHaveLength(1)
      expect(result.current.crmProviders?.integrations?.collection?.[0]).toEqual({
        __typename: 'SalesforceIntegration',
        id: '1',
        code: 'salesforce-only',
        name: 'Salesforce Only',
      })
    })

    it('should handle different defaultTargetedObject values for Hubspot', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'HubspotIntegration',
                id: '1',
                code: 'hubspot-companies',
                name: 'Hubspot for Companies',
                defaultTargetedObject: 'COMPANIES',
              },
              {
                __typename: 'HubspotIntegration',
                id: '2',
                code: 'hubspot-contacts',
                name: 'Hubspot for Contacts',
                defaultTargetedObject: 'CONTACTS',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const collection = result.current.crmProviders?.integrations?.collection

      expect(collection).toHaveLength(2)
      expect(collection?.[0]).toMatchObject({
        defaultTargetedObject: 'COMPANIES',
      })
      expect(collection?.[1]).toMatchObject({
        defaultTargetedObject: 'CONTACTS',
      })
    })
  })

  describe('when query fails', () => {
    it('should handle GraphQL errors', async () => {
      const { result } = await prepare({ error: true })

      expect(result.current.isLoadingCrmProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders).toBeUndefined()
    })

    it('should handle network errors', async () => {
      const { result } = await prepare({ networkError: true })

      expect(result.current.isLoadingCrmProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders).toBeUndefined()
    })
  })

  describe('query configuration', () => {
    it('should use correct variables with limit of 1000', async () => {
      const { result } = await prepare()

      expect(result.current.isLoadingCrmProviders).toBe(true)

      await act(() => wait(0))

      expect(result.current.isLoadingCrmProviders).toBe(false)
      // The mock configuration verifies that variables: { limit: 1000 } is used
    })

    it('should handle delayed responses', async () => {
      const { result } = await prepare({ delay: 100 })

      expect(result.current.isLoadingCrmProviders).toBe(true)
      expect(result.current.crmProviders).toBeUndefined()

      // Before delay completes
      await act(() => wait(50))
      expect(result.current.isLoadingCrmProviders).toBe(true)

      // After delay completes
      await act(() => wait(100))
      expect(result.current.isLoadingCrmProviders).toBe(false)
      expect(result.current.crmProviders).toBeDefined()
    })
  })

  describe('return value structure', () => {
    it('should return an object with crmProviders and isLoadingCrmProviders', async () => {
      const { result } = await prepare()

      expect(typeof result.current).toBe('object')
      expect('crmProviders' in result.current).toBe(true)
      expect('isLoadingCrmProviders' in result.current).toBe(true)
      expect(Object.keys(result.current)).toHaveLength(2)

      await act(() => wait(0))

      expect(typeof result.current.crmProviders).toBe('object')
      expect(typeof result.current.isLoadingCrmProviders).toBe('boolean')
    })
  })

  describe('integration with GraphQL fragments', () => {
    it('should properly handle HubspotIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'HubspotIntegration',
                id: 'hubspot-1',
                code: 'HUBSPOT_PROD',
                name: 'Hubspot Production Environment',
                defaultTargetedObject: 'COMPANIES',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const hubspotIntegration = result.current.crmProviders?.integrations?.collection?.[0]

      if (!hubspotIntegration || !('id' in hubspotIntegration)) {
        throw new Error('Hubspot integration not found in the result')
      }

      expect(hubspotIntegration.__typename).toBe('HubspotIntegration')
      expect(hubspotIntegration.id).toBe('hubspot-1')
      expect(hubspotIntegration.code).toBe('HUBSPOT_PROD')
      expect(hubspotIntegration.name).toBe('Hubspot Production Environment')
      expect('defaultTargetedObject' in hubspotIntegration).toBe(true)
      if ('defaultTargetedObject' in hubspotIntegration) {
        expect(hubspotIntegration.defaultTargetedObject).toBe('COMPANIES')
      }
    })

    it('should properly handle SalesforceIntegration fragment fields', async () => {
      const { result } = await prepare({
        mockData: {
          integrations: {
            collection: [
              {
                __typename: 'SalesforceIntegration',
                id: 'salesforce-1',
                code: 'SALESFORCE_MAIN',
                name: 'Salesforce Main Account',
              },
            ],
          },
        },
      })

      await act(() => wait(0))

      const salesforceIntegration = result.current.crmProviders?.integrations?.collection?.[0]

      if (!salesforceIntegration || !('id' in salesforceIntegration)) {
        throw new Error('Salesforce integration not found in the result')
      }

      expect(salesforceIntegration.__typename).toBe('SalesforceIntegration')
      expect(salesforceIntegration.id).toBe('salesforce-1')
      expect(salesforceIntegration.code).toBe('SALESFORCE_MAIN')
      expect(salesforceIntegration.name).toBe('Salesforce Main Account')
    })
  })
})
