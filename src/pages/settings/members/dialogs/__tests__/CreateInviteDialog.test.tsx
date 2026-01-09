import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { DialogRef } from '~/components/designSystem'
import { GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import {
  CreateInviteDialog,
  CreateInviteDialogRef,
  FORM_CREATE_INVITE_ID,
  SUBMIT_INVITE_DATA_TEST,
} from '../CreateInviteDialog'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      id: 'org-123',
      name: 'Test Organization',
    },
  }),
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

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
      ],
    },
  },
}

async function prepare({ mocks = [rolesListMock] }: { mocks?: TestMocksType } = {}) {
  const ref = createRef<CreateInviteDialogRef>()

  await act(() => render(<CreateInviteDialog ref={ref} />, { mocks }))

  await act(() => {
    ref.current?.openDialog()
  })

  return { ref }
}

describe('CreateInviteDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })

    it('renders the email input field', async () => {
      await prepare()

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('renders the role picker', async () => {
      await prepare()

      // Check that Role label text exists
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('renders the submit button', async () => {
      await prepare()

      expect(screen.getByTestId(SUBMIT_INVITE_DATA_TEST)).toBeInTheDocument()
    })

    it('renders the cancel button', async () => {
      await prepare()

      const buttons = screen.getAllByRole('button')

      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Form Validation', () => {
    it('shows error for invalid email', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('text-field-error')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      if (cancelButton) {
        await user.click(cancelButton)
      }

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })

    it('resets form when dialog is closed and reopened', async () => {
      const user = userEvent.setup()
      const ref = createRef<DialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      // Open dialog
      await act(() => {
        ref.current?.openDialog()
      })

      // Type in email
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')

      // Close dialog
      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      if (cancelButton) {
        await user.click(cancelButton)
      }

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })

      // Reopen dialog
      await act(() => {
        ref.current?.openDialog()
      })

      // Email should be reset
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
      })
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog()
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

  describe('Form ID', () => {
    it('has the correct form ID', async () => {
      await prepare()

      expect(document.getElementById(FORM_CREATE_INVITE_ID)).toBeInTheDocument()
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot for initial state', async () => {
      await prepare()

      const dialog = screen.getByRole('dialog')

      expect(dialog).toMatchSnapshot()
    })
  })
})
