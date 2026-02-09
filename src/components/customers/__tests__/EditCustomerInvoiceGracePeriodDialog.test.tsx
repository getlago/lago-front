import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import {
  EditCustomerInvoiceGracePeriodDialog,
  EditCustomerInvoiceGracePeriodDialogRef,
} from '~/components/customers/EditCustomerInvoiceGracePeriodDialog'
import { DialogRef } from '~/components/designSystem/Dialog'
import { UpdateCustomerInvoiceGracePeriodDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

const CUSTOMER_ID = 'customer-123'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ customerId: CUSTOMER_ID }),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

async function prepare({
  invoiceGracePeriod = 5,
  mocks = [],
}: {
  invoiceGracePeriod?: number | null
  mocks?: TestMocksType
} = {}) {
  const ref = createRef<EditCustomerInvoiceGracePeriodDialogRef>()

  await act(() =>
    render(
      <EditCustomerInvoiceGracePeriodDialog ref={ref} invoiceGracePeriod={invoiceGracePeriod} />,
      {
        mocks,
      },
    ),
  )

  // Open the dialog
  await act(() => {
    ref.current?.openDialog()
  })

  return { ref }
}

describe('EditCustomerInvoiceGracePeriodDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title and description', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
    })

    it('renders the input field with the initial grace period value', async () => {
      await prepare({ invoiceGracePeriod: 10 })

      const input = screen.getByRole('textbox')

      expect(input).toHaveValue('10')
    })

    it('renders with default value of 0 when invoiceGracePeriod is null', async () => {
      await prepare({ invoiceGracePeriod: null })

      const input = screen.getByRole('textbox')

      expect(input).toHaveValue('0')
    })

    it('renders with default value of 0 when invoiceGracePeriod is undefined', async () => {
      const ref = createRef<EditCustomerInvoiceGracePeriodDialogRef>()

      await act(() =>
        render(<EditCustomerInvoiceGracePeriodDialog ref={ref} invoiceGracePeriod={undefined} />),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      const input = screen.getByRole('textbox')

      expect(input).toHaveValue('0')
    })

    it('renders cancel and submit buttons', async () => {
      await prepare()

      const buttons = screen.getAllByRole('button')

      expect(buttons).toHaveLength(2)
    })
  })

  describe('Form Validation', () => {
    it('disables submit button when form is pristine', async () => {
      await prepare()

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[1]

      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when form value changes and is valid', async () => {
      const user = userEvent.setup()

      await prepare({ invoiceGracePeriod: 5 })

      const input = screen.getByRole('textbox')

      await user.clear(input)
      await user.type(input, '10')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[1]

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('shows error when grace period exceeds 365 days', async () => {
      const user = userEvent.setup()

      await prepare({ invoiceGracePeriod: 5 })

      const input = screen.getByRole('textbox')

      await user.clear(input)
      await user.type(input, '400')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[1]

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls mutation with correct variables on submit', async () => {
      const user = userEvent.setup()
      const mutationMock = {
        request: {
          query: UpdateCustomerInvoiceGracePeriodDocument,
          variables: {
            input: {
              id: CUSTOMER_ID,
              invoiceGracePeriod: 15,
            },
          },
        },
        result: {
          data: {
            updateCustomerInvoiceGracePeriod: {
              id: CUSTOMER_ID,
              invoiceGracePeriod: 15,
            },
          },
        },
      }

      await prepare({ invoiceGracePeriod: 5, mocks: [mutationMock] })

      const input = screen.getByRole('textbox')

      await user.clear(input)
      await user.type(input, '15')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[1]

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'success',
          translateKey: 'text_638dff9779fb99299bee914a',
        })
      })
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      const buttons = screen.getAllByRole('button')
      const cancelButton = buttons[0]

      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })

    it('resets form when dialog is closed', async () => {
      const user = userEvent.setup()
      const ref = createRef<DialogRef>()

      await act(() =>
        render(<EditCustomerInvoiceGracePeriodDialog ref={ref} invoiceGracePeriod={5} />),
      )

      // Open dialog
      await act(() => {
        ref.current?.openDialog()
      })

      const input = screen.getByRole('textbox')

      // Change value
      await user.clear(input)
      await user.type(input, '20')
      expect(input).toHaveValue('20')

      // Close dialog
      const buttons = screen.getAllByRole('button')
      const cancelButton = buttons[0]

      await user.click(cancelButton)

      // Reopen dialog
      await act(() => {
        ref.current?.openDialog()
      })

      // Value should be reset to initial
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('5')
      })
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<DialogRef>()

      await act(() =>
        render(<EditCustomerInvoiceGracePeriodDialog ref={ref} invoiceGracePeriod={5} />),
      )

      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog()
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    it('exposes closeDialog method via ref', async () => {
      const ref = createRef<DialogRef>()

      await act(() =>
        render(<EditCustomerInvoiceGracePeriodDialog ref={ref} invoiceGracePeriod={5} />),
      )

      await act(() => {
        ref.current?.openDialog()
      })

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })
  })
})
