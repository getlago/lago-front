import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { GetMembersDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  ADMIN_ROLE_ID,
  buildMembershipsResult,
  createMockMembership,
  mockMembers,
  rolesListMock,
} from './membershipMocks'

import MembersList, {
  MEMBERS_LIST_DELETE_ACTION_TEST_ID,
  MEMBERS_LIST_EDIT_ACTION_TEST_ID,
} from '../MembersList'

// Mock IntersectionObserver for jsdom
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

const mockOpenRevokeMembershipDialog = jest.fn()
const mockOpenEditMemberRoleDialog = jest.fn()

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
    currentUser: {
      id: 'current-user-1',
      email: 'current@example.com',
    },
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('../dialogs/EditMemberRoleDialog', () => ({
  useEditMemberRoleDialog: () => ({
    openEditMemberRoleDialog: mockOpenEditMemberRoleDialog,
  }),
}))

jest.mock('../dialogs/RevokeMembershipDialog', () => ({
  useRevokeMembershipDialog: () => ({
    openRevokeMembershipDialog: mockOpenRevokeMembershipDialog,
  }),
}))

jest.mock('../dialogs/CreateInviteDialog', () => ({
  useCreateInviteDialog: () => ({
    openCreateInviteDialog: jest.fn(),
  }),
}))

// The debounced search settles ~500ms after each network round trip, so give the UI room to catch up
const SEARCH_TIMEOUT = 4000

const SEARCH_PLACEHOLDER = 'text_1767713872664devzn1r2wql'
const EMPTY_STATE_TITLE = 'text_176771435162557p8hyixafi'
const ERROR_STATE_TITLE = 'text_6321a076b94bd1b32494e9ee'

const DEFAULT_VARIABLES = { limit: 20, page: 1, roleIds: undefined }

const membersListMock = {
  request: {
    query: GetMembersDocument,
    variables: DEFAULT_VARIABLES,
  },
  result: buildMembershipsResult(),
}

const adminOnlyResult = buildMembershipsResult({
  collection: [createMockMembership('member-1', 'admin@example.com', ['Admin'])],
})

async function prepare({
  mocks = [membersListMock, rolesListMock],
  url = '/',
}: { mocks?: TestMocksType; url?: string } = {}) {
  window.history.pushState({}, '', url)

  // `forceTypenames` is required: the roles list is read through a fragment, which Apollo can
  // only match when __typename is part of the document
  await act(() =>
    render(<MembersList />, {
      wrapper: ({ children }) => AllTheProviders({ children, mocks, forceTypenames: true }),
    }),
  )
}

describe('MembersList', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN the members are fetched without any filter', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should display the search input', async () => {
        await prepare()

        expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()
      })

      it('THEN should display every member returned by the API', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        expect(screen.getByText('finance@example.com')).toBeInTheDocument()
      })

      it('THEN should display a role chip per member', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        // Admin and Finance role labels
        expect(screen.getByText('text_664f035a68227f00e261b7ee')).toBeInTheDocument()
        expect(screen.getByText('text_664f035a68227f00e261b7f2')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the members query is still in flight', () => {
    describe('WHEN the response has not resolved yet', () => {
      it('THEN should not display any member', async () => {
        const loadingMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          delay: Infinity,
          result: { data: null },
        }

        await prepare({ mocks: [loadingMock, rolesListMock] })

        expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the API returns no member', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should display the empty state', async () => {
        const emptyMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildMembershipsResult({ collection: [], adminCount: 0 }),
        }

        await prepare({ mocks: [emptyMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText(EMPTY_STATE_TITLE)).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })
  })

  describe('GIVEN the members query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should display the error state and its retry button', async () => {
        const errorMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          error: new Error('Failed to fetch members'),
        }

        await prepare({ mocks: [errorMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText(ERROR_STATE_TITLE)).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        // Retry button
        expect(screen.getByText('text_6321a076b94bd1b32494e9f2')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user searches for a member', () => {
    describe('WHEN typing a search term', () => {
      it('THEN should query the API with the search term and render only its result', async () => {
        const searchMock = {
          request: {
            query: GetMembersDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'admin' },
          },
          result: adminOnlyResult,
        }

        await prepare({ mocks: [membersListMock, searchMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('finance@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
          target: { value: 'admin' },
        })

        // The mock only replies when `searchTerm` reached the API, so the narrowed list proves
        // the filtering happened server-side
        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
            expect(screen.queryByText('finance@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })

      it('THEN should not filter the loaded page client-side while the request is in flight', async () => {
        const pendingSearchMock = {
          request: {
            query: GetMembersDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'nobody' },
          },
          delay: Infinity,
          result: { data: null },
        }

        await prepare({ mocks: [membersListMock, pendingSearchMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('finance@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
          target: { value: 'nobody' },
        })

        // A term matching nothing on the loaded page must NOT empty the table on its own:
        // only the API response can change the rendered collection
        expect(screen.getByText('finance@example.com')).toBeInTheDocument()
      })
    })

    describe('WHEN clearing the search term', () => {
      it('THEN should query the API again without any search term', async () => {
        const searchMock = {
          request: {
            query: GetMembersDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'admin' },
          },
          result: adminOnlyResult,
        }
        const clearedMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildMembershipsResult(),
        }

        await prepare({
          mocks: [membersListMock, searchMock, clearedMock, rolesListMock],
        })

        const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER)

        fireEvent.change(searchInput, { target: { value: 'admin' } })

        await waitFor(
          () => {
            expect(screen.queryByText('finance@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(searchInput, { target: { value: '' } })

        await waitFor(
          () => {
            expect(screen.getByText('finance@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })
  })

  describe('GIVEN a role filter is set in the URL', () => {
    describe('WHEN the roles are resolved', () => {
      it('THEN should query the API with the matching role id', async () => {
        const roleFilteredMock = {
          request: {
            query: GetMembersDocument,
            variables: { limit: 20, page: 1, roleIds: [ADMIN_ROLE_ID] },
          },
          result: adminOnlyResult,
        }

        await prepare({
          // membersListMock stays available in case the unfiltered request goes out before the
          // roles resolve — the assertion below is on the state the list settles into
          mocks: [membersListMock, roleFilteredMock, rolesListMock],
          url: '/?roles=Admin',
        })

        // Only a request carrying roleIds: ['role-1'] returns the narrowed collection, so ending
        // up with the admin alone proves the role name was translated to its id and sent to the API
        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
            expect(screen.queryByText('finance@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })

    describe('WHEN the roles are not resolved yet', () => {
      it('THEN should not display members the filter may exclude', async () => {
        const pendingRolesMock = {
          ...rolesListMock,
          delay: Infinity,
        }
        // The response the component would get if it queried before resolving the role id
        const unfilteredMock = {
          request: {
            query: GetMembersDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildMembershipsResult(),
        }

        await prepare({ mocks: [unfilteredMock, pendingRolesMock], url: '/?roles=Admin' })

        await new Promise((resolve) => setTimeout(resolve, 1000))

        expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
        expect(screen.queryByText('finance@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the organization has a single admin', () => {
    describe('WHEN opening the delete action of that admin', () => {
      it('THEN should flag the revoke dialog as deleting the last admin', async () => {
        await prepare({
          mocks: [
            {
              request: {
                query: GetMembersDocument,
                variables: DEFAULT_VARIABLES,
              },
              result: buildMembershipsResult({ adminCount: 1 }),
            },
            rolesListMock,
          ],
        })

        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.click(screen.getAllByTestId('open-action-button')[0])
        fireEvent.click(await screen.findByTestId(MEMBERS_LIST_DELETE_ACTION_TEST_ID))

        expect(mockOpenRevokeMembershipDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'admin@example.com',
            isDeletingLastAdmin: true,
          }),
        )
      })
    })
  })

  describe('GIVEN the organization has several admins', () => {
    describe('WHEN opening the delete action of an admin missing from the current page', () => {
      it('THEN should rely on the org-wide admin count instead of the loaded page', async () => {
        await prepare({
          mocks: [
            {
              request: {
                query: GetMembersDocument,
                variables: DEFAULT_VARIABLES,
              },
              // Only one admin is on this page, but the organization has 3 of them
              result: buildMembershipsResult({ collection: mockMembers, adminCount: 3 }),
            },
            rolesListMock,
          ],
        })

        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.click(screen.getAllByTestId('open-action-button')[0])
        fireEvent.click(await screen.findByTestId(MEMBERS_LIST_DELETE_ACTION_TEST_ID))

        expect(mockOpenRevokeMembershipDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'admin@example.com',
            isDeletingLastAdmin: false,
          }),
        )
      })
    })

    describe('WHEN opening the edit action of an admin', () => {
      it('THEN should not flag the member as the last admin', async () => {
        await prepare({
          mocks: [
            {
              request: {
                query: GetMembersDocument,
                variables: DEFAULT_VARIABLES,
              },
              result: buildMembershipsResult({ adminCount: 3 }),
            },
            rolesListMock,
          ],
        })

        await waitFor(
          () => {
            expect(screen.getByText('admin@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.click(screen.getAllByTestId('open-action-button')[0])
        fireEvent.click(await screen.findByTestId(MEMBERS_LIST_EDIT_ACTION_TEST_ID))

        expect(mockOpenEditMemberRoleDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            isEditingLastAdmin: false,
          }),
        )
      })
    })
  })
})
