import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { CurrencyEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import {
  VOID_WALLET_CANCEL_BUTTON_TEST_ID,
  VOID_WALLET_CREDITS_FIELD_TEST_ID,
  VOID_WALLET_NAME_FIELD_TEST_ID,
  VOID_WALLET_SUBMIT_BUTTON_TEST_ID,
  VoidWalletDialog,
  VoidWalletDialogRef,
} from '../VoidWalletDialog'

const mockCreateVoidTransaction = jest.fn()
let capturedOnCompleted: ((res: unknown) => void) | undefined

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateCustomerWalletTransactionMutation: (options?: {
    onCompleted?: (res: unknown) => void
  }) => {
    capturedOnCompleted = options?.onCompleted

    return [mockCreateVoidTransaction]
  },
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const WALLET_PROPS = {
  walletId: 'wallet-1',
  creditsBalance: 100,
  currency: CurrencyEnum.Usd,
  rateAmount: 1,
}

const getCreditsInput = () =>
  within(screen.getByTestId(VOID_WALLET_CREDITS_FIELD_TEST_ID)).getByRole('textbox')

const getNameInput = () =>
  within(screen.getByTestId(VOID_WALLET_NAME_FIELD_TEST_ID)).getByRole('textbox')

const getSubmitButton = () => screen.getByTestId(VOID_WALLET_SUBMIT_BUTTON_TEST_ID)

async function prepare() {
  const ref = createRef<VoidWalletDialogRef>()

  await act(() => render(<VoidWalletDialog ref={ref} />))

  await act(async () => {
    ref.current?.openDialog(WALLET_PROPS)
  })

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  return ref
}

describe('VoidWalletDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ customerId: 'customer-1' })

    mockCreateVoidTransaction.mockImplementation(async () => {
      const res = { createCustomerWalletTransaction: { collection: [{ id: 'transaction-1' }] } }

      capturedOnCompleted?.(res)

      return { data: res }
    })
  })

  describe('GIVEN the dialog ref', () => {
    describe('WHEN openDialog is called with undefined', () => {
      it('THEN should not open dialog', () => {
        const ref = createRef<VoidWalletDialogRef>()

        render(<VoidWalletDialog ref={ref} />)

        act(() => {
          ref.current?.openDialog(undefined)
        })

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    describe('WHEN openDialog is called with wallet data', () => {
      it('THEN should show the dialog', async () => {
        await prepare()

        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the credits field is empty', () => {
      it('THEN should not show a visible error message', async () => {
        await prepare()

        expect(getCreditsInput()).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('WHEN the credits field is above the wallet credits balance and the user attempts to submit', () => {
      it('THEN should show the max credits error and disable the submit button', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '150')
        // Errors only surface starting from the first submit attempt (TanStack's
        // revalidateLogic default `mode: 'submit'`), then live afterwards — the
        // button is not disabled from the very first render like the old Formik
        // `validateOnMount` used to do.
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getCreditsInput()).toHaveAttribute('aria-invalid', 'true')
        })
        expect(getSubmitButton()).toBeDisabled()
      })
    })

    describe('WHEN the credits field is within the wallet credits balance', () => {
      it('THEN should keep the submit button enabled', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '50')

        expect(getCreditsInput()).toHaveAttribute('aria-invalid', 'false')
        expect(getSubmitButton()).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN the form submission', () => {
    describe('WHEN the user submits a valid amount of credits without a name', () => {
      it('THEN should call the mutation with the correct variables', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '50')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockCreateVoidTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: {
                  walletId: 'wallet-1',
                  voidedCredits: '50',
                  name: undefined,
                },
              },
            }),
          )
        })
      })

      it('THEN should show a success toast and close the dialog', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '50')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
      })

      it('THEN should navigate to the wallet details page', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '50')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(testMockNavigateFn).toHaveBeenCalledWith(expect.stringContaining('wallet-1'))
        })
      })
    })

    describe('WHEN the user submits with a transaction name', () => {
      it('THEN should call the mutation with the provided name', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getNameInput(), 'My void transaction')
        await user.type(getCreditsInput(), '20')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockCreateVoidTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: {
                  walletId: 'wallet-1',
                  voidedCredits: '20',
                  name: 'My void transaction',
                },
              },
            }),
          )
        })
      })
    })

    describe('WHEN the credits field exceeds the balance and the user clicks submit', () => {
      it('THEN should not call the mutation and disable the submit button', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.type(getCreditsInput(), '150')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })

        expect(mockCreateVoidTransaction).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the cancel button is clicked', () => {
      it('THEN should close the dialog without calling the mutation', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.click(screen.getByTestId(VOID_WALLET_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
        expect(mockCreateVoidTransaction).not.toHaveBeenCalled()
      })
    })
  })
})
