import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { EditInviteRoleDialog, EditInviteRoleDialogRef } from '../EditInviteRoleDialog'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

const INVITE_ID = 'invite-123'
const INVITE_EMAIL = 'test@example.com'
const INITIAL_ROLE = 'admin'

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
        {
          __typename: 'Role',
          id: 'role-3',
          name: 'Manager',
          code: 'manager',
          description: 'Manager role',
          permissions: [],
          admin: false,
          memberships: [],
        },
      ],
    },
  },
}

async function prepare({ mocks = [rolesListMock] }: { mocks?: TestMocksType } = {}) {
  const ref = createRef<EditInviteRoleDialogRef>()

  await act(() => render(<EditInviteRoleDialog ref={ref} />, { mocks }))

  await act(() => {
    ref.current?.openDialog({
      invite: {
        __typename: 'Invite',
        id: INVITE_ID,
        email: INVITE_EMAIL,
        roles: [INITIAL_ROLE],
      },
    })
  })

  return { ref }
}

describe('EditInviteRoleDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })

    it('renders the invite email', async () => {
      await prepare()

      expect(screen.getByText(INVITE_EMAIL)).toBeInTheDocument()
    })

    it('renders the role picker', async () => {
      await prepare()

      // Check that Role label text exists
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('renders cancel and submit buttons', async () => {
      await prepare()

      const buttons = screen.getAllByRole('button')

      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      // Find the cancel button by text content
      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      if (cancelButton) {
        await user.click(cancelButton)
      }

      await waitFor(
        () => {
          expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<EditInviteRoleDialogRef>()

      await act(() => render(<EditInviteRoleDialog ref={ref} />, { mocks: [rolesListMock] }))

      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog({
          invite: {
            __typename: 'Invite',
            id: INVITE_ID,
            email: INVITE_EMAIL,
            roles: [INITIAL_ROLE],
          },
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    it('exposes closeDialog method via ref', async () => {
      const { ref } = await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      const dialog = screen.getByRole('dialog')

      expect(dialog).toMatchSnapshot()
    })
  })
})
