import { act, render as rtlRender, screen } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import RoleDetails from '../RoleDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
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

jest.mock('~/pages/settings/roles/common/rolePermissionsForm/RolePermissionsForm', () => ({
  __esModule: true,
  default: function MockRolePermissionsForm() {
    return <div data-testid="role-permissions-form">Permissions Form</div>
  },
}))

describe('RoleDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
