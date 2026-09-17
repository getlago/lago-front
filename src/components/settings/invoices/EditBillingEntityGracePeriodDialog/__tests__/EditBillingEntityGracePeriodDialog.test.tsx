import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import {
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { useEditBillingEntityGracePeriodDialog } from '~/components/settings/invoices/EditBillingEntityGracePeriodDialog/EditBillingEntityGracePeriodDialog'
import { UpdateBillingEntityGracePeriodDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const BILLING_ENTITY_ID = 'billing-entity-123'
const BILLING_CONFIGURATION_ID = 'billing-configuration-1'
const OPEN_BUTTON_TEST_ID = 'open-grace-period-dialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const buildMutationMock = (invoiceGracePeriod: number) => ({
  request: {
    query: UpdateBillingEntityGracePeriodDocument,
    variables: {
      input: {
        id: BILLING_ENTITY_ID,
        billingConfiguration: { invoiceGracePeriod },
      },
    },
  },
  result: {
    data: {
      updateBillingEntity: {
        id: BILLING_ENTITY_ID,
        billingConfiguration: {
          id: BILLING_CONFIGURATION_ID,
          invoiceGracePeriod,
        },
      },
    },
  },
})

const Harness = ({ invoiceGracePeriod }: { invoiceGracePeriod: number }) => {
  const { openEditBillingEntityGracePeriodDialog } = useEditBillingEntityGracePeriodDialog()

  return (
    <button
      data-test={OPEN_BUTTON_TEST_ID}
      onClick={() =>
        openEditBillingEntityGracePeriodDialog({ id: BILLING_ENTITY_ID, invoiceGracePeriod })
      }
    >
      open
    </button>
  )
}

const getSubmitButton = () => document.querySelector('button[type="submit"]') as HTMLButtonElement

const setGracePeriod = async (user: UserEvent, value: string): Promise<void> => {
  await user.clear(screen.getByRole('textbox'))
  await user.paste(value)
}

async function prepare({
  invoiceGracePeriod = 10,
  mocks = [],
}: {
  invoiceGracePeriod?: number
  mocks?: TestMocksType
} = {}) {
  const user = userEvent.setup()

  render(
    <NiceModal.Provider>
      <Harness invoiceGracePeriod={invoiceGracePeriod} />
    </NiceModal.Provider>,
    { mocks },
  )

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  await waitFor(() => {
    expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })

  return { user }
}

describe('useEditBillingEntityGracePeriodDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN the billing entity already has a grace period', () => {
      it('THEN should seed the input with it', async () => {
        await prepare({ invoiceGracePeriod: 42 })

        expect(screen.getByRole('textbox')).toHaveValue('42')
      })
    })

    describe('WHEN rendered', () => {
      it('THEN should focus the input and render both actions', async () => {
        await prepare()

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toHaveFocus()
        })
        expect(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(getSubmitButton()).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the grace period exceeds 365 days', () => {
      it('THEN should keep the submit button disabled', async () => {
        const { user } = await prepare()

        await setGracePeriod(user, '400')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })
  })

  describe('GIVEN the form submission', () => {
    describe('WHEN the user submits a valid grace period', () => {
      it('THEN should call the mutation with it and show a success toast', async () => {
        const { user } = await prepare({
          invoiceGracePeriod: 10,
          mocks: [buildMutationMock(30)],
        })

        await setGracePeriod(user, '30')

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })

      it('THEN should close the dialog on success', async () => {
        const { user } = await prepare({
          invoiceGracePeriod: 10,
          mocks: [buildMutationMock(10)],
        })

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the dialog is cancelled and reopened', () => {
      it('THEN should reset the form to the seeded value', async () => {
        const { user } = await prepare({ invoiceGracePeriod: 7 })

        await setGracePeriod(user, '21')
        expect(screen.getByRole('textbox')).toHaveValue('21')

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toHaveValue('7')
        })
      })
    })
  })
})
