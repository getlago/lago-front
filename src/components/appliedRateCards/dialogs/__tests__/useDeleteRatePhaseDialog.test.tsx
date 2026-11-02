import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
  DIALOG_BODY_TEST_ID,
  DIALOG_TITLE_TEST_ID,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import { DestroyContractRatePhaseDocument, DestroyRatePhaseDocument } from '~/generated/graphql'

import { useDeleteRatePhaseDialog } from '../useDeleteRatePhaseDialog'

configure({ testIdAttribute: 'data-test' })

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-delete-rate-phase-dialog'
const APPLIED_RATE_CARD_ID = 'applied-1'
const PHASE = { code: 'ramp_up', name: 'Ramp up' }

const TestComponent = ({
  context,
  onDeleted,
}: {
  context: AppliedRateCardContext
  onDeleted?: () => void
}): JSX.Element => {
  const { openDeleteRatePhaseDialog } = useDeleteRatePhaseDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openDeleteRatePhaseDialog({
          context,
          appliedRateCardId: APPLIED_RATE_CARD_ID,
          phase: PHASE,
          onDeleted,
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
  onDeleted?: () => void,
): ReturnType<typeof render> =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent context={context} onDeleted={onDeleted} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

const openDialog = async (): Promise<void> => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
}

const openDialogAndConfirm = async (): Promise<void> => {
  await openDialog()
  await userEvent.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
}

describe('useDeleteRatePhaseDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('GIVEN a phase WHEN the dialog opens THEN shows a danger confirmation naming the phase', async () => {
    renderDialog('plan', [])

    await openDialog()

    const confirmButton = await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)

    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent(
      'text_1792504558237fi9a27bn0p2|Ramp up',
    )
    expect(screen.getByTestId(DIALOG_BODY_TEST_ID)).toHaveTextContent(
      'text_1792504558237qwb88fdpgp7',
    )
    expect(confirmButton).toHaveClass('button-danger')
    expect(confirmButton).toHaveTextContent('text_1791838459984x6zh06klebn')
  })

  it('GIVEN a plan phase WHEN the delete is confirmed THEN calls destroyRatePhase with the card id and code, and calls onDeleted', async () => {
    const onDeleted = jest.fn()

    renderDialog(
      'plan',
      [
        {
          request: {
            query: DestroyRatePhaseDocument,
            variables: {
              input: { planAppliedRateCardId: APPLIED_RATE_CARD_ID, code: PHASE.code },
            },
          },
          result: { data: { destroyRatePhase: { id: 'phase-1' } } },
        },
      ],
      onDeleted,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_179250455823726yiyqps1z3',
      severity: 'success',
    })
  })

  it('GIVEN a contract phase WHEN the delete is confirmed THEN calls destroyContractRatePhase', async () => {
    const onDeleted = jest.fn()

    renderDialog(
      'contract',
      [
        {
          request: {
            query: DestroyContractRatePhaseDocument,
            variables: {
              input: { contractAppliedRateCardId: APPLIED_RATE_CARD_ID, code: PHASE.code },
            },
          },
          result: { data: { destroyContractRatePhase: { id: 'phase-1' } } },
        },
      ],
      onDeleted,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_179250455823726yiyqps1z3',
      severity: 'success',
    })
  })

  it('GIVEN the mutation returns no payload THEN onDeleted is not called', async () => {
    const onDeleted = jest.fn()

    renderDialog(
      'plan',
      [
        {
          request: {
            query: DestroyRatePhaseDocument,
            variables: {
              input: { planAppliedRateCardId: APPLIED_RATE_CARD_ID, code: PHASE.code },
            },
          },
          result: {
            data: null,
            errors: [new GraphQLError('Cannot delete', { extensions: { code: 'forbidden' } })],
          },
        },
      ],
      onDeleted,
    )

    await openDialogAndConfirm()

    await waitFor(() => {
      expect(
        screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()
    })

    expect(onDeleted).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
