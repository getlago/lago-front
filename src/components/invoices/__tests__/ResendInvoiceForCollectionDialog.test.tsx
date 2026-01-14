import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'

import { render } from '~/test-utils'

import {
  RESEND_INVOICE_FOR_COLLECTION_DIALOG_CANCEL_BUTTON_TEST_ID,
  RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID,
  ResendInvoiceForCollectionDialog,
  ResendInvoiceForCollectionDialogRef,
} from '../ResendInvoiceForCollectionDialog'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockRetryInvoicePayment = jest.fn()
const mockAddToast = jest.fn()
const mockHasDefinedGQLError = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
  envGlobalVar: () => ({ appEnv: 'test' }),
}))

let retryMutationCallbacks: {
  onCompleted?: (data: { retryInvoicePayment: { id: string } | null }) => void
} = {}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useRetryInvoicePaymentMutation: (options: typeof retryMutationCallbacks) => {
    retryMutationCallbacks = options
    return [mockRetryInvoicePayment, { loading: false }]
  },
}))

jest.mock('~/components/paymentMethodSelection/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: jest.fn(({ setSelectedPaymentMethod }) => (
    <div data-test="payment-method-combobox">
      <button
        data-test="select-payment-method"
        onClick={() =>
          setSelectedPaymentMethod({
            paymentMethodId: 'pm_123',
            paymentMethodType: 'card',
          })
        }
      >
        Select Payment Method
      </button>
    </div>
  )),
}))

const mockInvoice = {
  id: 'invoice-123',
  number: 'INV-001',
  customer: {
    id: 'customer-123',
    externalId: 'ext-customer-123',
  },
}

function TestWrapper() {
  const dialogRef = useRef<ResendInvoiceForCollectionDialogRef>(null)

  return (
    <>
      <button
        data-test="open-dialog"
        onClick={() => dialogRef.current?.openDialog({ invoice: mockInvoice })}
      >
        Open Dialog
      </button>
      <ResendInvoiceForCollectionDialog ref={dialogRef} />
    </>
  )
}

async function renderAndOpenDialog() {
  const utils = render(<TestWrapper />)

  const openButton = screen.getByTestId('open-dialog')

  await act(async () => {
    await userEvent.click(openButton)
  })

  await waitFor(() => {
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
  })

  return utils
}

describe('ResendInvoiceForCollectionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRetryInvoicePayment.mockResolvedValue({ errors: null })
    mockHasDefinedGQLError.mockReturnValue(false)
  })

  describe('Rendering', () => {
    it('renders dialog with title and description when opened', async () => {
      await renderAndOpenDialog()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
    })

    it('renders payment method combobox', async () => {
      await renderAndOpenDialog()

      expect(screen.getByTestId('payment-method-combobox')).toBeInTheDocument()
    })

    it('renders cancel button', async () => {
      await renderAndOpenDialog()

      expect(
        screen.getByTestId(RESEND_INVOICE_FOR_COLLECTION_DIALOG_CANCEL_BUTTON_TEST_ID),
      ).toBeInTheDocument()
    })

    it('renders resend for collection button', async () => {
      await renderAndOpenDialog()

      expect(
        screen.getByTestId(RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID),
      ).toBeInTheDocument()
    })
  })

  describe('Submit Behavior', () => {
    it('calls mutation without paymentMethod when none selected', async () => {
      await renderAndOpenDialog()

      const resendButton = screen.getByTestId(
        RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID,
      )

      await userEvent.click(resendButton)

      await waitFor(() => {
        expect(mockRetryInvoicePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'invoice-123',
            },
          },
        })
      })
    })

    it('calls mutation with paymentMethod when selected', async () => {
      await renderAndOpenDialog()

      // Select a payment method
      const selectButton = screen.getByTestId('select-payment-method')

      await userEvent.click(selectButton)

      const resendButton = screen.getByTestId(
        RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID,
      )

      await userEvent.click(resendButton)

      await waitFor(() => {
        expect(mockRetryInvoicePayment).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'invoice-123',
              paymentMethod: {
                paymentMethodId: 'pm_123',
                paymentMethodType: 'card',
              },
            },
          },
        })
      })
    })

    it('shows success toast when mutation completes successfully', async () => {
      await renderAndOpenDialog()

      // Trigger the onCompleted callback
      retryMutationCallbacks.onCompleted?.({
        retryInvoicePayment: { id: 'payment-123' },
      })

      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('does not show success toast when mutation returns null', async () => {
      await renderAndOpenDialog()

      retryMutationCallbacks.onCompleted?.({
        retryInvoicePayment: null,
      })

      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('shows info toast when PaymentProcessorIsCurrentlyHandlingPayment error occurs', async () => {
      mockHasDefinedGQLError.mockReturnValue(true)
      mockRetryInvoicePayment.mockResolvedValue({
        errors: [{ extensions: { code: 'PaymentProcessorIsCurrentlyHandlingPayment' } }],
      })

      await renderAndOpenDialog()

      const resendButton = screen.getByTestId(
        RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID,
      )

      await userEvent.click(resendButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
      })
    })
  })

  describe('Dialog Close Behavior', () => {
    it('closes dialog when cancel button is clicked', async () => {
      await renderAndOpenDialog()

      const cancelButton = screen.getByTestId(
        RESEND_INVOICE_FOR_COLLECTION_DIALOG_CANCEL_BUTTON_TEST_ID,
      )

      await userEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })

    it('closes dialog after successful submission', async () => {
      await renderAndOpenDialog()

      const resendButton = screen.getByTestId(
        RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID,
      )

      await userEvent.click(resendButton)

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })
  })
})
