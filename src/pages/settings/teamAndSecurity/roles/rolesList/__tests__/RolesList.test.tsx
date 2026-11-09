import { act, fireEvent, screen, within } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { MANAGED_IN_PRODUCTION_ALERT_TEST_ID } from '~/components/sandbox/ManagedInProductionAlert'
import { render } from '~/test-utils'

import RolesList, {
  ROLES_LIST_CREATE_ROLE_BUTTON_TEST_ID,
  ROLES_LIST_DELETE_ACTION_TEST_ID,
  ROLES_LIST_DUPLICATE_ACTION_TEST_ID,
  ROLES_LIST_EDIT_ACTION_TEST_ID,
} from '../RolesList'

const mockNavigate = jest.fn()
const mockDeleteRole = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockHasOrganizationPremiumAddon = jest.fn()
const mockUseSandbox = jest.fn()

jest.mock('~/hooks/useSandbox', () => ({
  useSandbox: () => mockUseSandbox(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/useRolesList', () => ({
  useRolesList: () => ({
    roles: [
      {
        id: '1',
        name: 'Admin',
        description: 'Admin role',
        admin: true,
        grantable: true,
        memberships: [{ id: '1', name: 'John', email: 'john@test.com' }],
        permissions: [],
      },
      {
        id: '2',
        name: 'custom-role',
        description: 'Custom role',
        admin: false,
        grantable: true,
        memberships: [],
        permissions: ['plansView'],
      },
    ],
    isLoadingRoles: false,
    deleteRole: mockDeleteRole,
  }),
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  generatePath: (path: string, params?: Record<string, string>) => {
    if (params) {
      return Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(`:${key}`, value),
        path,
      )
    }
    return path
  },
}))

describe('RolesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasOrganizationPremiumAddon.mockReturnValue(true)
    mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })
  })

  it('renders page header', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getAllByText('text_1765448879791epmkg4xijkn')).toHaveLength(1)
  })

  it('renders roles table with correct columns', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getByText('text_1765464417018tezju4yvyoo')).toBeInTheDocument()
    expect(screen.getByText('text_1765464417018n3moulidii0')).toBeInTheDocument()
    expect(screen.getByText('text_17654644170188lrzkfyhtkf')).toBeInTheDocument()
  })

  it('renders system role with translated name', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getByText('text_664f035a68227f00e261b7ee')).toBeInTheDocument()
  })

  it('renders custom role with original name', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getByText('custom-role')).toBeInTheDocument()
  })

  it('displays member count for each role', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('displays role type status', async () => {
    await act(() => render(<RolesList />))

    expect(screen.getByText('text_1765464506554l3g5v7dctfv')).toBeInTheDocument()
    expect(screen.getByText('text_6641dd21c0cffd005b5e2a8b')).toBeInTheDocument()
  })

  it('renders action menu button for each role', async () => {
    await act(() => render(<RolesList />))

    const actionButtons = screen.getAllByTestId('open-action-button')

    expect(actionButtons.length).toBeGreaterThan(0)
  })

  describe('the row menu of a custom role', () => {
    it.each([
      [
        'duplicate',
        'text_64fa170e02f348164797a6af',
        '/settings/team-and-security/roles/create?duplicate-from=2',
      ],
      ['edit', 'text_1765528921745ibx4b56q1mt', '/settings/team-and-security/roles/2/edit'],
    ])('renders the %s entry as an anchor to its route', async (_, name, href) => {
      await act(() => render(<RolesList />))

      fireEvent.click(screen.getAllByTestId('open-action-button')[1])

      expect(within(screen.getByRole('tooltip')).getByRole('link', { name })).toHaveAttribute(
        'href',
        href,
      )
    })
  })

  describe('with premium addon', () => {
    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(true)
    })

    it('renders create button as link', async () => {
      await act(() => render(<RolesList />))

      const createButton = screen.getByText('text_1765530400261k7yl3n4kk8h')

      expect(createButton).toBeInTheDocument()
      expect(createButton.closest('a')).toHaveAttribute(
        'href',
        '/settings/team-and-security/roles/create',
      )
    })
  })

  describe('without premium addon', () => {
    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
    })

    it('renders create button with sparkles icon as button not link', async () => {
      await act(() => render(<RolesList />))

      const createButton = screen.getByText('text_1765530400261k7yl3n4kk8h')

      expect(createButton).toBeInTheDocument()
      // Should be a button, not a link
      expect(createButton.closest('button')).toBeInTheDocument()
      expect(createButton.closest('a')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the organization has the custom roles premium addon', () => {
    const CUSTOM_ROLE_ACTIONS = [
      ['duplicate', ROLES_LIST_DUPLICATE_ACTION_TEST_ID],
      ['edit', ROLES_LIST_EDIT_ACTION_TEST_ID],
      ['delete', ROLES_LIST_DELETE_ACTION_TEST_ID],
    ]

    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(true)
    })

    describe('WHEN the organization is not a sandbox', () => {
      beforeEach(() => {
        mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })
      })

      it('THEN should display the create role button', async () => {
        await act(() => render(<RolesList />))

        expect(screen.getByTestId(ROLES_LIST_CREATE_ROLE_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the managed in production alert', async () => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).not.toBeInTheDocument()
      })

      it.each(CUSTOM_ROLE_ACTIONS)(
        'THEN should enable the %s action of a custom role',
        async (_, testId) => {
          await act(() => render(<RolesList />))

          fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[1])

          expect(screen.getByTestId(testId)).toBeEnabled()
        },
      )
    })

    describe('WHEN the organization is a sandbox', () => {
      beforeEach(() => {
        mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: '/acme/' })
      })

      it('THEN should hide the create role button', async () => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(ROLES_LIST_CREATE_ROLE_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the managed in production alert', async () => {
        await act(() => render(<RolesList />))

        expect(screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display any row action menu', async () => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(OPEN_ACTION_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it.each(CUSTOM_ROLE_ACTIONS)('THEN should not render the %s action', async (_, testId) => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the organization does not have the custom roles premium addon', () => {
    const SPARKLES_ICON_TEST_ID = 'sparkles/medium'

    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
    })

    describe('WHEN the organization is not a sandbox', () => {
      beforeEach(() => {
        mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })
      })

      it('THEN should display the premium upsell header button', async () => {
        await act(() => render(<RolesList />))

        expect(screen.getByTestId(SPARKLES_ICON_TEST_ID).closest('button')).toBeInTheDocument()
      })

      it('THEN should display a row action menu per role', async () => {
        await act(() => render(<RolesList />))

        expect(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN the organization is a sandbox', () => {
      beforeEach(() => {
        mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: '/acme/' })
      })

      it('THEN should not display the premium upsell header button', async () => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(SPARKLES_ICON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should not display the row duplicate action', async () => {
        await act(() => render(<RolesList />))

        expect(screen.queryByTestId(OPEN_ACTION_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the managed in production alert', async () => {
        await act(() => render(<RolesList />))

        expect(screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
