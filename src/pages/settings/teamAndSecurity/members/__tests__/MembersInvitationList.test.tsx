import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { GetInvitesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  ADMIN_ROLE_ID,
  buildInvitesResult,
  createMockInvite,
  rolesListMock,
} from './membershipMocks'

import MembersInvitationList from '../MembersInvitationList'

// Mock IntersectionObserver for jsdom
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
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

jest.mock('../dialogs/EditInviteRoleDialog', () => ({
  useEditInviteRoleDialog: () => ({
    openEditInviteRoleDialog: jest.fn(),
  }),
}))

jest.mock('../dialogs/RevokeInviteDialog', () => ({
  useRevokeInviteDialog: () => ({
    openRevokeInviteDialog: jest.fn(),
  }),
}))

jest.mock('../dialogs/CreateInviteDialog', () => ({
  useCreateInviteDialog: () => ({
    openCreateInviteDialog: jest.fn(),
  }),
}))

// The debounced search settles ~500ms after each network round trip, so give the UI room to catch up
const SEARCH_TIMEOUT = 4000

const SEARCH_PLACEHOLDER = 'text_1767713872664lwivpxg5xlb'
const FILTERED_EMPTY_STATE_TITLE = 'text_1767714241102zgu36uubm70'
const PRISTINE_EMPTY_STATE_TITLE = 'text_17671750294886x8eq8lizmt'
const ERROR_STATE_TITLE = 'text_6321a076b94bd1b32494e9ee'

const DEFAULT_VARIABLES = { limit: 20, page: 1, roleIds: undefined }

const invitesListMock = {
  request: {
    query: GetInvitesDocument,
    variables: DEFAULT_VARIABLES,
  },
  result: buildInvitesResult(),
}

const adminOnlyResult = buildInvitesResult({
  collection: [createMockInvite('invite-1', 'test1@example.com', ['admin'])],
})

async function prepare({
  mocks = [invitesListMock, rolesListMock],
  url = '/',
}: { mocks?: TestMocksType; url?: string } = {}) {
  window.history.pushState({}, '', url)

  // `forceTypenames` is required: the roles list is read through a fragment, which Apollo can
  // only match when __typename is part of the document
  await act(() =>
    render(<MembersInvitationList />, {
      wrapper: ({ children }) => AllTheProviders({ children, mocks, forceTypenames: true }),
    }),
  )
}

describe('MembersInvitationList', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN the invitations are fetched without any filter', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should display the search input', async () => {
        await prepare()

        expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()
      })

      it('THEN should display every invitation returned by the API', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        expect(screen.getByText('test2@example.com')).toBeInTheDocument()
      })

      it('THEN should display a role chip per invitation', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        // Admin and Finance role labels, resolved from the invite role codes
        expect(screen.getByText('text_664f035a68227f00e261b7ee')).toBeInTheDocument()
        expect(screen.getByText('text_664f035a68227f00e261b7f2')).toBeInTheDocument()
      })

      it('THEN should display the email and role column headers', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('text_63208b630aaf8df6bbfb2655')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        expect(screen.getByText('text_664f035a68227f00e261b7ec')).toBeInTheDocument()
      })

      it('THEN should display an action menu per invitation', async () => {
        await prepare()

        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        expect(screen.getAllByTestId('open-action-button')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN the invitations query is still in flight', () => {
    describe('WHEN the response has not resolved yet', () => {
      it('THEN should not display any invitation', async () => {
        const loadingMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          delay: Infinity,
          result: { data: null },
        }

        await prepare({ mocks: [loadingMock, rolesListMock] })

        expect(screen.queryByText('test1@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the API returns no invitation and no filter is applied', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should display the pristine empty state', async () => {
        const emptyMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildInvitesResult({ collection: [] }),
        }

        await prepare({ mocks: [emptyMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText(PRISTINE_EMPTY_STATE_TITLE)).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        // Invite button
        expect(screen.getByText('text_63208b630aaf8df6bbfb265b')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the invitations query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should display the error state and its retry button', async () => {
        const errorMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          error: new Error('Failed to fetch invites'),
        }

        await prepare({ mocks: [errorMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText(ERROR_STATE_TITLE)).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        expect(screen.getByText('text_6321a076b94bd1b32494e9f2')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user searches for an invitation', () => {
    describe('WHEN typing a search term', () => {
      it('THEN should query the API with the search term and render only its result', async () => {
        const searchMock = {
          request: {
            query: GetInvitesDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'test1' },
          },
          result: adminOnlyResult,
        }

        await prepare({ mocks: [invitesListMock, searchMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('test2@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
          target: { value: 'test1' },
        })

        // The mock only replies when `searchTerm` reached the API, so the narrowed list proves
        // the filtering happened server-side
        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
            expect(screen.queryByText('test2@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })

      it('THEN should not filter the loaded page client-side while the request is in flight', async () => {
        const pendingSearchMock = {
          request: {
            query: GetInvitesDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'nobody' },
          },
          delay: Infinity,
          result: { data: null },
        }

        await prepare({ mocks: [invitesListMock, pendingSearchMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('test2@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
          target: { value: 'nobody' },
        })

        // A term matching nothing on the loaded page must NOT empty the table on its own:
        // only the API response can change the rendered collection
        expect(screen.getByText('test2@example.com')).toBeInTheDocument()
      })

      it('THEN should display the filtered empty state when the API returns nothing', async () => {
        const emptySearchMock = {
          request: {
            query: GetInvitesDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'nobody' },
          },
          result: buildInvitesResult({ collection: [] }),
        }

        await prepare({ mocks: [invitesListMock, emptySearchMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
          target: { value: 'nobody' },
        })

        await waitFor(
          () => {
            expect(screen.getByText(FILTERED_EMPTY_STATE_TITLE)).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })

    describe('WHEN clearing the search term', () => {
      it('THEN should query the API again without any search term', async () => {
        const searchMock = {
          request: {
            query: GetInvitesDocument,
            variables: { ...DEFAULT_VARIABLES, searchTerm: 'test1' },
          },
          result: adminOnlyResult,
        }
        const clearedMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildInvitesResult(),
        }

        await prepare({ mocks: [invitesListMock, searchMock, clearedMock, rolesListMock] })

        const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER)

        fireEvent.change(searchInput, { target: { value: 'test1' } })

        await waitFor(
          () => {
            expect(screen.queryByText('test2@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )

        fireEvent.change(searchInput, { target: { value: '' } })

        await waitFor(
          () => {
            expect(screen.getByText('test2@example.com')).toBeInTheDocument()
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
            query: GetInvitesDocument,
            variables: { limit: 20, page: 1, roleIds: [ADMIN_ROLE_ID] },
          },
          result: adminOnlyResult,
        }

        await prepare({
          // invitesListMock stays available in case the unfiltered request goes out before the
          // roles resolve — the assertion below is on the state the list settles into
          mocks: [invitesListMock, roleFilteredMock, rolesListMock],
          url: '/?roles=Admin',
        })

        // Invites store role codes while the URL holds a role name: only a request carrying
        // roleIds: ['role-1'] returns the narrowed collection, which the previous client-side
        // filter could never produce (it compared a name against a code and always matched none)
        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
            expect(screen.queryByText('test2@example.com')).not.toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })

    describe('WHEN the roles are not resolved yet', () => {
      it('THEN should not display invitations the filter may exclude', async () => {
        const pendingRolesMock = {
          ...rolesListMock,
          delay: Infinity,
        }
        // The response the component would get if it queried before resolving the role id
        const unfilteredMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildInvitesResult(),
        }

        await prepare({ mocks: [unfilteredMock, pendingRolesMock], url: '/?roles=Admin' })

        await new Promise((resolve) => setTimeout(resolve, 1000))

        expect(screen.queryByText('test1@example.com')).not.toBeInTheDocument()
        expect(screen.queryByText('test2@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the API reports several pages', () => {
    describe('WHEN the response resolves', () => {
      it('THEN should render the returned page', async () => {
        const paginatedMock = {
          request: {
            query: GetInvitesDocument,
            variables: DEFAULT_VARIABLES,
          },
          result: buildInvitesResult({ totalCount: 50, totalPages: 3 }),
        }

        await prepare({ mocks: [paginatedMock, rolesListMock] })

        await waitFor(
          () => {
            expect(screen.getByText('test1@example.com')).toBeInTheDocument()
          },
          { timeout: SEARCH_TIMEOUT },
        )
      })
    })
  })
})
