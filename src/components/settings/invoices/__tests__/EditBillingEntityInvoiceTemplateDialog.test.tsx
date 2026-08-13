import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { useEditBillingEntityInvoiceTemplateDialog } from '~/components/settings/invoices/EditBillingEntityInvoiceTemplateDialog'
import { UpdateBillingEntityInvoiceTemplateDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const BILLING_ENTITY_ID = 'billing-entity-123'
const OPEN_BUTTON_TEST_ID = 'open-invoice-template-dialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const Harness = ({ invoiceFooter }: { invoiceFooter: string }) => {
  const { openEditBillingEntityInvoiceTemplateDialog } = useEditBillingEntityInvoiceTemplateDialog()

  return (
    <button
      data-test={OPEN_BUTTON_TEST_ID}
      onClick={() =>
        openEditBillingEntityInvoiceTemplateDialog({ id: BILLING_ENTITY_ID, invoiceFooter })
      }
    >
      open
    </button>
  )
}

const renderHarness = ({
  invoiceFooter = 'Default footer',
  mocks = [],
}: {
  invoiceFooter?: string
  mocks?: TestMocksType
} = {}) =>
  render(
    <NiceModal.Provider>
      <Harness invoiceFooter={invoiceFooter} />
    </NiceModal.Provider>,
    { mocks },
  )

const getSubmitButton = () => document.querySelector('button[type="submit"]') as HTMLButtonElement

async function prepare({
  invoiceFooter,
  mocks,
}: {
  invoiceFooter?: string
  mocks?: TestMocksType
} = {}) {
  const user = userEvent.setup()

  renderHarness({ invoiceFooter, mocks })

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  await waitFor(() => {
    expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })

  return { user }
}

describe('useEditBillingEntityInvoiceTemplateDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN rendered with default data', () => {
      it('THEN should display the form dialog with the footer input', async () => {
        await prepare()

        expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })

      it('THEN should focus the footer input', async () => {
        await prepare()

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toHaveFocus()
        })
      })

      it('THEN should render cancel and submit buttons', async () => {
        await prepare()

        expect(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(getSubmitButton()).toBeInTheDocument()
      })
    })

    describe('WHEN invoiceFooter has a value', () => {
      it('THEN should display the footer value in the input', async () => {
        await prepare({ invoiceFooter: 'Some legal text' })

        expect(screen.getByRole('textbox')).toHaveValue('Some legal text')
      })
    })

    describe('WHEN invoiceFooter is empty', () => {
      it('THEN should display an empty input', async () => {
        await prepare({ invoiceFooter: '' })

        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the footer exceeds 600 characters', () => {
      it('THEN should keep the submit button disabled', async () => {
        const { user } = await prepare({ invoiceFooter: 'short footer' })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.paste('a'.repeat(601))

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })

    describe('WHEN the footer is within the 600 character limit', () => {
      it('THEN should enable the submit button', async () => {
        const { user } = await prepare({ invoiceFooter: 'short footer' })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, 'a valid updated footer')

        await waitFor(() => {
          expect(getSubmitButton()).not.toBeDisabled()
        })
      })
    })
  })

  describe('GIVEN the form submission', () => {
    describe('WHEN the user submits a valid footer', () => {
      it('THEN should call the mutation with correct variables and show success toast', async () => {
        const mutationMock = {
          request: {
            query: UpdateBillingEntityInvoiceTemplateDocument,
            variables: {
              input: {
                id: BILLING_ENTITY_ID,
                billingConfiguration: {
                  invoiceFooter: 'a new footer',
                },
              },
            },
          },
          result: {
            data: {
              updateBillingEntity: {
                id: BILLING_ENTITY_ID,
                billingConfiguration: {
                  id: 'billing-configuration-1',
                  invoiceFooter: 'a new footer',
                },
              },
            },
          },
        }

        const { user } = await prepare({ invoiceFooter: 'short footer', mocks: [mutationMock] })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, 'a new footer')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })

      it('THEN should close the dialog on success', async () => {
        const mutationMock = {
          request: {
            query: UpdateBillingEntityInvoiceTemplateDocument,
            variables: {
              input: {
                id: BILLING_ENTITY_ID,
                billingConfiguration: {
                  invoiceFooter: 'short footer',
                },
              },
            },
          },
          result: {
            data: {
              updateBillingEntity: {
                id: BILLING_ENTITY_ID,
                billingConfiguration: {
                  id: 'billing-configuration-1',
                  invoiceFooter: 'short footer',
                },
              },
            },
          },
        }

        const { user } = await prepare({ invoiceFooter: 'short footer', mocks: [mutationMock] })

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the cancel button is clicked', () => {
      it('THEN should close the dialog', async () => {
        const { user } = await prepare()

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN the dialog is closed and reopened', () => {
      it('THEN should reset the form to its initial value', async () => {
        const { user } = await prepare({ invoiceFooter: 'initial footer' })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, 'a changed footer')
        expect(input).toHaveValue('a changed footer')

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toHaveValue('initial footer')
        })
      })
    })
  })
})
