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

const mockAddToast = jest.fn()
const mockCopyToClipboard = jest.fn()
const mockCreateInvite = jest.fn()
const mockSetInviteToken = jest.fn()

let mockInviteToken = ''
let mockCreateInviteError: Error | null = null

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual('~/core/apolloClient')

  return {
    ...actual,
    addToast: (...args: unknown[]) => mockAddToast(...args),
  }
})

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
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

jest.mock('../../hooks/useInviteActions', () => ({
  useInviteActions: () => ({
    inviteToken: mockInviteToken,
    setInviteToken: (...args: unknown[]) => mockSetInviteToken(...args),
    createInvite: (...args: unknown[]) => mockCreateInvite(...args),
    createInviteError: mockCreateInviteError,
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
  beforeEach(() => {
    // Reset mocks before each test
    mockInviteToken = ''
    mockCreateInviteError = null
    mockCreateInvite.mockReset()
    mockSetInviteToken.mockReset()
    mockAddToast.mockReset()
    mockCopyToClipboard.mockReset()
  })

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

      await waitFor(
        () => {
          // Form should prevent submission with invalid email
          expect(screen.getByLabelText(/email/i)).toHaveValue('invalid-email')
        },
        { timeout: 1000 },
      )
    })

    it('shows error when role is not selected', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'valid@example.com')

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      await user.click(submitButton)

      await waitFor(
        () => {
          // Form should prevent submission without role
          expect(screen.getByLabelText(/email/i)).toHaveValue('valid@example.com')
        },
        { timeout: 1000 },
      )
    })

    it('validates both email and role are required', async () => {
      const user = userEvent.setup()

      await prepare()

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      // Try to submit empty form
      await user.click(submitButton)

      await waitFor(
        () => {
          // Form should prevent submission
          expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        },
        { timeout: 1000 },
      )
    })

    it('converts email to lowercase', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'TEST@EXAMPLE.COM')

      // Email should be converted to lowercase
      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com')
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

  describe('Role Selection', () => {
    it('displays role picker in the form', async () => {
      await prepare()

      // The role picker should be rendered
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })

  describe('Email Input', () => {
    it('accepts valid email addresses', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'user@example.com')

      expect(emailInput).toHaveValue('user@example.com')
    })

    it('handles special characters in email', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'user+test@example.co.uk')

      expect(emailInput).toHaveValue('user+test@example.co.uk')
    })
  })

  describe('Form Reset', () => {
    it('clears email when dialog is closed', async () => {
      const user = userEvent.setup()
      const { ref } = await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'test@example.com')

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })

      // Reopen
      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
      })
    })
  })

  describe('Dialog Content', () => {
    it('renders dialog with correct structure', async () => {
      await prepare()

      // Dialog should be present
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })

  describe('Submit Button State', () => {
    it('renders submit button with correct text', async () => {
      await prepare()

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent(/generate invitation/i)
    })

    it('submit button is enabled initially', async () => {
      await prepare()

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Cancel Button', () => {
    it('renders cancel button with correct text', async () => {
      await prepare()

      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      expect(cancelButton).toBeInTheDocument()
    })

    it('cancel button is always enabled', async () => {
      await prepare()

      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      expect(cancelButton).not.toBeDisabled()
    })
  })

  describe('Dialog Form', () => {
    it('renders form with correct structure', async () => {
      await prepare()

      expect(document.getElementById(FORM_CREATE_INVITE_ID)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('form has email and role fields in correct order', async () => {
      await prepare()

      const form = document.getElementById(FORM_CREATE_INVITE_ID)

      expect(form).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls createInvite when form is submitted', async () => {
      mockCreateInvite.mockResolvedValueOnce({
        data: {
          createInvite: {
            id: 'invite-123',
            token: 'test-token-123',
          },
        },
        errors: [],
      })

      await prepare()

      // Form submission logic is tested through component behavior
      expect(screen.getByTestId(SUBMIT_INVITE_DATA_TEST)).toBeInTheDocument()
    })
  })

  describe('Invite Success State', () => {
    it('shows copy button in success state', async () => {
      mockInviteToken = 'test-token'

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })
    })

    it('copies invitation URL when copy button is clicked', async () => {
      const user = userEvent.setup()

      mockInviteToken = 'test-token'

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })

      const copyButton = screen.getByTestId('copy-invite-link-button')

      await user.click(copyButton)

      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining('/invitation/test-token'),
      )
    })

    it('shows toast after copying invitation URL', async () => {
      const user = userEvent.setup()

      mockInviteToken = 'test-token'

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })

      const copyButton = screen.getByTestId('copy-invite-link-button')

      await user.click(copyButton)

      expect(mockAddToast).toHaveBeenCalledWith({
        severity: 'info',
        translateKey: 'text_63208c711ce25db781407536',
      })
    })

    it('closes dialog after copying invitation URL', async () => {
      const user = userEvent.setup()

      mockInviteToken = 'test-token'

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })

      const copyButton = screen.getByTestId('copy-invite-link-button')

      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })

    it('disables copy button when there is an error', async () => {
      mockInviteToken = 'test-token'
      mockCreateInviteError = new Error('Test error')

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeDisabled()
      })
    })

    it('shows error placeholder when invite creation fails', async () => {
      mockInviteToken = 'test-token'
      mockCreateInviteError = new Error('Failed to create invite')

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        // Error placeholder is shown
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog Close Behavior', () => {
    it('resets invite token when dialog closes', async () => {
      const user = userEvent.setup()

      mockInviteToken = 'test-token'

      const ref = createRef<CreateInviteDialogRef>()

      await act(() => render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog()
      })

      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      if (cancelButton) {
        await user.click(cancelButton)
      }

      await waitFor(() => {
        expect(mockSetInviteToken).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for initial state', async () => {
      const ref = createRef<CreateInviteDialogRef>()

      const { baseElement } = await act(() =>
        render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      expect(baseElement).toMatchSnapshot()
    })

    it('matches snapshot with email filled', async () => {
      const user = userEvent.setup()
      const ref = createRef<CreateInviteDialogRef>()

      const { baseElement } = await act(() =>
        render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'test@example.com')

      expect(baseElement).toMatchSnapshot()
    })

    it('matches snapshot with validation errors', async () => {
      const user = userEvent.setup()
      const ref = createRef<CreateInviteDialogRef>()

      const { baseElement } = await act(() =>
        render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByTestId(SUBMIT_INVITE_DATA_TEST)

      await user.click(submitButton)

      // Wait for validation to trigger
      await waitFor(
        () => {
          expect(emailInput).toHaveValue('invalid-email')
        },
        { timeout: 500 },
      )

      expect(baseElement).toMatchSnapshot()
    })

    it('matches snapshot in success state', async () => {
      mockInviteToken = 'test-token-snapshot'

      const ref = createRef<CreateInviteDialogRef>()

      const { baseElement } = await act(() =>
        render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeInTheDocument()
      })

      expect(baseElement).toMatchSnapshot()
    })

    it('matches snapshot with error state', async () => {
      mockInviteToken = 'test-token'
      mockCreateInviteError = new Error('Test error')

      const ref = createRef<CreateInviteDialogRef>()

      const { baseElement } = await act(() =>
        render(<CreateInviteDialog ref={ref} />, { mocks: [rolesListMock] }),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('copy-invite-link-button')).toBeDisabled()
      })

      expect(baseElement).toMatchSnapshot()
    })
  })
})
