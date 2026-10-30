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

      // `search` stays defined whatever the integrationId: useDebouncedSearch memoises the first
      // one it is handed, so a field that mounted before the id arrived would never search again.
      it('THEN should still expose a search, running no query', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, undefined),
          { wrapper: createWrapper([]) },
        )

        expect(result.current.search).toBeDefined()

        await act(async () => {
          await result.current.search?.({ variables: { searchTerm: 'another' } })
        })

        expect(result.current.searchResults).toEqual([])
      })

      it('THEN should run the query once the integrationId arrives', async () => {
        const { result, rerender } = renderHook(
          ({ id }: { id: string | undefined }) =>
            useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, id),
          {
            initialProps: { id: undefined as string | undefined },
            wrapper: createWrapper([
              buildGetItemsMock({ searchTerm: 'another' }, [
                buildItem('2', 'Another Item', 'ACC002'),
              ]),
            ]),
          },
        )

        rerender({ id: INTEGRATION_ID })

        await act(async () => {
          await result.current.search?.({ variables: { searchTerm: 'another' } })
        })

        await waitFor(() => expect(result.current.searchResults).toHaveLength(1))
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
      it.each([true, false])(
        'THEN should ignore a late response after the search is cleared: %s',
        async (clearSearch) => {
          const { result } = renderHook(
            () => useXeroIntegrationItemSearch(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
            {
              wrapper: createWrapper([
                {
                  ...buildGetItemsMock({ searchTerm: 'another' }, [
                    buildItem('2', 'Another Item', 'ACC002'),
                  ]),
                  delay: 100,
                },
                ...(!clearSearch
                  ? [
                      buildGetItemsMock({ searchTerm: 'support' }, [
                        buildItem('3', 'Support', 'ACC003'),
                      ]),
                    ]
                  : []),
              ]),
            },
          )

          let pendingSearch: ReturnType<NonNullable<typeof result.current.search>> | undefined

          act(() => {
            pendingSearch = result.current.search?.({ variables: { searchTerm: 'another' } })
          })
          await act(async () => {
            await result.current.search?.({
              variables: { searchTerm: clearSearch ? undefined : 'support' },
            })
          })
          await act(async () => {
            await pendingSearch
          })

          expect(result.current.isSearching).toBe(!clearSearch)
          expect(result.current.searchResults.map(({ label }) => label)).toEqual(
            clearSearch ? [] : ['Support (ACC003)'],
          )
        },
      )

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

      // Clearing falls back to the catalog the drawer holds, so no query is run for it: the mock
      // list carries the search only, and a second request would fail the test.
      it('THEN should stop flagging the field once the term is cleared, running no query', async () => {
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
      it.each([
        [MappableTypeEnum.BillableMetric, 'standard', buildItemsRefetchMock],
        [MappingTypeEnum.Account, 'account', buildAccountsRefetchMock],
      ] as const)(
        'THEN should update an active search after refreshing %s',
        async (formType, itemType, buildRefreshMock) => {
          const oldItem = buildItem('2', 'Another Item', 'ACC002')
          const updatedItem = buildItem('2', 'Another Updated Item', 'ACC002')
          const addedItem = buildItem('3', 'Another Added Item', 'ACC003')
          const { result } = renderHook(
            () => ({
              catalog: useXeroIntegrationItems(formType, INTEGRATION_ID),
              field: useXeroIntegrationItemSearch(formType, INTEGRATION_ID),
            }),
            {
              wrapper: createWrapper([
                buildGetItemsMock({ itemType }, [oldItem]),
                buildGetItemsMock({ itemType, searchTerm: 'another' }, [oldItem]),
                buildRefreshMock(),
                buildGetItemsMock({ itemType }, [updatedItem, addedItem]),
                buildGetItemsMock({ itemType, searchTerm: 'another' }, [updatedItem, addedItem]),
              ]),
            },
          )

          await waitFor(() => expect(result.current.catalog.items).toHaveLength(1))
          await act(async () => {
            await result.current.field.search?.({ variables: { searchTerm: 'another' } })
          })
          expect(result.current.field.searchResults.map(({ label }) => label)).toEqual([
            'Another Item (ACC002)',
          ])

          act(() => result.current.catalog.refresh())

          await waitFor(() => expect(result.current.catalog.items).toHaveLength(2))
          await waitFor(() =>
            expect(result.current.field.searchResults.map(({ label }) => label)).toEqual([
              'Another Updated Item (ACC002)',
              'Another Added Item (ACC003)',
            ]),
          )
        },
      )

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
