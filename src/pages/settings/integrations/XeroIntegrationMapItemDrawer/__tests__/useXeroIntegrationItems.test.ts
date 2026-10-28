import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'

import {
  GetXeroIntegrationItemsDocument,
  MappableTypeEnum,
  MappingTypeEnum,
  TriggerXeroIntegrationAccountsRefetchDocument,
  TriggerXeroIntegrationItemsRefetchDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { stringifyOptionValue } from '../stringifyOptionValue'
import { useXeroIntegrationItems, useXeroIntegrationItemSearch } from '../useXeroIntegrationItems'

const INTEGRATION_ID = 'integration-123'

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })
}

const buildItem = (id: string, name: string, code: string) => ({
  __typename: 'IntegrationItem',
  id,
  externalId: `ext-${id}`,
  externalName: name,
  externalAccountCode: code,
  itemType: 'standard',
})

const buildGetItemsMock = (
  variables: Record<string, unknown> = {},
  collection: Array<Record<string, unknown>> = [buildItem('1', 'External Item', 'ACC001')],
) => ({
  request: {
    query: GetXeroIntegrationItemsDocument,
    variables: {
      limit: 1000,
      integrationId: INTEGRATION_ID,
      itemType: 'standard',
      ...variables,
    },
  },
  result: {
    data: {
      integrationItems: {
        __typename: 'IntegrationItemCollection',
        collection,
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: collection.length,
        },
      },
    },
  },
})

const buildItemsRefetchMock = () => ({
  request: {
    query: TriggerXeroIntegrationItemsRefetchDocument,
    variables: { input: { integrationId: INTEGRATION_ID } },
  },
  result: {
    data: { fetchIntegrationItems: { __typename: 'IntegrationItems', collection: [] } },
  },
})

const buildAccountsRefetchMock = () => ({
  request: {
    query: TriggerXeroIntegrationAccountsRefetchDocument,
    variables: { input: { integrationId: INTEGRATION_ID } },
  },
  result: {
    data: { fetchIntegrationAccounts: { __typename: 'IntegrationItems', collection: [] } },
  },
})

describe('useXeroIntegrationItems', () => {
  describe('GIVEN no integrationId', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should not query', () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, undefined),
          { wrapper: createWrapper([]) },
        )

        expect(result.current.items).toEqual([])
      })

      it('THEN should expose no search', () => {
        const { result } = renderHook(
          () => useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, undefined),
          { wrapper: createWrapper([]) },
        )

        expect(result.current.search).toBeUndefined()
        expect(result.current.searchResults).toEqual([])
      })
    })
  })

  describe('GIVEN an integrationId', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN should load the unfiltered list on its own', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock()]) },
        )

        await waitFor(() => {
          expect(result.current.items).toEqual([
            {
              label: 'External Item (ACC001)',
              description: 'ext-1',
              value: stringifyOptionValue({
                externalId: 'ext-1',
                externalName: 'External Item',
                externalAccountCode: 'ACC001',
              }),
            },
          ])
        })
      })

      it('THEN should request the account item type in an account context', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappingTypeEnum.Account, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock({ itemType: 'account' })]) },
        )

        await waitFor(() => {
          expect(result.current.items).toHaveLength(1)
        })
      })
    })

    describe('WHEN a search runs', () => {
      it('THEN should expose the results and flag the field as searching', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          {
            wrapper: createWrapper([
              buildGetItemsMock({ searchTerm: 'another' }, [
                buildItem('2', 'Another Item', 'ACC002'),
              ]),
            ]),
          },
        )

        expect(result.current.isSearching).toBe(false)

        await act(async () => {
          await result.current.search?.({ variables: { searchTerm: 'another' } })
        })

        await waitFor(() => expect(result.current.searchResults).toHaveLength(1))
        expect(result.current.isSearching).toBe(true)
      })

      it('THEN should stop flagging the field once the term is cleared', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          {
            wrapper: createWrapper([
              buildGetItemsMock({ searchTerm: 'another' }, [
                buildItem('2', 'Another Item', 'ACC002'),
              ]),
              buildGetItemsMock({}, [buildItem('1', 'External Item', 'ACC001')]),
            ]),
          },
        )

        await act(async () => {
          await result.current.search?.({ variables: { searchTerm: 'another' } })
        })
        await waitFor(() => expect(result.current.isSearching).toBe(true))

        await act(async () => {
          await result.current.search?.()
        })

        await waitFor(() => expect(result.current.isSearching).toBe(false))
      })
    })

    describe('WHEN refresh is called', () => {
      it('THEN should trigger the item refetch outside of an account context', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock(), buildItemsRefetchMock()]) },
        )

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        act(() => {
          result.current.refresh()
        })

        await waitFor(() => expect(result.current.isLoading).toBe(true))
        await waitFor(() => expect(result.current.isLoading).toBe(false))
      })

      it('THEN should trigger the account refetch in an account context', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappingTypeEnum.Account, INTEGRATION_ID),
          {
            wrapper: createWrapper([
              buildGetItemsMock({ itemType: 'account' }),
              buildAccountsRefetchMock(),
            ]),
          },
        )

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        act(() => {
          result.current.refresh()
        })

        await waitFor(() => expect(result.current.isLoading).toBe(true))
        await waitFor(() => expect(result.current.isLoading).toBe(false))
      })
    })
  })
})
