import { act, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AllTheProviders } from '~/test-utils'

import RoleDetails from '../RoleDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockHasOrganizationPremiumAddon = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

const render = (ui: React.ReactElement) =>
  rtlRender(ui, {
    wrapper: (props) => <AllTheProviders {...props} useParams={{ roleId: '1' }} />,
  })

jest.mock('../../hooks/useRoleDetails', () => ({
  useRoleDetails: () => ({
    role: {
      id: '1',
      name: 'custom-role',
      code: 'custom-role-code',
      description: 'A custom role description',
      admin: false,
      memberships: [],
      permissions: ['PlansView'],
    },
    isLoadingRole: false,
    isSystem: false,
    canBeDuplicated: true,
    canBeEdited: true,
    canBeDeleted: true,
  }),
}))

jest.mock('~/hooks/useRoleDisplayInformation', () => ({
  useRoleDisplayInformation: () => ({
    getDisplayName: (role: { name: string } | undefined) => role?.name || '',
    getDisplayDescription: (role: { description: string } | undefined) => role?.description || '',
  }),
}))

jest.mock('../../hooks/useRoleActions', () => ({
  useRoleActions: () => ({
    navigateToDuplicate: jest.fn(),
    navigateToEdit: jest.fn(),
  }),
}))

jest.mock(
  '~/pages/settings/teamAndSecurity/roles/common/rolePermissionsForm/RolePermissionsForm',
  () => ({
    __esModule: true,
    default: function MockRolePermissionsForm() {
      return <div data-testid="role-permissions-form">Permissions Form</div>
    },
  }),
)

describe('RoleDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasOrganizationPremiumAddon.mockReturnValue(true)
  })

  it('renders role name in header', async () => {
    await act(() => render(<RoleDetails />))

    expect(screen.getAllByText('custom-role').length).toBeGreaterThan(0)
  })

  it('renders role description', async () => {
    await act(() => render(<RoleDetails />))

    expect(screen.getByText('A custom role description')).toBeInTheDocument()
  })

  it('renders back button to roles list', async () => {
    await act(() => render(<RoleDetails />))

    const backButton = screen.getByRole('link', { name: '' })

    expect(backButton).toBeInTheDocument()
  })

  it('renders action button', async () => {
    await act(() => render(<RoleDetails />))

    expect(screen.getByText('text_634687079be251fdb438338f')).toBeInTheDocument()
  })

  describe('with premium addon', () => {
    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(true)
    })

    it('shows duplicate, edit, and delete actions in menu', async () => {
      await act(() => render(<RoleDetails />))

      const actionButton = screen.getByText('text_634687079be251fdb438338f')

      await userEvent.click(actionButton)

      // Duplicate button (text_64fa170e02f348164797a6af)
      expect(screen.getByText('text_64fa170e02f348164797a6af')).toBeInTheDocument()
      // Edit button (text_63aa15caab5b16980b21b0b8)
      expect(screen.getByText('text_63aa15caab5b16980b21b0b8')).toBeInTheDocument()
      // Delete button (text_6261640f28a49700f1290df5)
      expect(screen.getByText('text_6261640f28a49700f1290df5')).toBeInTheDocument()
    })

    it('does not show sparkles icon on duplicate button', async () => {
      await act(() => render(<RoleDetails />))

      const actionButton = screen.getByText('text_634687079be251fdb438338f')

      await userEvent.click(actionButton)

      const duplicateButton = screen.getByText('text_64fa170e02f348164797a6af').closest('button')

      expect(duplicateButton).not.toHaveAttribute('data-icon', 'sparkles')
    })
  })

  describe('without premium addon', () => {
    beforeEach(() => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
    })

    it('shows only duplicate action with sparkles icon in menu', async () => {
      await act(() => render(<RoleDetails />))

      const actionButton = screen.getByText('text_634687079be251fdb438338f')

      await userEvent.click(actionButton)

      // Duplicate button should be visible (text_64fa170e02f348164797a6af)
      expect(screen.getByText('text_64fa170e02f348164797a6af')).toBeInTheDocument()
      // Edit button should NOT be visible (text_63aa15caab5b16980b21b0b8)
      expect(screen.queryByText('text_63aa15caab5b16980b21b0b8')).not.toBeInTheDocument()
      // Delete button should NOT be visible (text_6261640f28a49700f1290df5)
      expect(screen.queryByText('text_6261640f28a49700f1290df5')).not.toBeInTheDocument()
    })
  })
})
