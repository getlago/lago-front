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
import { useXeroIntegrationItems } from '../useXeroIntegrationItems'

const INTEGRATION_ID = 'integration-123'

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })
}

const buildGetItemsMock = (
  variables: Record<string, unknown> = {},
  collection: Array<Record<string, unknown>> = [
    {
      __typename: 'IntegrationItem',
      id: 'item-1',
      externalId: 'ext-1',
      externalName: 'External Item',
      externalAccountCode: 'ACC001',
      itemType: 'standard',
    },
  ],
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
      it('THEN should expose no searchQuery', () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, undefined),
          { wrapper: createWrapper([]) },
        )

        expect(result.current.searchQuery).toBeUndefined()
        expect(result.current.comboboxData).toEqual([])
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('GIVEN an integrationId', () => {
    describe('WHEN the search query is executed', () => {
      it('THEN should map the fetched items into combobox options', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock()]) },
        )

        await act(async () => {
          await result.current.searchQuery?.()
        })

        await waitFor(() => {
          expect(result.current.comboboxData).toEqual([
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

      it('THEN should merge the caller searchTerm with the injected variables', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock({ searchTerm: 'test' }, [])]) },
        )

        await act(async () => {
          await result.current.searchQuery?.({ variables: { searchTerm: 'test' } })
        })

        await waitFor(() => {
          expect(result.current.comboboxData).toEqual([])
        })
      })

      it('THEN should read the latest integrationId when it arrives after mount', async () => {
        const { result, rerender } = renderHook(
          ({ id }: { id: string | undefined }) =>
            useXeroIntegrationItems(MappableTypeEnum.BillableMetric, id),
          {
            initialProps: { id: undefined as string | undefined },
            wrapper: createWrapper([buildGetItemsMock()]),
          },
        )

        expect(result.current.searchQuery).toBeUndefined()

        rerender({ id: INTEGRATION_ID })

        await act(async () => {
          await result.current.searchQuery?.()
        })

        await waitFor(() => {
          expect(result.current.comboboxData).toHaveLength(1)
        })
      })
    })

    describe('WHEN the account items query is executed', () => {
      it('THEN should request the account item type', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappingTypeEnum.Account, INTEGRATION_ID),
          { wrapper: createWrapper([buildGetItemsMock({ itemType: 'account' })]) },
        )

        await act(async () => {
          await result.current.searchQuery?.()
        })

        await waitFor(() => {
          expect(result.current.comboboxData).toHaveLength(1)
        })
      })
    })

    describe('WHEN refresh is called', () => {
      it('THEN should trigger the item refetch outside of an account context', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappableTypeEnum.BillableMetric, INTEGRATION_ID),
          { wrapper: createWrapper([buildItemsRefetchMock()]) },
        )

        act(() => {
          result.current.refresh()
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true)
        })
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })

      it('THEN should trigger the account refetch in an account context', async () => {
        const { result } = renderHook(
          () => useXeroIntegrationItems(MappingTypeEnum.Account, INTEGRATION_ID),
          { wrapper: createWrapper([buildAccountsRefetchMock()]) },
        )

        act(() => {
          result.current.refresh()
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true)
        })
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })
    })
  })
})
