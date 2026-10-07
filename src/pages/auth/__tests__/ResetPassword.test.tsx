import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PASSWORD_HINTS_TEST_IDS } from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import { GetPasswordResetDocument, LagoApiError, ResetPasswordDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import ResetPassword, {
  RESET_PASSWORD_EMAIL_FIELD_TEST_ID,
  RESET_PASSWORD_PASSWORD_FIELD_TEST_ID,
  RESET_PASSWORD_SUBMIT_BUTTON_TEST_ID,
} from '../ResetPassword'

const TOKEN = 'a-reset-token'
const EMAIL = 'gavin@hooli.com'
const VALID_PASSWORD = 'MyPassw0rd!'

const mockOnLogIn = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const passwordResetMock: TestMocksType[0] = {
  request: { query: GetPasswordResetDocument, variables: { token: TOKEN } },
  result: {
    data: {
      passwordReset: { id: 'password-reset-id', user: { id: 'user-id', email: EMAIL } },
    },
  },
}

const passwordResetErrorMock: TestMocksType[0] = {
  request: { query: GetPasswordResetDocument, variables: { token: TOKEN } },
  error: new Error(LagoApiError.NotFound),
}

const resetPasswordMock = (token: string | null): TestMocksType[0] => ({
  request: {
    query: ResetPasswordDocument,
    variables: { input: { token: TOKEN, newPassword: VALID_PASSWORD } },
  },
  result: { data: { resetPassword: token === null ? null : { token } } },
})

const renderResetPassword = async (mocks: TestMocksType): Promise<void> => {
  await act(async () => {
    render(<ResetPassword />, { mocks, useParams: { token: TOKEN } })
  })

  // MockedProvider answers on a 0ms timer, so flushing microtasks alone leaves the
  // query loading and every assertion below racing it.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

const typePassword = async (password: string): Promise<void> => {
  const input = screen
    .getByTestId(RESET_PASSWORD_PASSWORD_FIELD_TEST_ID)
    .querySelector('input') as HTMLInputElement

  await act(async () => {
    await userEvent.type(input, password)
  })
}

const submit = async (): Promise<void> => {
  await act(async () => {
    await userEvent.click(screen.getByTestId(RESET_PASSWORD_SUBMIT_BUTTON_TEST_ID))
  })

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the reset token cannot be resolved', () => {
    describe('WHEN the query fails', () => {
      it('THEN should not display the form', async () => {
        await renderResetPassword([passwordResetErrorMock])

        await waitFor(() => {
          expect(
            screen.queryByTestId(RESET_PASSWORD_PASSWORD_FIELD_TEST_ID),
          ).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the reset token resolves', () => {
    describe('WHEN the page renders', () => {
      it.each([
        ['email field', RESET_PASSWORD_EMAIL_FIELD_TEST_ID],
        ['password field', RESET_PASSWORD_PASSWORD_FIELD_TEST_ID],
        ['submit button', RESET_PASSWORD_SUBMIT_BUTTON_TEST_ID],
      ])('THEN should display the %s', async (_, testId) => {
        await renderResetPassword([passwordResetMock])

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should display the account email as a disabled field', async () => {
        await renderResetPassword([passwordResetMock])

        const input = screen
          .getByTestId(RESET_PASSWORD_EMAIL_FIELD_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(input).toHaveValue(EMAIL)
        expect(input).toBeDisabled()
      })
    })

    describe('WHEN typing a password breaking the rules', () => {
      it('THEN should display the validation checklist', async () => {
        await renderResetPassword([passwordResetMock])
        await typePassword('weak')

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
      })
    })

    describe('WHEN typing a password matching every rule', () => {
      it('THEN should display the success alert', async () => {
        await renderResetPassword([passwordResetMock])
        await typePassword(VALID_PASSWORD)

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)).toBeInTheDocument()
      })
    })

    describe('WHEN submitting a password breaking the rules', () => {
      it('THEN should not reset the password', async () => {
        await renderResetPassword([passwordResetMock, resetPasswordMock('new-auth-token')])
        await typePassword('weak')
        await submit()

        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting a valid password', () => {
      it('THEN should log the user in with the returned token', async () => {
        await renderResetPassword([passwordResetMock, resetPasswordMock('new-auth-token')])
        await typePassword(VALID_PASSWORD)
        await submit()

        await waitFor(() => {
          expect(mockOnLogIn).toHaveBeenCalledWith(expect.anything(), 'new-auth-token')
        })
      })
    })

    describe('WHEN the reset mutation returns no token', () => {
      it('THEN should display a danger toast', async () => {
        await renderResetPassword([passwordResetMock, resetPasswordMock(null)])
        await typePassword(VALID_PASSWORD)
        await submit()

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        })
        expect(mockOnLogIn).not.toHaveBeenCalled()
      })
    })
  })
})
