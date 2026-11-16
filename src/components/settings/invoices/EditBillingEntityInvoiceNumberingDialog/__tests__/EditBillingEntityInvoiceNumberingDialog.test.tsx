import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import {
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { useEditBillingEntityInvoiceNumberingDialog } from '~/components/settings/invoices/EditBillingEntityInvoiceNumberingDialog/EditBillingEntityInvoiceNumberingDialog'
import {
  BillingEntityDocumentNumberingEnum,
  UpdateBillingEntityInvoiceNumberingDocument,
} from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { EditBillingEntityInvoiceNumberingDialogData } from '../types'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const BILLING_ENTITY_ID = 'billing-entity-123'
const OPEN_BUTTON_TEST_ID = 'open-invoice-numbering-dialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const buildMutationMock = (
  documentNumbering: BillingEntityDocumentNumberingEnum,
  documentNumberPrefix: string,
) => ({
  request: {
    query: UpdateBillingEntityInvoiceNumberingDocument,
    variables: {
      input: { id: BILLING_ENTITY_ID, documentNumbering, documentNumberPrefix },
    },
  },
  result: {
    data: {
      updateBillingEntity: {
        id: BILLING_ENTITY_ID,
        documentNumbering,
        documentNumberPrefix,
      },
    },
  },
})

const Harness = ({ data }: { data: EditBillingEntityInvoiceNumberingDialogData }) => {
  const { openEditBillingEntityInvoiceNumberingDialog } =
    useEditBillingEntityInvoiceNumberingDialog()

  return (
    <button
      data-test={OPEN_BUTTON_TEST_ID}
      onClick={() => openEditBillingEntityInvoiceNumberingDialog(data)}
    >
      open
    </button>
  )
}

const getSubmitButton = () => document.querySelector('button[type="submit"]') as HTMLButtonElement
const getPrefixInput = () => screen.getAllByRole('textbox')[0]

// Pasted in one event: the preview subscription re-renders on every keystroke, and
// `user.type` loses characters to the element it remounts underneath.
const setPrefix = async (user: UserEvent, value: string): Promise<void> => {
  await user.clear(getPrefixInput())

  if (value) await user.paste(value)
}

// The design-system radio is read-only and renders its selection as a filled circle.
const isNumberingChecked = (value: BillingEntityDocumentNumberingEnum): boolean =>
  !!document
    .querySelector(`input[type="radio"][value="${value}"]`)
    ?.closest('label')
    ?.querySelector('circle[r="4"]')

async function prepare({
  data = {
    id: BILLING_ENTITY_ID,
    documentNumbering: BillingEntityDocumentNumberingEnum.PerCustomer,
    documentNumberPrefix: 'ACME',
  },
  mocks = [],
}: {
  data?: EditBillingEntityInvoiceNumberingDialogData
  mocks?: TestMocksType
} = {}) {
  const user = userEvent.setup()

  render(
    <NiceModal.Provider>
      <Harness data={data} />
    </NiceModal.Provider>,
    { mocks },
  )

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  await waitFor(() => {
    expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })

  return { user }
}

describe('useEditBillingEntityInvoiceNumberingDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN the billing entity carries a numbering setting', () => {
      it('THEN should seed the prefix and select the matching numbering option', async () => {
        await prepare({
          data: {
            id: BILLING_ENTITY_ID,
            documentNumbering: BillingEntityDocumentNumberingEnum.PerBillingEntity,
            documentNumberPrefix: 'LAGO',
          },
        })

        expect(getPrefixInput()).toHaveValue('LAGO')
        expect(isNumberingChecked(BillingEntityDocumentNumberingEnum.PerCustomer)).toBe(false)
        expect(isNumberingChecked(BillingEntityDocumentNumberingEnum.PerBillingEntity)).toBe(true)
      })
    })

    describe('WHEN the billing entity carries no numbering setting', () => {
      it('THEN should fall back to the per-customer default and an empty prefix', async () => {
        await prepare({ data: { id: BILLING_ENTITY_ID } })

        expect(getPrefixInput()).toHaveValue('')
        expect(isNumberingChecked(BillingEntityDocumentNumberingEnum.PerCustomer)).toBe(true)
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the prefix is longer than 10 characters', () => {
      it('THEN should keep the submit button disabled', async () => {
        const { user } = await prepare()

        await setPrefix(user, 'ABCDEFGHIJK')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })

    describe('WHEN the prefix is emptied', () => {
      it('THEN should keep the submit button disabled', async () => {
        const { user } = await prepare()

        await setPrefix(user, '')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })
  })

  describe('GIVEN the form submission', () => {
    describe('WHEN the user submits a valid prefix', () => {
      it('THEN should call the mutation with it and show a success toast', async () => {
        const { user } = await prepare({
          mocks: [buildMutationMock(BillingEntityDocumentNumberingEnum.PerCustomer, 'NEW')],
        })

        await setPrefix(user, 'NEW')

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

    describe('WHEN the user switches the numbering option', () => {
      it('THEN should submit the newly selected one', async () => {
        const { user } = await prepare({
          mocks: [buildMutationMock(BillingEntityDocumentNumberingEnum.PerBillingEntity, 'ACME')],
        })

        await user.click(screen.getAllByRole('radio')[1])

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the dialog is cancelled and reopened', () => {
      it('THEN should reset the form to the seeded values', async () => {
        const { user } = await prepare()

        await setPrefix(user, 'CHANGED')
        expect(getPrefixInput()).toHaveValue('CHANGED')

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(getPrefixInput()).toHaveValue('ACME')
        })
      })
    })
  })
})
