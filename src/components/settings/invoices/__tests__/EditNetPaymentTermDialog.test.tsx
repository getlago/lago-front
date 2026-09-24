import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_NAME,
  FORM_DIALOG_TEST_ID,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { useEditNetPaymentTermDialog } from '~/components/settings/invoices/EditNetPaymentTermDialog'
import { UpdateBillingEntityNetPaymentTermDocument } from '~/generated/graphql'
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

const buildModel = (netPaymentTerm: number) => ({
  __typename: 'BillingEntity' as const,
  id: BILLING_ENTITY_ID,
  netPaymentTerm,
})

const TestComponent = ({ netPaymentTerm }: { netPaymentTerm: number }) => {
  const { openEditNetPaymentTermDialog } = useEditNetPaymentTermDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() =>
        openEditNetPaymentTermDialog({
          model: buildModel(netPaymentTerm),
          description: 'Net payment term',
        })
      }
    >
      Open Dialog
    </button>
  )
}

const getSubmitButton = () =>
  within(screen.getByTestId(FORM_DIALOG_TEST_ID)).getByRole('button', { name: /save edits/i })

const getCustomPeriodInput = () =>
  screen.getByTestId(FORM_DIALOG_TEST_ID).querySelector('input[name="customPeriod"]')

// `fireEvent.change` rather than `userEvent.type`: the field re-renders on every
// keystroke through `formatValue`, so a cached node goes stale mid-type.
const setCustomPeriod = async (value: string) => {
  await act(async () => {
    fireEvent.change(getCustomPeriodInput() as HTMLInputElement, { target: { value } })
  })
}

const buildMutationMock = (netPaymentTerm: number) => ({
  request: {
    query: UpdateBillingEntityNetPaymentTermDocument,
    variables: { input: { netPaymentTerm, id: BILLING_ENTITY_ID } },
  },
  result: {
    data: { updateBillingEntity: { id: BILLING_ENTITY_ID, netPaymentTerm } },
  },
})

async function prepare({
  netPaymentTerm = 45,
  mocks = [],
}: { netPaymentTerm?: number; mocks?: TestMocksType } = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent netPaymentTerm={netPaymentTerm} />
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

describe('EditNetPaymentTermDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN a model whose net payment term is not one of the presets', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN should seed the custom period input with the stringified value', async () => {
        await prepare({ netPaymentTerm: 45 })

        await waitFor(() => {
          expect(getCustomPeriodInput()).toHaveValue('45')
        })
      })
    })

    describe('WHEN the custom period is submitted unchanged', () => {
      it('THEN should send it as a number', async () => {
        const user = userEvent.setup()

        await prepare({ netPaymentTerm: 45, mocks: [buildMutationMock(45)] })

        await waitFor(() => {
          expect(getCustomPeriodInput()).toHaveValue('45')
        })

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })

    describe('WHEN the custom period is edited', () => {
      it('THEN should send the typed value as a number', async () => {
        const user = userEvent.setup()

        await prepare({ netPaymentTerm: 45, mocks: [buildMutationMock(12)] })

        await waitFor(() => {
          expect(getCustomPeriodInput()).toHaveValue('45')
        })

        await setCustomPeriod('12')

        await waitFor(() => {
          expect(getCustomPeriodInput()).toHaveValue('12')
        })

        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        })
      })
    })

    describe('WHEN the custom period is cleared', () => {
      it('THEN should keep the dialog open without calling the mutation', async () => {
        const user = userEvent.setup()

        await prepare({ netPaymentTerm: 45, mocks: [buildMutationMock(0)] })

        await waitFor(() => {
          expect(getCustomPeriodInput()).toHaveValue('45')
        })

        await setCustomPeriod('')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })

        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a model whose net payment term is a preset', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN should not render the custom period input', async () => {
        await prepare({ netPaymentTerm: 30 })

        expect(getCustomPeriodInput()).toBeNull()
      })
    })
  })
})
