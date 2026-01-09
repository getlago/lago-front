import { act, cleanup, screen, waitFor } from '@testing-library/react'

import { GetMembersDocument, GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import MembersList from '../MembersList'

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
jest.mock('../dialogs/EditMemberRoleDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditMemberRoleDialog'
  return { EditMemberRoleDialog: MockDialog }
})

jest.mock('../dialogs/RevokeMembershipDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'RevokeMembershipDialog'
  return { RevokeMembershipDialog: MockDialog }
})

jest.mock('../dialogs/CreateInviteDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'CreateInviteDialog'
  return { CreateInviteDialog: MockDialog }
})

const createMockMembership = (id: string, email: string, roles: string[]) => ({
  __typename: 'Membership',
  id,
  roles,
  user: {
    __typename: 'User',
    id: `user-${id}`,
    email,
  },
  organization: {
    __typename: 'Organization',
    id: 'org-1',
    name: 'Test Organization',
  },
  permissions: {
    __typename: 'Permissions',
    addonsCreate: true,
    addonsDelete: true,
    addonsUpdate: true,
    addonsView: true,
    analyticsOverdueBalancesView: true,
    analyticsMrrView: true,
    analyticsInvoicedUsagesView: true,
    analyticsView: true,
    analyticsGrossRevenuesView: true,
    billableMetricsCreate: true,
    billableMetricsDelete: true,
    billableMetricsUpdate: true,
    billableMetricsView: true,
    billingEntitiesCreate: true,
    billingEntitiesDelete: true,
    billingEntitiesUpdate: true,
    billingEntitiesView: true,
    couponsAttach: true,
    couponsCreate: true,
    couponsDelete: true,
    couponsDetach: true,
    couponsUpdate: true,
    couponsView: true,
    creditNotesCreate: true,
    creditNotesUpdate: true,
    creditNotesView: true,
    creditNotesVoid: true,
    customerSettingsUpdateGracePeriod: true,
    customerSettingsUpdateLang: true,
    customerSettingsUpdatePaymentTerms: true,
    customerSettingsUpdateTaxRates: true,
    customersCreate: true,
    customersDelete: true,
    customersUpdate: true,
    customersView: true,
    developersKeysManage: true,
    developersManage: true,
    draftInvoicesUpdate: true,
    dunningCampaignsCreate: true,
    dunningCampaignsDelete: true,
    dunningCampaignsUpdate: true,
    dunningCampaignsView: true,
    invoiceCustomSectionsCreate: true,
    invoiceCustomSectionsDelete: true,
    invoiceCustomSectionsUpdate: true,
    invoiceCustomSectionsView: true,
    invoicesCreate: true,
    invoicesSend: true,
    invoicesUpdate: true,
    invoicesView: true,
    invoicesVoid: true,
    organizationEmailsUpdate: true,
    organizationEmailsView: true,
    organizationIntegrationsCreate: true,
    organizationIntegrationsDelete: true,
    organizationIntegrationsUpdate: true,
    organizationIntegrationsView: true,
    organizationInvoicesUpdate: true,
    organizationInvoicesView: true,
    organizationMembersCreate: true,
    organizationMembersDelete: true,
    organizationMembersUpdate: true,
    organizationMembersView: true,
    organizationTaxesUpdate: true,
    organizationTaxesView: true,
    organizationUpdate: true,
    organizationView: true,
    plansCreate: true,
    plansDelete: true,
    plansUpdate: true,
    plansView: true,
    rolesCreate: true,
    rolesDelete: true,
    rolesUpdate: true,
    rolesView: true,
    subscriptionsCreate: true,
    subscriptionsUpdate: true,
    subscriptionsView: true,
    walletsCreate: true,
    walletsTerminate: true,
    walletsTopUp: true,
    walletsUpdate: true,
  },
})

const mockMembers = [
  createMockMembership('member-1', 'admin@example.com', ['Admin']),
  createMockMembership('member-2', 'finance@example.com', ['Finance']),
]

const membersListMock = {
  request: {
    query: GetMembersDocument,
    variables: { limit: 20 },
  },
  result: {
    data: {
      memberships: {
        __typename: 'MembershipCollection',
        metadata: {
          __typename: 'MembershipsCollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          adminCount: 1,
        },
        collection: mockMembers,
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
  mocks = [membersListMock, rolesListMock],
}: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(<MembersList />, {
      mocks,
    }),
  )
}

describe('MembersList', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the filters section', async () => {
      await prepare()

      // Search input should be present - check by placeholder text (uses translation key for members)
      expect(screen.getByPlaceholderText('text_1767713872664devzn1r2wql')).toBeInTheDocument()
    })

    it('renders create invite button', async () => {
      await prepare()

      expect(screen.getByTestId('create-invite-button')).toBeInTheDocument()
    })

    it('renders members table after loading', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      })

      expect(screen.getByText('finance@example.com')).toBeInTheDocument()
    })

    it('renders role chips for members', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
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
          query: GetMembersDocument,
          variables: { limit: 20 },
        },
        delay: Infinity,
        result: {
          data: null,
        },
      }

      await act(() =>
        render(<MembersList />, {
          mocks: [loadingMock, rolesListMock],
        }),
      )

      // During loading, member emails should not be visible
      expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no members', async () => {
      const emptyMock = {
        request: {
          query: GetMembersDocument,
          variables: { limit: 20 },
        },
        result: {
          data: {
            memberships: {
              __typename: 'MembershipCollection',
              metadata: {
                __typename: 'MembershipsCollectionMetadata',
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                adminCount: 0,
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
          query: GetMembersDocument,
          variables: { limit: 20 },
        },
        error: new Error('Failed to fetch members'),
      }

      await prepare({ mocks: [errorMock, rolesListMock] })

      await waitFor(() => {
        // Error state title uses translation key
        expect(screen.getByText('text_6321a076b94bd1b32494e9ee')).toBeInTheDocument()
      })
    })
  })
})
