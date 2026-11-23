import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import {
  FetchQuickbooksCustomerItemsDocument,
  GetQuickbooksCustomerItemsCountDocument,
  GetQuickbooksCustomerItemsDocument,
  IntegrationItemTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  QUICKBOOKS_CUSTOMER_ITEMS_LIMIT,
  toQuickbooksCustomerOption,
  useQuickbooksCustomerItems,
} from '../useQuickbooksCustomerItems'

const mockHasPermissions = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (args: unknown) => mockAddToast(args),
}))

const INTEGRATION_ID = 'qbo-integration-1'

const grantPermissions = (granted: string[]) =>
  mockHasPermissions.mockImplementation((permissions: string[]) =>
    permissions.every((permission) => granted.includes(permission)),
  )

const buildItem = (externalId: string, externalName: string | null) => ({
  __typename: 'IntegrationItem' as const,
  id: `item-${externalId}`,
  externalId,
  externalName,
})

const buildCountMock = (totalCount: number) => ({
  request: {
    query: GetQuickbooksCustomerItemsCountDocument,
    variables: { integrationId: INTEGRATION_ID, itemType: IntegrationItemTypeEnum.Customer },
  },
  result: {
    data: {
      integrationItems: {
        __typename: 'IntegrationItemCollection',
        metadata: { __typename: 'CollectionMetadata', totalCount },
      },
    },
  },
})

const buildItemsMock = (
  searchTerm: string | undefined,
  collection = [buildItem('58', 'Acme')],
) => ({
  request: {
    query: GetQuickbooksCustomerItemsDocument,
    variables: {
      searchTerm,
      integrationId: INTEGRATION_ID,
      itemType: IntegrationItemTypeEnum.Customer,
      limit: QUICKBOOKS_CUSTOMER_ITEMS_LIMIT,
    },
  },
  result: {
    data: { integrationItems: { __typename: 'IntegrationItemCollection', collection } },
  },
})

const buildFetchMock = (onCall: jest.Mock, { failed = false } = {}) => ({
  request: {
    query: FetchQuickbooksCustomerItemsDocument,
    variables: { input: { integrationId: INTEGRATION_ID } },
  },
  result: () => {
    onCall()

    if (failed) {
      return {
        errors: [{ message: 'Unprocessable Entity', extensions: { code: 'unprocessable_entity' } }],
      }
    }

    return {
      data: {
        fetchIntegrationCustomers: { __typename: 'IntegrationItemCollection', collection: [] },
      },
    }
  },
})

const createWrapper =
  (mocks: TestMocksType) =>
  ({ children }: { children: ReactNode }) =>
    AllTheProviders({ children, mocks, forceTypenames: true })

describe('toQuickbooksCustomerOption', () => {
  describe('GIVEN a stored customer', () => {
    it('THEN should label it with its display name and id, and select its id', () => {
      expect(toQuickbooksCustomerOption(buildItem('58', 'Acme'))).toEqual({
        value: '58',
        label: 'Acme (58)',
      })
    })

    it('THEN should fall back to the id when the customer has no display name', () => {
      expect(toQuickbooksCustomerOption(buildItem('58', null))).toEqual({
        value: '58',
        label: '58',
      })
    })
  })
})

describe('useQuickbooksCustomerItems', () => {
  beforeEach(() => {
    grantPermissions(['organizationIntegrationsView', 'organizationIntegrationsUpdate'])
    mockAddToast.mockClear()
  })

  describe('GIVEN no integration', () => {
    describe('WHEN the hook renders and refreshes', () => {
      it('THEN should neither query nor sync', async () => {
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(undefined), {
          wrapper: createWrapper([buildFetchMock(onFetch)]),
        })

        act(() => {
          result.current.refreshOnce()
          result.current.refresh()
        })

        expect(result.current.hasStoredCustomers).toBe(false)
        expect(result.current.isLoading).toBe(false)
        expect(onFetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN an integration with stored customers', () => {
    describe('WHEN the count resolves', () => {
      it('THEN should report stored customers', async () => {
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(3)]),
        })

        expect(result.current.isLoading).toBe(true)

        await waitFor(() => expect(result.current.hasStoredCustomers).toBe(true))
        expect(result.current.isLoading).toBe(false)
      })
    })

    describe('WHEN the picker searches', () => {
      it('THEN should query the customer items of the integration and map them to options', async () => {
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(3), buildItemsMock('acme')]),
        })

        act(() => {
          result.current.search?.({ variables: { searchTerm: 'acme' } })
        })

        await waitFor(() =>
          expect(result.current.options).toEqual([{ value: '58', label: 'Acme (58)' }]),
        )
      })
    })
  })

  describe('GIVEN an integration with no stored customers', () => {
    describe('WHEN the count resolves', () => {
      it('THEN should report none, so the plain id input is shown', async () => {
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(0)]),
        })

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.hasStoredCustomers).toBe(false)
      })
    })
  })

  describe('GIVEN the customers are synced', () => {
    describe('WHEN refreshOnce is called twice, as StrictMode does', () => {
      it('THEN should sync the integration once', async () => {
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([
            buildCountMock(0),
            buildFetchMock(onFetch),
            buildFetchMock(onFetch),
            buildCountMock(2),
          ]),
        })

        act(() => {
          result.current.refreshOnce()
        })
        await waitFor(() => expect(result.current.isRefreshing).toBe(false))
        act(() => {
          result.current.refreshOnce()
        })

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(result.current.hasStoredCustomers).toBe(true))
        expect(onFetch).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN refresh is clicked while a sync is running', () => {
      it('THEN should not start a second sync', async () => {
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([
            buildCountMock(0),
            buildFetchMock(onFetch),
            buildFetchMock(onFetch),
            buildCountMock(0),
          ]),
        })

        act(() => {
          result.current.refresh()
          result.current.refresh()
        })

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(result.current.isRefreshing).toBe(false))
        expect(onFetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a member who can view integrations but not update them', () => {
    describe('WHEN the hook syncs', () => {
      it('THEN should not call the sync, and should not offer a refresh', async () => {
        grantPermissions(['organizationIntegrationsView'])
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(2), buildFetchMock(onFetch)]),
        })

        act(() => {
          result.current.refreshOnce()
          result.current.refresh()
        })

        await waitFor(() => expect(result.current.hasStoredCustomers).toBe(true))
        expect(result.current.canRefresh).toBe(false)
        expect(onFetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a member who cannot view integrations', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should not query the stored customers, leaving the plain id input', async () => {
        grantPermissions([])
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([]),
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.hasStoredCustomers).toBe(false)
      })
    })
  })

  describe('GIVEN the sync fails with an unprocessable entity error', () => {
    describe('WHEN it was the automatic sync', () => {
      it('THEN should stay quiet', async () => {
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(0), buildFetchMock(onFetch, { failed: true })]),
        })

        act(() => {
          result.current.refreshOnce()
        })

        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(result.current.isRefreshing).toBe(false))
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the user clicked refresh', () => {
      it('THEN should show an error toast', async () => {
        const onFetch = jest.fn()
        const { result } = renderHook(() => useQuickbooksCustomerItems(INTEGRATION_ID), {
          wrapper: createWrapper([buildCountMock(0), buildFetchMock(onFetch, { failed: true })]),
        })

        act(() => {
          result.current.refresh()
        })

        await waitFor(() =>
          expect(mockAddToast).toHaveBeenCalledWith({
            severity: 'danger',
            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
          }),
        )
      })
    })
  })
})
