import { render, screen } from '@testing-library/react'

import { useCurrentUser } from '~/hooks/useCurrentUser'

import AdminGuard from '../AdminGuard'

jest.mock('~/hooks/useCurrentUser')
jest.mock('react-router', () => ({
  Navigate: ({ to }: { to: string }) => <span>Redirect: {to}</span>,
  Outlet: () => <span>Admin content</span>,
}))

describe('AdminGuard', () => {
  it.each([
    [true, true, 'staff@getlago.com', false],
    [false, false, 'staff@getlago.com', false],
    [false, true, 'staff@example.com', false],
    [false, true, 'staff@getlago.com.attacker.com', false],
    [false, true, 'staff@getlago.com', true],
  ])('gates loading=%s, admin=%s, email=%s', (loading, csAdmin, email, allowed) => {
    jest.mocked(useCurrentUser).mockReturnValue({
      loading,
      isPremium: false,
      refetchCurrentUserInfos: jest.fn(),
      currentUser: { id: 'user', email, csAdmin, premium: false, memberships: [] },
    })
    const { container } = render(<AdminGuard />)

    if (loading) {
      expect(container).toBeEmptyDOMElement()
    } else if (allowed) {
      expect(screen.getByText('Admin content')).toBeInTheDocument()
    } else {
      expect(screen.getByText('Redirect: /404')).toBeInTheDocument()
    }
  })
})
