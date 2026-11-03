import { gql, InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'

import {
  CreateXeroIntegrationMappingDocument,
  DeleteXeroIntegrationMappingDocument,
  MappableTypeEnum,
  MappingTypeEnum,
  UpdateXeroIntegrationMappingDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { useXeroIntegrationMappingCRUD } from '../useXeroIntegrationMappingCRUD'

const INTEGRATION_ID = 'integration-123'
const MAPPABLE_ID = 'billable-metric-456'
const MAPPING_ID = 'mapping-789'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })
}

/**
 * Wrapper that passes a custom InMemoryCache to MockedProvider so we can
 * assert against it after mutations run their `update` callbacks.
 */
const createCacheWrapper = (mocks: TestMocksType, cache: InMemoryCache) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(MockedProvider, { mocks, addTypename: true, cache }, children)
  }

  Wrapper.displayName = 'CacheWrapper'
  return Wrapper
}

const buildCreateMappingMock = () => ({
  request: {
    query: CreateXeroIntegrationMappingDocument,
    variables: {
      input: {
        integrationId: INTEGRATION_ID,
        mappableId: MAPPABLE_ID,
        mappableType: MappableTypeEnum.BillableMetric,
        externalId: 'ext-1',
        externalName: 'External Item',
        externalAccountCode: 'ACC001',
      },
    },
  },
  result: {
    data: {
      createIntegrationMapping: {
        __typename: 'Mapping',
        id: MAPPING_ID,
        externalId: 'ext-1',
        externalName: 'External Item',
        externalAccountCode: 'ACC001',
      },
    },
  },
})

const buildUpdateMappingMock = () => ({
  request: {
    query: UpdateXeroIntegrationMappingDocument,
    variables: {
      input: {
        id: MAPPING_ID,
        integrationId: INTEGRATION_ID,
        mappableType: MappableTypeEnum.BillableMetric,
        mappableId: MAPPABLE_ID,
        externalId: 'ext-2',
        externalName: 'Updated Item',
        externalAccountCode: 'ACC002',
      },
    },
  },
  result: {
    data: {
      updateIntegrationMapping: {
        __typename: 'Mapping',
        id: MAPPING_ID,
      },
    },
  },
})

const buildDeleteMappingMock = () => ({
  request: {
    query: DeleteXeroIntegrationMappingDocument,
    variables: {
      input: { id: MAPPING_ID },
    },
  },
  result: {
    data: {
      destroyIntegrationMapping: {
        __typename: 'DestroyIntegrationMappingPayload',
        id: MAPPING_ID,
      },
    },
  },
})

const SIMPLE_MAPPING_FRAGMENT = gql`
  fragment TestMappingRead on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }
`

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useXeroIntegrationMappingCRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Cache update: createMapping for paginated types
  // -------------------------------------------------------------------------
  describe('createMapping cache update (paginated)', () => {
    it('writes the new Mapping entity to the cache', async () => {
      const cache = new InMemoryCache()

      // Seed a parent BillableMetric entity with empty integrationMappings
      cache.writeFragment({
        id: cache.identify({ __typename: 'BillableMetric', id: MAPPABLE_ID }),
        fragment: gql`
          fragment SeedBM on BillableMetric {
            id
            integrationMappings {
              id
            }
          }
        `,
        data: {
          __typename: 'BillableMetric',
          id: MAPPABLE_ID,
          integrationMappings: [],
        },
      })

      const { result } = renderHook(
        () => useXeroIntegrationMappingCRUD(MappableTypeEnum.BillableMetric),
        { wrapper: createCacheWrapper([buildCreateMappingMock()], cache) },
      )

      await act(async () => {
        await result.current.createMapping({
          variables: {
            input: {
              integrationId: INTEGRATION_ID,
              mappableId: MAPPABLE_ID,
              mappableType: MappableTypeEnum.BillableMetric,
              externalId: 'ext-1',
              externalName: 'External Item',
              externalAccountCode: 'ACC001',
            },
          },
        })
      })

      // Verify the Mapping entity was written to the Apollo cache
      await waitFor(() => {
        const mappingData = cache.readFragment({
          id: cache.identify({ __typename: 'Mapping', id: MAPPING_ID }),
          fragment: SIMPLE_MAPPING_FRAGMENT,
        })

        expect(mappingData).toEqual(
          expect.objectContaining({
            id: MAPPING_ID,
            externalId: 'ext-1',
            externalName: 'External Item',
          }),
        )
      })
    })
  })

  // -------------------------------------------------------------------------
  // Cache update: updateMapping for paginated types
  // -------------------------------------------------------------------------
  describe('updateMapping cache update (paginated)', () => {
    it('updates the mapping entity fields directly in cache', async () => {
      const cache = new InMemoryCache()

      // Seed the cache with the existing Mapping entity
      cache.writeFragment({
        id: cache.identify({ __typename: 'Mapping', id: MAPPING_ID }),
        fragment: SIMPLE_MAPPING_FRAGMENT,
        data: {
          __typename: 'Mapping',
          id: MAPPING_ID,
          externalId: 'ext-1',
          externalName: 'Old Name',
          externalAccountCode: 'OLD001',
        },
      })

      const { result } = renderHook(
        () => useXeroIntegrationMappingCRUD(MappableTypeEnum.BillableMetric),
        { wrapper: createCacheWrapper([buildUpdateMappingMock()], cache) },
      )

      await act(async () => {
        await result.current.updateMapping({
          variables: {
            input: {
              id: MAPPING_ID,
              integrationId: INTEGRATION_ID,
              mappableType: MappableTypeEnum.BillableMetric,
              mappableId: MAPPABLE_ID,
              externalId: 'ext-2',
              externalName: 'Updated Item',
              externalAccountCode: 'ACC002',
            },
          },
        })
      })

      await waitFor(() => {
        const updated = cache.readFragment({
          id: cache.identify({ __typename: 'Mapping', id: MAPPING_ID }),
          fragment: SIMPLE_MAPPING_FRAGMENT,
        })

        expect(updated).toEqual(
          expect.objectContaining({
            externalId: 'ext-2',
            externalName: 'Updated Item',
            externalAccountCode: 'ACC002',
          }),
        )
      })
    })
  })

  // -------------------------------------------------------------------------
  // Cache update: deleteMapping for paginated types
  // -------------------------------------------------------------------------
  describe('deleteMapping cache update (paginated)', () => {
    it('evicts the mapping entity from cache', async () => {
      const cache = new InMemoryCache()

      // Seed the Mapping entity with mappableId (needed for parent lookup)
      cache.writeFragment({
        id: cache.identify({ __typename: 'Mapping', id: MAPPING_ID }),
        fragment: gql`
          fragment SeedDeleteMapping on Mapping {
            id
            mappableId
            externalId
          }
        `,
        data: {
          __typename: 'Mapping',
          id: MAPPING_ID,
          mappableId: MAPPABLE_ID,
          externalId: 'ext-1',
        },
      })

      const { result } = renderHook(
        () => useXeroIntegrationMappingCRUD(MappableTypeEnum.BillableMetric),
        { wrapper: createCacheWrapper([buildDeleteMappingMock()], cache) },
      )

      await act(async () => {
        await result.current.deleteMapping({
          variables: { input: { id: MAPPING_ID } },
        })
      })

      await waitFor(() => {
        // The Mapping entity should be evicted from cache
        const evicted = cache.readFragment({
          id: cache.identify({ __typename: 'Mapping', id: MAPPING_ID }),
          fragment: gql`
            fragment ReadEvicted on Mapping {
              id
            }
          `,
        })

        expect(evicted).toBeNull()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Non-paginated types use refetchQueries instead of cache updates
  // -------------------------------------------------------------------------
  describe('non-paginated types (MappingTypeEnum)', () => {
    it('returns mutation functions without error', () => {
      const { result } = renderHook(() => useXeroIntegrationMappingCRUD(MappingTypeEnum.Coupon), {
        wrapper: createWrapper([]),
      })

      expect(typeof result.current.createMapping).toBe('function')
      expect(typeof result.current.updateMapping).toBe('function')
      expect(typeof result.current.deleteMapping).toBe('function')
    })
  })
})
