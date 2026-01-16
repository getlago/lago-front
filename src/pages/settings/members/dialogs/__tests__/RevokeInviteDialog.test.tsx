import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import {
  WARNING_DIALOG_CANCEL_BUTTON_TEST_ID,
  WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID,
  WARNING_DIALOG_TEST_ID,
} from '~/components/designSystem/WarningDialog'
import { RevokeInviteDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { RevokeInviteDialog, RevokeInviteDialogRef } from '../RevokeInviteDialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const INVITE_ID = 'invite-123'
const INVITE_EMAIL = 'test@example.com'
const ORGANIZATION_NAME = 'Test Organization'

async function prepare({ mocks = [] }: { mocks?: TestMocksType } = {}) {
  const ref = createRef<RevokeInviteDialogRef>()

  await act(() => render(<RevokeInviteDialog ref={ref} />, { mocks }))

  await act(() => {
    ref.current?.openDialog({
      id: INVITE_ID,
      email: INVITE_EMAIL,
      organizationName: ORGANIZATION_NAME,
    })
  })

  return { ref }
}

describe('RevokeInviteDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })

    it('renders the dialog with description containing email and organization', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
    })

    it('renders cancel and confirm buttons', async () => {
      await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()

      await user.click(screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('calls revokeInvite mutation when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const mutationMock = {
        request: {
          query: RevokeInviteDocument,
          variables: {
            input: {
              id: INVITE_ID,
            },
          },
        },
        result: {
          data: {
            revokeInvite: {
              id: INVITE_ID,
            },
          },
        },
      }

      await prepare({ mocks: [mutationMock] })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          translateKey: 'text_63208c711ce25db781407523',
          severity: 'success',
        })
      })
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<RevokeInviteDialogRef>()

      await act(() => render(<RevokeInviteDialog ref={ref} />))

      expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog({
          id: INVITE_ID,
          email: INVITE_EMAIL,
          organizationName: ORGANIZATION_NAME,
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()
      })
    })

    it('exposes closeDialog method via ref', async () => {
      const { ref } = await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', async () => {
      await prepare()

      const dialog = screen.getByTestId(WARNING_DIALOG_TEST_ID)

      expect(dialog).toMatchSnapshot()
    })
  })
})
