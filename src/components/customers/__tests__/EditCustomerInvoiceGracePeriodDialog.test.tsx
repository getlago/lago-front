import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { useEditCustomerInvoiceGracePeriodDialog } from '~/components/customers/EditCustomerInvoiceGracePeriodDialog'
import {
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { UpdateCustomerInvoiceGracePeriodDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const CUSTOMER_ID = 'customer-123'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const NiceModalWrapper = ({ children }: { children: ReactNode }) => (
  <NiceModal.Provider>{children}</NiceModal.Provider>
)

const TestComponent = ({
  invoiceGracePeriod,
}: {
  invoiceGracePeriod: number | undefined | null
}) => {
  const { openEditCustomerInvoiceGracePeriodDialog } = useEditCustomerInvoiceGracePeriodDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() =>
        openEditCustomerInvoiceGracePeriodDialog({
          customerId: CUSTOMER_ID,
          invoiceGracePeriod,
        })
      }
    >
      Open Dialog
    </button>
  )
}

const getSubmitButton = () =>
  within(screen.getByTestId(FORM_DIALOG_TEST_ID)).getByRole('button', {
    name: /grace period/i,
  })

async function prepare({
  invoiceGracePeriod,
  mocks = [],
}: {
  invoiceGracePeriod?: number | null
  mocks?: TestMocksType
} = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent invoiceGracePeriod={invoiceGracePeriod} />
      </NiceModalWrapper>,
      { mocks },
    ),
  )

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('EditCustomerInvoiceGracePeriodDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN rendered with default props', () => {
      it('THEN should display the dialog title', async () => {
        await prepare()

        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render cancel and submit buttons', async () => {
        await prepare()

        expect(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(getSubmitButton()).toBeInTheDocument()
      })
    })

    describe('WHEN invoiceGracePeriod has a value', () => {
      it('THEN should display the grace period value in the input', async () => {
        await prepare({ invoiceGracePeriod: 10 })

        expect(screen.getByRole('textbox')).toHaveValue('10')
      })
    })

    describe('WHEN invoiceGracePeriod is null', () => {
      it('THEN should display an empty input (placeholder shown)', async () => {
        await prepare({ invoiceGracePeriod: null })

        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })

    describe('WHEN invoiceGracePeriod is undefined', () => {
      it('THEN should display an empty input (placeholder shown)', async () => {
        await prepare({ invoiceGracePeriod: undefined })

        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the user changes the value to a valid number', () => {
      it('THEN should enable the submit button', async () => {
        const user = userEvent.setup()

        await prepare({ invoiceGracePeriod: 5 })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, '10')

        await waitFor(() => {
          expect(getSubmitButton()).not.toBeDisabled()
        })
      })
    })

    describe('WHEN the grace period exceeds 365 days', () => {
      it('THEN should keep the submit button disabled', async () => {
        const user = userEvent.setup()

        await prepare({ invoiceGracePeriod: 5 })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, '400')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })

    describe('WHEN the field is cleared (empty)', () => {
      it('THEN should keep the submit button enabled and submit 0', async () => {
        const user = userEvent.setup()
        const mutationMock = {
          request: {
            query: UpdateCustomerInvoiceGracePeriodDocument,
            variables: {
              input: {
                id: CUSTOMER_ID,
                invoiceGracePeriod: 0,
              },
            },
          },
          result: {
            data: {
              updateCustomerInvoiceGracePeriod: {
                id: CUSTOMER_ID,
                invoiceGracePeriod: 0,
              },
            },
          },
        }

        await prepare({ invoiceGracePeriod: 5, mocks: [mutationMock] })

        const input = screen.getByRole('textbox')

        await user.clear(input)

        await waitFor(() => {
          expect(getSubmitButton()).not.toBeDisabled()
        })

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })
  })

  describe('GIVEN the form submission', () => {
    describe('WHEN the user submits a valid grace period', () => {
      it('THEN should call the mutation with correct variables and show success toast', async () => {
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

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })
  })

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the cancel button is clicked', () => {
      it('THEN should close the dialog', async () => {
        const user = userEvent.setup()

        await prepare()

        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })
})
