import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { FORM_DIALOG_NAME, FORM_DIALOG_TEST_ID } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { addToast } from '~/core/apolloClient'
import {
  UpdateContractAppliedRateCardDocument,
  UpdatePlanAppliedRateCardDocument,
} from '~/generated/graphql'

import {
  EDIT_APPLIED_RATE_CARD_UNITS_INPUT_TEST_ID,
  EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID,
  useEditAppliedRateCardUnitsDialog,
} from '../useEditAppliedRateCardUnitsDialog'

configure({ testIdAttribute: 'data-test' })

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const APPLIED_RATE_CARD_ID = 'applied-1'
const OPEN_DIALOG_BUTTON_TEST_ID = 'open-edit-applied-rate-card-units-dialog'

const TestComponent = ({
  context,
  units,
}: {
  context: AppliedRateCardContext
  units: number | null
}): JSX.Element => {
  const { openEditAppliedRateCardUnitsDialog } = useEditAppliedRateCardUnitsDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openEditAppliedRateCardUnitsDialog({
          context,
          appliedRateCardId: APPLIED_RATE_CARD_ID,
          units,
        })
      }
    >
      open
    </button>
  )
}

const renderDialog = (
  context: AppliedRateCardContext,
  mocks: MockedResponse[],
  units: number | null = 12,
): ReturnType<typeof render> =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent context={context} units={units} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

const getUnitsInput = (): HTMLInputElement =>
  screen
    .getByTestId(EDIT_APPLIED_RATE_CARD_UNITS_INPUT_TEST_ID)
    .querySelector('input') as HTMLInputElement

const openDialog = async (): Promise<HTMLInputElement> => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
  await screen.findByTestId(EDIT_APPLIED_RATE_CARD_UNITS_INPUT_TEST_ID)

  return getUnitsInput()
}

const buildMock = (context: AppliedRateCardContext, units: number): MockedResponse => {
  const variables = { input: { id: APPLIED_RATE_CARD_ID, units } }

  if (context === 'plan') {
    return {
      request: { query: UpdatePlanAppliedRateCardDocument, variables },
      result: { data: { updatePlanAppliedRateCard: { id: APPLIED_RATE_CARD_ID, units } } },
    }
  }

  return {
    request: { query: UpdateContractAppliedRateCardDocument, variables },
    result: { data: { updateContractAppliedRateCard: { id: APPLIED_RATE_CARD_ID, units } } },
  }
}

describe('useEditAppliedRateCardUnitsDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN an applied rate card', () => {
    describe('WHEN the dialog opens', () => {
      it('THEN seeds the input with the current units', async () => {
        renderDialog('plan', [])

        expect(await openDialog()).toHaveValue('12')
      })

      it('THEN starts empty when the card has no units yet', async () => {
        renderDialog('plan', [], null)

        expect(await openDialog()).toHaveValue('')
      })
    })
  })

  describe.each<{ context: AppliedRateCardContext }>([
    { context: 'plan' },
    { context: 'contract' },
  ])('GIVEN a $context applied rate card', ({ context }) => {
    describe('WHEN a new value is submitted', () => {
      it('THEN sends the units as a number and toasts the success', async () => {
        renderDialog(context, [buildMock(context, 25)])

        const input = await openDialog()

        await userEvent.clear(input)
        await userEvent.type(input, '25')
        await userEvent.click(screen.getByTestId(EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID))

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' })),
        )
      })
    })
  })

  describe('GIVEN the units field is emptied', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN keeps the dialog open and sends nothing', async () => {
        renderDialog('plan', [])

        const input = await openDialog()

        await userEvent.clear(input)
        await userEvent.click(screen.getByTestId(EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID))

        await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
        expect(addToast).not.toHaveBeenCalled()
        expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the mutation fails', () => {
    describe('WHEN the API answers with a GraphQL error', () => {
      // `errorLink` already toasts a GraphQL error: a second toast here would double it.
      it('THEN keeps the dialog open without toasting', async () => {
        renderDialog('plan', [
          {
            request: {
              query: UpdatePlanAppliedRateCardDocument,
              variables: { input: { id: APPLIED_RATE_CARD_ID, units: 25 } },
            },
            result: {
              data: { updatePlanAppliedRateCard: null },
              errors: [new GraphQLError('plan_locked')],
            },
          },
        ])

        const input = await openDialog()

        await userEvent.clear(input)
        await userEvent.type(input, '25')
        await userEvent.click(screen.getByTestId(EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID))

        await waitFor(() => expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument())
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN toasts the failure and keeps the dialog open', async () => {
        renderDialog('plan', [
          {
            request: {
              query: UpdatePlanAppliedRateCardDocument,
              variables: { input: { id: APPLIED_RATE_CARD_ID, units: 25 } },
            },
            error: new Error('network down'),
          },
        ])

        const input = await openDialog()

        await userEvent.clear(input)
        await userEvent.type(input, '25')
        await userEvent.click(screen.getByTestId(EDIT_APPLIED_RATE_CARD_UNITS_SAVE_TEST_ID))

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' })),
        )
        expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
