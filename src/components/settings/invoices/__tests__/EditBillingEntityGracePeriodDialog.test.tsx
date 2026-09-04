import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { useEditBillingEntityGracePeriodDialog } from '~/components/settings/invoices/EditBillingEntityGracePeriodDialog'
import { UpdateBillingEntityGracePeriodDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const BILLING_ENTITY_ID = 'billing-entity-123'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const NiceModalWrapper = ({ children }: { children: ReactNode }) => (
  <NiceModal.Provider>{children}</NiceModal.Provider>
)

const TestComponent = ({ invoiceGracePeriod }: { invoiceGracePeriod: number }) => {
  const { openEditBillingEntityGracePeriodDialog } = useEditBillingEntityGracePeriodDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() =>
        openEditBillingEntityGracePeriodDialog({ id: BILLING_ENTITY_ID, invoiceGracePeriod })
      }
    >
      Open Dialog
    </button>
  )
}

const getSubmitButton = () =>
  within(screen.getByTestId(FORM_DIALOG_TEST_ID)).getByRole('button', { name: /save edits/i })

const buildMutationMock = (invoiceGracePeriod: number) => ({
  request: {
    query: UpdateBillingEntityGracePeriodDocument,
    variables: {
      input: { id: BILLING_ENTITY_ID, billingConfiguration: { invoiceGracePeriod } },
    },
  },
  result: {
    data: {
      updateBillingEntity: {
        id: BILLING_ENTITY_ID,
        billingConfiguration: { id: 'config-1', invoiceGracePeriod },
      },
    },
  },
})

async function prepare({
  invoiceGracePeriod = 5,
  mocks = [],
}: { invoiceGracePeriod?: number; mocks?: TestMocksType } = {}) {
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

describe('EditBillingEntityGracePeriodDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the dialog is opened', () => {
    describe('WHEN a grace period is seeded', () => {
      it('THEN should display it in the input', async () => {
        await prepare({ invoiceGracePeriod: 10 })

        expect(screen.getByRole('textbox')).toHaveValue('10')
      })
    })

    describe('WHEN the seeded grace period is 0', () => {
      it('THEN should display 0 rather than an empty input', async () => {
        await prepare({ invoiceGracePeriod: 0 })

        expect(screen.getByRole('textbox')).toHaveValue('0')
      })
    })
  })

  describe('GIVEN the form validation', () => {
    describe('WHEN the grace period exceeds 365 days', () => {
      it('THEN should keep the submit button disabled', async () => {
        const user = userEvent.setup()

        await prepare()

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, '400')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })
      })
    })

    describe('WHEN the grace period is exactly 365 days', () => {
      it('THEN should submit it', async () => {
        const user = userEvent.setup()

        await prepare({ mocks: [buildMutationMock(365)] })

        const input = screen.getByRole('textbox')

        await user.clear(input)
        await user.type(input, '365')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })

    describe('WHEN the field is cleared', () => {
      it('THEN should submit 0', async () => {
        const user = userEvent.setup()

        await prepare({ mocks: [buildMutationMock(0)] })

        await user.clear(screen.getByRole('textbox'))

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

  describe('GIVEN the dialog actions', () => {
    describe('WHEN the cancel button is clicked', () => {
      it('THEN should close the dialog', async () => {
        const user = userEvent.setup()

        await prepare()

        await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })
})
