import { screen } from '@testing-library/react'

import { RoleItem } from '~/pages/settings/roles/common/roleTypes'
import { render } from '~/test-utils'

import RoleDetailsPermissions from '../RoleDetailsPermissions'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock(
  '~/pages/settings/roles/common/rolePermissionsForm/RolePermissionsForm',
  () =>
    function MockRolePermissionsForm({
      isEditable,
      isLoading,
    }: {
      isEditable: boolean
      isLoading: boolean
    }) {
      return (
        <div data-test="role-permissions-form">
          <span data-test="is-editable">{isEditable ? 'editable' : 'readonly'}</span>
          <span data-test="is-loading">{isLoading ? 'loading' : 'loaded'}</span>
        </div>
      )
    },
)

const createMockRole = (overrides: Partial<RoleItem> = {}): RoleItem => ({
  id: '1',
  organization: null,
  name: 'test-role',
  description: 'Test description',
  admin: false,
  deletedAt: null,
  members: [],
  permissions: [],
  ...overrides,
})

describe('RoleDetailsPermissions', () => {
  it('renders loading skeleton when isLoading is true', async () => {
    const { container } = await render(<RoleDetailsPermissions isLoading={true} role={undefined} />)

    expect(container.querySelector('.animate-pulse, [class*="skeleton"]')).toBeInTheDocument()
  })

  it('renders header text when not loading', async () => {
    const role = createMockRole()

    await render(<RoleDetailsPermissions isLoading={false} role={role} />)

    expect(screen.getByText('text_1765809421198bliknx7z31x')).toBeInTheDocument()
    expect(screen.getByText('text_17658096048119hpdp8kwcqd')).toBeInTheDocument()
  })

  it('renders RolePermissionsForm with isEditable=false', async () => {
    const role = createMockRole()

    await render(<RoleDetailsPermissions isLoading={false} role={role} />)

    expect(screen.getByTestId('role-permissions-form')).toBeInTheDocument()
    expect(screen.getByTestId('is-editable')).toHaveTextContent('readonly')
  })

  it('passes isLoading prop to RolePermissionsForm', async () => {
    const role = createMockRole()

    await render(<RoleDetailsPermissions isLoading={false} role={role} />)

    expect(screen.getByTestId('is-loading')).toHaveTextContent('loaded')
  })

  it('renders form element', async () => {
    const role = createMockRole()

    const { container } = await render(<RoleDetailsPermissions isLoading={false} role={role} />)

    expect(container.querySelector('form')).toBeInTheDocument()
  })
})
