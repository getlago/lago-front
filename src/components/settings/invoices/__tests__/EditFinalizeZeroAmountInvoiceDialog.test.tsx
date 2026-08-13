import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { DIALOG_TITLE_TEST_ID, FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import {
  EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment,
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID,
  useEditFinalizeZeroAmountInvoiceDialog,
} from '../EditFinalizeZeroAmountInvoiceDialog'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const mockUpdateCustomer = jest.fn()
const mockUpdateBillingEntity = jest.fn()

let customerCallbacks: { onCompleted?: (data: unknown) => void } = {}
let billingEntityCallbacks: { onCompleted?: (data: unknown) => void } = {}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateCustomerFinalizeZeroAmountInvoiceMutation: (options: typeof customerCallbacks) => {
    customerCallbacks = options
    return [mockUpdateCustomer, { loading: false }]
  },
  useUpdateBillingEntityFinalizeZeroAmountInvoiceMutation: (
    options: typeof billingEntityCallbacks,
  ) => {
    billingEntityCallbacks = options
    return [mockUpdateBillingEntity, { loading: false }]
  },
}))

const CUSTOMER_ID = 'customer-1'
const CUSTOMER_EXTERNAL_ID = 'customer-external-1'
const BILLING_ENTITY_ID = 'billing-entity-1'

const customerEntity: EditCustomerFinalizeZeroAmountInvoiceForDialogFragment = {
  __typename: 'Customer',
  id: CUSTOMER_ID,
  externalId: CUSTOMER_EXTERNAL_ID,
  name: 'Acme',
  finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Finalize,
}

const billingEntity: EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment = {
  __typename: 'BillingEntity',
  id: BILLING_ENTITY_ID,
  finalizeZeroAmountInvoice: true,
}

type OpenArgs = Parameters<
  ReturnType<
    typeof useEditFinalizeZeroAmountInvoiceDialog
  >['openEditFinalizeZeroAmountInvoiceDialog']
>[0]

function TestComponent({ openArgs }: { openArgs: OpenArgs }): ReactNode {
  const { openEditFinalizeZeroAmountInvoiceDialog } = useEditFinalizeZeroAmountInvoiceDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() => openEditFinalizeZeroAmountInvoiceDialog(openArgs)}
    >
      Open Dialog
    </button>
  )
}

async function renderAndOpenDialog(openArgs: OpenArgs): Promise<void> {
  await act(() =>
    render(
      <NiceModal.Provider>
        <TestComponent openArgs={openArgs} />
      </NiceModal.Provider>,
    ),
  )

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('EditFinalizeZeroAmountInvoiceDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    customerCallbacks = {}
    billingEntityCallbacks = {}
  })

  describe('Rendering', () => {
    it('renders the dialog title and the submit button when opened', async () => {
      await renderAndOpenDialog({
        entity: customerEntity,
        finalizeZeroAmountInvoice: customerEntity.finalizeZeroAmountInvoice,
      })

      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent(
        'text_17255383402002zmj6x02fx8',
      )
      expect(
        screen.getByTestId(EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID),
      ).toBeInTheDocument()
    })
  })

  describe('Submit for a customer entity', () => {
    it('calls the customer mutation with the expected input and shows a success toast', async () => {
      mockUpdateCustomer.mockImplementation(async () => {
        customerCallbacks.onCompleted?.({
          updateCustomer: { id: CUSTOMER_ID },
        })

        return { data: { updateCustomer: { id: CUSTOMER_ID } } }
      })

      await renderAndOpenDialog({
        entity: customerEntity,
        finalizeZeroAmountInvoice: customerEntity.finalizeZeroAmountInvoice,
      })

      await userEvent.click(
        screen.getByTestId(EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID),
      )

      await waitFor(() => {
        expect(mockUpdateCustomer).toHaveBeenCalledWith({
          variables: {
            input: {
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              name: 'Acme',
              finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Finalize,
            },
          },
        })
      })

      expect(mockUpdateBillingEntity).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
  })

  describe('Submit for a billing entity', () => {
    it('calls the billing entity mutation with a boolean value and shows a success toast', async () => {
      mockUpdateBillingEntity.mockImplementation(async () => {
        billingEntityCallbacks.onCompleted?.({
          updateBillingEntity: { id: BILLING_ENTITY_ID },
        })

        return { data: { updateBillingEntity: { id: BILLING_ENTITY_ID } } }
      })

      await renderAndOpenDialog({
        entity: billingEntity,
        finalizeZeroAmountInvoice: billingEntity.finalizeZeroAmountInvoice,
      })

      await userEvent.click(
        screen.getByTestId(EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID),
      )

      await waitFor(() => {
        expect(mockUpdateBillingEntity).toHaveBeenCalledWith({
          variables: {
            input: {
              id: BILLING_ENTITY_ID,
              finalizeZeroAmountInvoice: true,
            },
          },
        })
      })

      expect(mockUpdateCustomer).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
  })
})
