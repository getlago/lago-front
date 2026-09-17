import { act, renderHook, waitFor } from '@testing-library/react'

import { GetInvitesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  ADMIN_ROLE_ID,
  buildInvitesResult,
  createMockInvite,
} from '../../__tests__/membershipMocks'
import { useGetMembersInvitationList } from '../useGetMembersInvitationsList'

const DEFAULT_VARIABLES = { limit: 20, page: 1, roleIds: undefined }

const invitesListMock = {
  request: {
    query: GetInvitesDocument,
    variables: DEFAULT_VARIABLES,
  },
  result: buildInvitesResult(),
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
  const { result } = renderHook(() => useGetMembersInvitationList(props), {
    wrapper: createWrapper(mocks),
  })

  await act(async () => {
    result.current.getInvites()
  })

  return result
}

describe('useGetMembersInvitationList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the query has not been executed yet', () => {
    describe('WHEN the hook is rendered', () => {
      it('THEN should not expose any invitation', () => {
        const { result } = renderHook(() => useGetMembersInvitationList(), {
          wrapper: createWrapper([invitesListMock]),
        })

        expect(result.current.invitations).toEqual([])
        expect(result.current.metadata).toBeUndefined()
      })
    })
  })

  describe('GIVEN the query is executed without filters', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should expose the returned invitations', async () => {
        const result = await renderAndFetch([invitesListMock])

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        expect(result.current.invitations).toHaveLength(2)
        expect(result.current.invitations[0]?.email).toBe('test1@example.com')
        expect(result.current.invitations[1]?.email).toBe('test2@example.com')
      })

      it('THEN should expose the metadata', async () => {
        const result = await renderAndFetch([invitesListMock])

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        expect(result.current.metadata).toEqual({
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
        })
      })

      it('THEN should expose the refetch and fetchMore helpers', async () => {
        const result = await renderAndFetch([invitesListMock])

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        expect(typeof result.current.invitesRefetch).toBe('function')
        expect(typeof result.current.invitesFetchMore).toBe('function')
      })
    })
  })

  describe('GIVEN the query is executed with a search term', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should send the search term to the API and return the matching invitations', async () => {
        const searchMock = {
          request: {
            query: GetInvitesDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'test1' },
          },
          result: buildInvitesResult({
            collection: [createMockInvite('invite-1', 'test1@example.com', ['admin'])],
          }),
        }

        const { result } = renderHook(() => useGetMembersInvitationList(), {
          wrapper: createWrapper([searchMock]),
        })

        await act(async () => {
          result.current.getInvites({ variables: { searchTerm: 'test1' } })
        })

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        // The mock only matches when `searchTerm` reached the query, so getting data back is the assertion
        expect(result.current.invitations).toHaveLength(1)
        expect(result.current.invitations[0]?.email).toBe('test1@example.com')
      })
    })
  })

  describe('GIVEN the query is executed with role ids', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should send the role ids to the API and return the matching invitations', async () => {
        const roleFilterMock = {
          request: {
            query: GetInvitesDocument,
            variables: { limit: 20, page: 1, roleIds: [ADMIN_ROLE_ID] },
          },
          result: buildInvitesResult({
            collection: [createMockInvite('invite-1', 'test1@example.com', ['admin'])],
          }),
        }

        const result = await renderAndFetch([roleFilterMock], { roleIds: [ADMIN_ROLE_ID] })

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        expect(result.current.invitations).toHaveLength(1)
        expect(result.current.invitations[0]?.email).toBe('test1@example.com')
      })
    })
  })

  describe('GIVEN the API returns no invitation', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should expose an empty collection', async () => {
        const emptyMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildInvitesResult({ collection: [] }),
        }

        const result = await renderAndFetch([emptyMock])

        await waitFor(() => {
          expect(result.current.invitesLoading).toBe(false)
        })

        expect(result.current.invitations).toEqual([])
      })
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should expose the error', async () => {
        const errorMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          error: new Error('Failed to fetch invites'),
        }

        const result = await renderAndFetch([errorMock])

        await waitFor(() => {
          expect(result.current.invitesError).toBeDefined()
        })
      })
    })
  })
})
