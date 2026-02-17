import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { useEditInviteRoleDialog } from '../EditInviteRoleDialog'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

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

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
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

const TestComponent = () => {
  const { openEditInviteRoleDialog } = useEditInviteRoleDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() =>
        openEditInviteRoleDialog({
          __typename: 'Invite',
          id: INVITE_ID,
          email: INVITE_EMAIL,
          roles: [INITIAL_ROLE],
        })
      }
    >
      Open Dialog
    </button>
  )
}

async function prepare({ mocks = [rolesListMock] }: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent />
      </NiceModalWrapper>,
      { mocks },
    ),
  )
}

describe('EditInviteRoleDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Opening', () => {
    it('opens the dialog when the hook function is called', async () => {
      await prepare()

      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

      await act(async () => {
        screen.getByTestId('open-dialog').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    it('renders the invite email', async () => {
      await prepare()

      await act(async () => {
        screen.getByTestId('open-dialog').click()
      })

      await waitFor(() => {
        expect(screen.getByText(INVITE_EMAIL)).toBeInTheDocument()
      })
    })

    it('renders the role picker', async () => {
      await prepare()

      await act(async () => {
        screen.getByTestId('open-dialog').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument()
      })
    })
  })
})
