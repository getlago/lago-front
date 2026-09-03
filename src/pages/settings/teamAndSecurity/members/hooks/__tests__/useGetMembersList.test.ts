import { act, renderHook, waitFor } from '@testing-library/react'

import { GetMembersDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  ADMIN_ROLE_ID,
  buildMembershipsResult,
  createMockMembership,
} from '../../__tests__/membershipMocks'
import { useGetMembersList } from '../useGetMembersList'

const DEFAULT_VARIABLES = { limit: 20, page: 1, roleIds: undefined }

const membersListMock = {
  request: {
    query: GetMembersDocument,
    variables: DEFAULT_VARIABLES,
  },
  result: buildMembershipsResult(),
}

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })
}

const renderAndFetch = async (mocks: TestMocksType, props = {}) => {
  const { result } = renderHook(() => useGetMembersList(props), {
    wrapper: createWrapper(mocks),
  })

  await act(async () => {
    result.current.getMembers()
  })

  return result
}

describe('useGetMembersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the query has not been executed yet', () => {
    describe('WHEN the hook is rendered', () => {
      it('THEN should not expose any member', () => {
        const { result } = renderHook(() => useGetMembersList(), {
          wrapper: createWrapper([membersListMock]),
        })

        expect(result.current.members).toEqual([])
        expect(result.current.metadata).toBeUndefined()
      })
    })
  })

  describe('GIVEN the query is executed without filters', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should expose the returned members', async () => {
        const result = await renderAndFetch([membersListMock])

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        expect(result.current.members).toHaveLength(2)
        expect(result.current.members[0]?.user.email).toBe('admin@example.com')
        expect(result.current.members[1]?.user.email).toBe('finance@example.com')
      })

      it('THEN should expose the metadata with the org-wide admin count', async () => {
        const result = await renderAndFetch([membersListMock])

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        expect(result.current.metadata).toEqual({
          __typename: 'MembershipsCollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          adminCount: 1,
        })
      })

      it('THEN should expose the refetch and fetchMore helpers', async () => {
        const result = await renderAndFetch([membersListMock])

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        expect(typeof result.current.membersRefetch).toBe('function')
        expect(typeof result.current.membersFetchMore).toBe('function')
      })
    })
  })

  describe('GIVEN the query is executed with a search term', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should send the search term to the API and return the matching members', async () => {
        const searchMock = {
          request: {
            query: GetMembersDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'admin' },
          },
          result: buildMembershipsResult({
            collection: [createMockMembership('member-1', 'admin@example.com', ['Admin'])],
          }),
        }

        const { result } = renderHook(() => useGetMembersList(), {
          wrapper: createWrapper([searchMock]),
        })

        await act(async () => {
          result.current.getMembers({ variables: { searchTerm: 'admin' } })
        })

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        // The mock only matches when `searchTerm` reached the query, so getting data back is the assertion
        expect(result.current.members).toHaveLength(1)
        expect(result.current.members[0]?.user.email).toBe('admin@example.com')
      })
    })
  })

  describe('GIVEN the query is executed with role ids', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should send the role ids to the API and return the matching members', async () => {
        const roleFilterMock = {
          request: {
            query: GetMembersDocument,
            variables: { limit: 20, page: 1, roleIds: [ADMIN_ROLE_ID] },
          },
          result: buildMembershipsResult({
            collection: [createMockMembership('member-1', 'admin@example.com', ['Admin'])],
          }),
        }

        const result = await renderAndFetch([roleFilterMock], { roleIds: [ADMIN_ROLE_ID] })

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        expect(result.current.members).toHaveLength(1)
        expect(result.current.members[0]?.user.email).toBe('admin@example.com')
      })
    })
  })

  describe('GIVEN the API returns no member', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should expose an empty collection', async () => {
        const emptyMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildMembershipsResult({ collection: [], adminCount: 0 }),
        }

        const result = await renderAndFetch([emptyMock])

        await waitFor(() => {
          expect(result.current.membersLoading).toBe(false)
        })

        expect(result.current.members).toEqual([])
      })
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should expose the error', async () => {
        const errorMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          error: new Error('Failed to fetch members'),
        }

        const result = await renderAndFetch([errorMock])

        await waitFor(() => {
          expect(result.current.membersError).toBeDefined()
        })
      })
    })
  })
})
