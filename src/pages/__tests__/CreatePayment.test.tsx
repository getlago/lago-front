import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { CurrencyEnum, InvoiceTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import CreatePayment, {
  CREATE_PAYMENT_CANCEL_BUTTON_TEST_ID,
  CREATE_PAYMENT_CLOSE_BUTTON_TEST_ID,
  CREATE_PAYMENT_FORM_ID,
  CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID,
} from '../CreatePayment'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

const mockGoBack = jest.fn()

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: mockGoBack }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ timezone: 'TZ_UTC' }),
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => (
    <div data-test={`form-loading-skeleton-${id}`} />
  ),
}))

const mockUseGetPayableInvoicesQuery = jest.fn()
const mockUseGetPayableInvoiceQuery = jest.fn()
const mockCreatePayment = jest.fn()

type MutationOptions = { onCompleted?: (data: Record<string, unknown>) => void }

// Apollo calls `onCompleted` with the mutation's `data` once it resolves — reproduce that
// here since the mutation hook is fully mocked and Apollo never actually runs.
const withOnCompleted =
  (mock: jest.Mock) =>
  (options?: MutationOptions): [(...args: unknown[]) => Promise<unknown>] => [
    async (...args: unknown[]) => {
      const result = (await mock(...args)) as { data?: Record<string, unknown> }

      if (result?.data) {
        options?.onCompleted?.(result.data)
      }

      return result
    },
  ]

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPayableInvoicesQuery: (...args: unknown[]) => mockUseGetPayableInvoicesQuery(...args),
  useGetPayableInvoiceQuery: (...args: unknown[]) => mockUseGetPayableInvoiceQuery(...args),
  useCreatePaymentMutation: (options?: MutationOptions) =>
    withOnCompleted(mockCreatePayment)(options),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const payableInvoice = {
  id: 'invoice-1',
  number: 'INV-001',
  paymentStatus: 'pending',
  status: 'finalized',
  totalDueAmountCents: '10000',
  issuingDate: '2026-01-10',
  currency: CurrencyEnum.Usd,
  invoiceType: InvoiceTypeEnum.Subscription,
}

type Invoice = typeof payableInvoice

const mockInvoiceQuery = (invoice?: Partial<Invoice>, { loading = false } = {}) => {
  mockUseGetPayableInvoiceQuery.mockImplementation((options?: { skip?: boolean }) => {
    if (options?.skip) return { data: undefined, loading: false }

    return {
      data: invoice ? { invoice: { ...payableInvoice, ...invoice } } : undefined,
      loading,
    }
  })
}

// jsdom cannot parse the invoice Table's `:has([data-id="actionColumn"] button:hover)` rule,
// which user-event reads through getComputedStyle on every pointer action.
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const renderOnCreateRoute = () => render(<CreatePayment />, { useParams: {} })

const renderOnInvoiceRoute = () =>
  render(<CreatePayment />, { useParams: { invoiceId: 'invoice-1' } })

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>, amount = '50') => {
  await user.type(getInput('reference'), 'my-reference')
  await user.type(getInput('amountCents'), amount)
  await user.click(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID))
}

describe('CreatePayment', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used by scrollToFirstInputError on invalid submit)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetPayableInvoicesQuery.mockReturnValue({
      data: { invoices: { collection: [{ id: 'invoice-1', number: 'INV-001' }] } },
      loading: false,
    })
    mockInvoiceQuery(payableInvoice)
    mockCreatePayment.mockResolvedValue({
      data: { createPayment: { id: 'payment-1' } },
      errors: undefined,
    })
  })

  describe('GIVEN the selected invoice is loading', () => {
    it('THEN should display the loading skeleton', () => {
      mockInvoiceQuery(payableInvoice, { loading: true })

      renderOnInvoiceRoute()

      expect(screen.getByTestId('form-loading-skeleton-create-payment-request')).toBeInTheDocument()
    })
  })

  describe('GIVEN no invoice in the route', () => {
    describe('WHEN the page loads', () => {
      it('THEN should display the form', () => {
        renderOnCreateRoute()

        expect(document.getElementById(CREATE_PAYMENT_FORM_ID)).toBeInTheDocument()
      })

      it('THEN should skip the invoice query', () => {
        renderOnCreateRoute()

        expect(mockUseGetPayableInvoiceQuery).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: '' }, skip: true }),
        )
      })

      it.each([['reference'], ['amountCents']])('THEN should display an empty %s input', (name) => {
        renderOnCreateRoute()

        expect(getInput(name)).toHaveValue('')
      })

      it('THEN should seed the payment date', () => {
        renderOnCreateRoute()

        expect(getInput('createdAt')).not.toHaveValue('')
      })

      it('THEN should leave the invoice combobox editable', () => {
        renderOnCreateRoute()

        expect(getInput('invoiceId')).not.toBeDisabled()
      })
    })

    describe('WHEN submitting an empty form', () => {
      it('THEN should not call the create mutation', async () => {
        const user = setupUser()

        renderOnCreateRoute()

        await user.click(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        })
        expect(mockCreatePayment).not.toHaveBeenCalled()
      })

      it('THEN should scroll to the first input in error', async () => {
        const user = setupUser()

        renderOnCreateRoute()

        // `invoiceId` is the first input of the form, so `onSubmitInvalid` must reach it.
        const scrollIntoView = jest.spyOn(getInput('invoiceId'), 'scrollIntoView')

        await user.click(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
        })
      })
    })

    describe('WHEN leaving a pristine form', () => {
      it.each([
        ['close button', CREATE_PAYMENT_CLOSE_BUTTON_TEST_ID],
        ['cancel button', CREATE_PAYMENT_CANCEL_BUTTON_TEST_ID],
      ])('THEN should navigate back from the %s without a warning', async (_, testId) => {
        const user = setupUser()

        renderOnCreateRoute()

        await user.click(screen.getByTestId(testId))

        expect(mockGoBack).toHaveBeenCalled()
        expect(mockDialogOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN leaving a dirty form', () => {
      it('THEN should open the dirty attributes warning', async () => {
        const user = setupUser()

        renderOnCreateRoute()

        await user.type(getInput('reference'), 'my-reference')
        await user.click(screen.getByTestId(CREATE_PAYMENT_CLOSE_BUTTON_TEST_ID))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN an invoice in the route', () => {
    describe('WHEN the page loads', () => {
      it('THEN should query the invoice and lock the combobox', () => {
        renderOnInvoiceRoute()

        expect(mockUseGetPayableInvoiceQuery).toHaveBeenCalledWith(
          expect.objectContaining({ variables: { id: 'invoice-1' }, skip: false }),
        )
        expect(getInput('invoiceId')).toBeDisabled()
      })
    })

    describe('WHEN submitting a valid form', () => {
      it('THEN should call the create mutation with the serialized amount', async () => {
        const user = setupUser()

        renderOnInvoiceRoute()

        await fillAndSubmit(user)

        await waitFor(() => {
          expect(mockCreatePayment).toHaveBeenCalledWith({
            variables: {
              input: {
                invoiceId: 'invoice-1',
                reference: 'my-reference',
                amountCents: 5000,
                createdAt: expect.any(String),
              },
            },
          })
        })
      })

      it('THEN should show a success toast and navigate to the payment', async () => {
        const user = setupUser()

        renderOnInvoiceRoute()

        await fillAndSubmit(user)

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })

    describe('WHEN pressing Enter while an input is focused', () => {
      it('THEN should submit the form', async () => {
        const user = setupUser()

        renderOnInvoiceRoute()

        await user.type(getInput('reference'), 'my-reference')
        await user.type(getInput('amountCents'), '50')

        getInput('reference').focus()
        await user.keyboard('{Enter}')

        await waitFor(() => {
          expect(mockCreatePayment).toHaveBeenCalled()
        })
      })
    })

    describe('WHEN the amount exceeds the invoice due amount', () => {
      it('THEN should display the max amount error and not call the mutation', async () => {
        const user = setupUser()

        renderOnInvoiceRoute()

        await fillAndSubmit(user, '150')

        await waitFor(() => {
          expect(screen.getByTestId('text-field-error')).toBeInTheDocument()
        })
        expect(mockCreatePayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the reference is longer than 40 characters', () => {
      it('THEN should not call the mutation', async () => {
        const user = setupUser()

        renderOnInvoiceRoute()

        await user.type(getInput('reference'), 'a'.repeat(41))
        await user.type(getInput('amountCents'), '50')
        await user.click(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        })
        expect(mockCreatePayment).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the invoice is a credit invoice', () => {
      beforeEach(() => {
        mockInvoiceQuery({ invoiceType: InvoiceTypeEnum.Credit })
      })

      it('THEN should prefill the full due amount and lock the amount input', async () => {
        renderOnInvoiceRoute()

        await waitFor(() => {
          expect(getInput('amountCents')).toHaveValue('100')
        })
        expect(getInput('amountCents')).toBeDisabled()
      })
    })

    describe('WHEN the mutation answers with field details', () => {
      it('THEN should keep the user on the form without a toast', async () => {
        const user = setupUser()

        mockCreatePayment.mockResolvedValue({
          data: undefined,
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: { code: 'unprocessable_entity', details: { reference: ['invalid'] } },
            },
          ],
        })

        renderOnInvoiceRoute()

        await fillAndSubmit(user)

        await waitFor(() => {
          expect(mockCreatePayment).toHaveBeenCalled()
        })
        expect(addToast).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        await waitFor(() => {
          expect(screen.getByTestId(CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        })
      })
    })
  })
})
