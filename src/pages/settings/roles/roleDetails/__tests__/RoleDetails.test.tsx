import { act, render as rtlRender, screen } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import RoleDetails from '../RoleDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const render = (ui: React.ReactElement) =>
  rtlRender(ui, {
    wrapper: (props) => <AllTheProviders {...props} useParams={{ roleId: '1' }} />,
  })

jest.mock('../../common/useRoleDetails', () => ({
  useRoleDetails: () => ({
    role: {
      id: '1',
      name: 'custom-role',
      description: 'A custom role description',
      admin: false,
      members: [],
      permissions: ['plansView'],
    },
    isLoadingRole: false,
    canBeEdited: true,
    canBeDeleted: true,
  }),
}))

jest.mock('../../common/useRoleDisplayName', () => ({
  useRoleDisplayName: () => ({
    getDisplayName: (role: { name: string } | undefined) => role?.name || '',
  }),
}))

jest.mock(
  '../roleDetailsPermissions/RoleDetailsPermissions',
  () =>
    function MockRoleDetailsPermissions() {
      return <div data-test="role-details-permissions">Permissions Content</div>
    },
)

jest.mock(
  '../roleDetailsMembers/RoleDetailsMembers',
  () =>
    function MockRoleDetailsMembers() {
      return <div data-test="role-details-members">Members Content</div>
    },
)

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

  it('renders navigation tabs', async () => {
    await act(() => render(<RoleDetails />))

    expect(screen.getByText('text_634687079be251fdb43833b7')).toBeInTheDocument()
    expect(screen.getByText('text_63208b630aaf8df6bbfb2655')).toBeInTheDocument()
  })

  it('renders permissions content in overview tab', async () => {
    await act(() => render(<RoleDetails />))

    expect(screen.getByTestId('role-details-permissions')).toBeInTheDocument()
  })
})
