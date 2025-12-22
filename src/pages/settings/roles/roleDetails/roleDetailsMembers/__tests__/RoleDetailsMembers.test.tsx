import { screen } from '@testing-library/react'

import { RoleItem } from '~/pages/settings/roles/common/roleTypes'
import { render } from '~/test-utils'

import RoleDetailsMembers from '../RoleDetailsMembers'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

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

describe('RoleDetailsMembers', () => {
  it('renders loading skeleton when isLoading is true', async () => {
    const { container } = await render(<RoleDetailsMembers isLoading={true} role={undefined} />)

    expect(container.querySelector('.animate-pulse, [class*="skeleton"]')).toBeInTheDocument()
  })

  it('renders header text when not loading', async () => {
    const role = createMockRole()

    await render(<RoleDetailsMembers isLoading={false} role={role} />)

    expect(screen.getByText('text_63208b630aaf8df6bbfb2655')).toBeInTheDocument()
    expect(screen.getByText('text_17660641695938ntvs0023to')).toBeInTheDocument()
  })

  it('renders members table with member emails', async () => {
    const role = createMockRole({
      members: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ],
    })

    await render(<RoleDetailsMembers isLoading={false} role={role} />)

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders empty table when role has no members', async () => {
    const role = createMockRole({ members: [] })

    await render(<RoleDetailsMembers isLoading={false} role={role} />)

    expect(screen.getByText('text_63208b630aaf8df6bbfb2655')).toBeInTheDocument()
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
  })

  it('does not render table when role is undefined', async () => {
    await render(<RoleDetailsMembers isLoading={false} role={undefined} />)

    expect(screen.getByText('text_63208b630aaf8df6bbfb2655')).toBeInTheDocument()
  })

  it('renders avatars for each member', async () => {
    const role = createMockRole({
      members: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
    })

    const { container } = await render(<RoleDetailsMembers isLoading={false} role={role} />)

    const avatars = container.querySelectorAll('[class*="avatar"], [class*="Avatar"]')

    expect(avatars.length).toBeGreaterThan(0)
  })
})
