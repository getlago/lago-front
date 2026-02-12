import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import {
  FORM_CREATE_INVITE_ID,
  SUBMIT_INVITE_DATA_TEST,
  useCreateInviteDialog,
} from '../CreateInviteDialog'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

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

jest.mock('../../hooks/useInviteActions', () => ({
  useInviteActions: () => ({
    createInvite: jest.fn(),
  }),
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

const OPEN_DIALOG_TEST_ID = 'open-dialog'

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

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const TestComponent = () => {
  const { openCreateInviteDialog } = useCreateInviteDialog()

  return (
    <button data-test={OPEN_DIALOG_TEST_ID} onClick={openCreateInviteDialog}>
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

  await act(async () => {
    screen.getByTestId(OPEN_DIALOG_TEST_ID).click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('CreateInviteDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Opening', () => {
    it('opens the dialog when the hook function is called', async () => {
      await act(() =>
        render(
          <NiceModalWrapper>
            <TestComponent />
          </NiceModalWrapper>,
          { mocks: [rolesListMock] },
        ),
      )

      expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()

      await act(async () => {
        screen.getByTestId(OPEN_DIALOG_TEST_ID).click()
      })

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
    })

    it('renders the email input field', async () => {
      await prepare()

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('renders the role picker', async () => {
      await prepare()

      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('renders the submit button', async () => {
      await prepare()

      expect(screen.getByTestId(SUBMIT_INVITE_DATA_TEST)).toBeInTheDocument()
    })

    it('renders the cancel button', async () => {
      await prepare()

      expect(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('converts email to lowercase', async () => {
      const user = userEvent.setup()

      await prepare()

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'TEST@EXAMPLE.COM')

      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com')
      })
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()

      const cancelButton = screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)

      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form ID', () => {
    it('has the correct form ID', async () => {
      await prepare()

      expect(document.getElementById(FORM_CREATE_INVITE_ID)).toBeInTheDocument()
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

  describe('Dialog Form', () => {
    it('renders form with correct structure', async () => {
      await prepare()

      expect(document.getElementById(FORM_CREATE_INVITE_ID)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })
})
