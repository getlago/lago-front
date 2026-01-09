import { act, cleanup, screen, waitFor } from '@testing-library/react'

import { GetInvitesDocument, GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

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

jest.mock('~/hooks/useRolesList', () => ({
  useRolesList: () => ({
    roles: [
      {
        id: 'role-1',
        name: 'Admin',
        code: 'admin',
        description: 'Administrator role',
        admin: true,
        memberships: [],
        permissions: [],
      },
      {
        id: 'role-2',
        name: 'Finance',
        code: 'finance',
        description: 'Finance role',
        admin: false,
        memberships: [],
        permissions: [],
      },
    ],
    isLoadingRoles: false,
  }),
}))

// Mock dialog components to avoid complexity
jest.mock('../dialogs/EditInviteRoleDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditInviteRoleDialog'
  return { EditInviteRoleDialog: MockDialog }
})

jest.mock('../dialogs/RevokeInviteDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'RevokeInviteDialog'
  return { RevokeInviteDialog: MockDialog }
})

jest.mock('../dialogs/CreateInviteDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'CreateInviteDialog'
  return { CreateInviteDialog: MockDialog }
})

const mockInvitations = [
  {
    __typename: 'Invite',
    id: 'invite-1',
    email: 'test1@example.com',
    token: 'token-1',
    roles: ['admin'],
    organization: {
      __typename: 'Organization',
      id: 'org-1',
      name: 'Test Organization',
    },
  },
  {
    __typename: 'Invite',
    id: 'invite-2',
    email: 'test2@example.com',
    token: 'token-2',
    roles: ['finance'],
    organization: {
      __typename: 'Organization',
      id: 'org-1',
      name: 'Test Organization',
    },
  },
]

const invitesListMock = {
  request: {
    query: GetInvitesDocument,
    variables: { limit: 20 },
  },
  result: {
    data: {
      invites: {
        __typename: 'InviteCollection',
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
        },
        collection: mockInvitations,
      },
    },
  },
}

const rolesListMock = {
  request: {
    query: GetRolesListDocument,
  },
  result: {
    data: {
      roles: [
        {
          __typename: 'Role',
          id: 'role-1',
          name: 'Admin',
          code: 'admin',
          description: 'Administrator role',
          permissions: [],
          admin: true,
          memberships: [],
        },
        {
          __typename: 'Role',
          id: 'role-2',
          name: 'Finance',
          code: 'finance',
          description: 'Finance role',
          permissions: [],
          admin: false,
          memberships: [],
        },
      ],
    },
  },
}

async function prepare({
  mocks = [invitesListMock, rolesListMock],
}: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(<MembersInvitationList />, {
      mocks,
    }),
  )
}

describe('MembersInvitationList', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the filters section', async () => {
      await prepare()

      // Search input should be present - check by placeholder text (uses translation key)
      expect(screen.getByPlaceholderText('text_1767713872664lwivpxg5xlb')).toBeInTheDocument()
    })

    it('renders create invite button', async () => {
      await prepare()

      expect(screen.getByTestId('create-invite-button')).toBeInTheDocument()
    })

    it('renders invitations table after loading', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('test1@example.com')).toBeInTheDocument()
      })

      expect(screen.getByText('test2@example.com')).toBeInTheDocument()
    })

    it('renders role chips for invitations', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('test1@example.com')).toBeInTheDocument()
      })

      // Role chips should be displayed - uses translation keys for system roles
      expect(screen.getByText('text_664f035a68227f00e261b7ee')).toBeInTheDocument() // Admin
      expect(screen.getByText('text_664f035a68227f00e261b7f2')).toBeInTheDocument() // Finance
    })
  })

  describe('Loading State', () => {
    it('shows loading state while fetching data', async () => {
      const loadingMock = {
        request: {
          query: GetInvitesDocument,
          variables: { limit: 20 },
        },
        delay: Infinity,
        result: {
          data: null,
        },
      }

      await act(() =>
        render(<MembersInvitationList />, {
          mocks: [loadingMock, rolesListMock],
        }),
      )

      // During loading, invitation emails should not be visible
      expect(screen.queryByText('test1@example.com')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no invitations', async () => {
      const emptyMock = {
        request: {
          query: GetInvitesDocument,
          variables: { limit: 20 },
        },
        result: {
          data: {
            invites: {
              __typename: 'InviteCollection',
              metadata: {
                __typename: 'CollectionMetadata',
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
              },
              collection: [],
            },
          },
        },
      }

      await prepare({ mocks: [emptyMock, rolesListMock] })

      await waitFor(() => {
        // Empty state should show invite button
        expect(screen.getByTestId('create-invite-button')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('shows error state when query fails', async () => {
      const errorMock = {
        request: {
          query: GetInvitesDocument,
          variables: { limit: 20 },
        },
        error: new Error('Failed to fetch invitations'),
      }

      await prepare({ mocks: [errorMock, rolesListMock] })

      await waitFor(() => {
        // Error state title uses translation key
        expect(screen.getByText('text_6321a076b94bd1b32494e9ee')).toBeInTheDocument()
      })
    })
  })
})
