import { act, cleanup, screen } from '@testing-library/react'

import { MANAGED_IN_PRODUCTION_ALERT_TEST_ID } from '~/components/sandbox/ManagedInProductionAlert'
import { render } from '~/test-utils'

import Members, { MEMBERS_CREATE_INVITE_BUTTON_TEST_ID } from '../Members'

const mockUseSandbox = jest.fn()

jest.mock('~/hooks/useSandbox', () => ({
  useSandbox: () => mockUseSandbox(),
}))

let mockDeniedPermissions: string[] = []

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: (permissions: string[]) =>
      !permissions.some((permission) => mockDeniedPermissions.includes(permission)),
  }),
}))

jest.mock('../MembersList', () => ({
  __esModule: true,
  default: () => <div data-test="members-list">Members List</div>,
}))

jest.mock('../MembersInvitationList', () => ({
  __esModule: true,
  default: () => <div data-test="members-invitation-list">Invitations List</div>,
}))

describe('Members', () => {
  beforeEach(() => {
    mockDeniedPermissions = []
    mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })
  })

  afterEach(cleanup)

  describe('Rendering', () => {
    it('renders the page header with title', async () => {
      await act(() => render(<Members />))

      // Multiple elements contain "Members", so use getAllByText and check at least one exists
      const membersElements = screen.getAllByText(/members/i)

      expect(membersElements.length).toBeGreaterThan(0)
    })

    it('renders navigation tabs', async () => {
      await act(() => render(<Members />))

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('renders the Members tab', async () => {
      await act(() => render(<Members />))

      expect(screen.getByRole('tab', { name: /members/i })).toBeInTheDocument()
    })

    it('renders the Invitations tab', async () => {
      await act(() => render(<Members />))

      expect(screen.getByRole('tab', { name: /invitations/i })).toBeInTheDocument()
    })

    it('renders the MembersList component by default', async () => {
      await act(() => render(<Members />))

      expect(screen.getByTestId('members-list')).toBeInTheDocument()
    })
  })

  describe('GIVEN the member has the organizationMembersCreate permission', () => {
    it('THEN should display the create invite button', async () => {
      await act(() => render(<Members />))

      expect(screen.getByTestId(MEMBERS_CREATE_INVITE_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN the member does not have the organizationMembersCreate permission', () => {
    beforeEach(() => {
      mockDeniedPermissions = ['organizationMembersCreate']
    })

    it('THEN should hide the create invite button', async () => {
      await act(() => render(<Members />))

      expect(screen.queryByTestId(MEMBERS_CREATE_INVITE_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the organization is not a sandbox', () => {
    beforeEach(() => {
      mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })
    })

    it('THEN should not display the managed in production alert', async () => {
      await act(() => render(<Members />))

      expect(screen.queryByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the organization is a sandbox', () => {
    beforeEach(() => {
      mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: '/acme/' })
    })

    it('THEN should display the managed in production alert', async () => {
      await act(() => render(<Members />))

      expect(screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', async () => {
      const { container } = await act(() => render(<Members />))

      expect(container).toMatchSnapshot()
    })
  })
})
