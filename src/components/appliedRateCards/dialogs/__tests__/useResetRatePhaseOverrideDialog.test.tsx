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
import { UpdateContractRatePhaseDocument, UpdateRatePhaseDocument } from '~/generated/graphql'

import { useResetRatePhaseOverrideDialog } from '../useResetRatePhaseOverrideDialog'

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

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-reset-rate-phase-override-dialog'
const APPLIED_RATE_CARD_ID = 'applied-1'
const PHASE = { code: 'ramp_up', name: 'Ramp up' }

const TestComponent = ({ context }: { context: AppliedRateCardContext }): JSX.Element => {
  const { openResetRatePhaseOverrideDialog } = useResetRatePhaseOverrideDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openResetRatePhaseOverrideDialog({
          context,
          appliedRateCardId: APPLIED_RATE_CARD_ID,
          phase: PHASE,
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
): ReturnType<typeof render> =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent context={context} />
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

describe('useResetRatePhaseOverrideDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('GIVEN a phase WHEN the dialog opens THEN shows a danger confirmation naming the phase', async () => {
    renderDialog('plan', [])

    await openDialog()

    const confirmButton = await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)

    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent(
      'text_1792504558237e30tbqnye82|Ramp up',
    )
    expect(screen.getByTestId(DIALOG_BODY_TEST_ID)).toHaveTextContent(
      'text_1792504558237c76cown33ob',
    )
    expect(confirmButton).toHaveClass('button-danger')
    expect(confirmButton).toHaveTextContent('text_179250455823743gk265fc61')
  })

  it('GIVEN a plan phase WHEN the reset is confirmed THEN calls updateRatePhase with rateOverride null', async () => {
    renderDialog('plan', [
      {
        request: {
          query: UpdateRatePhaseDocument,
          variables: {
            input: {
              planAppliedRateCardId: APPLIED_RATE_CARD_ID,
              code: PHASE.code,
              rateOverride: null,
            },
          },
        },
        result: { data: { updateRatePhase: { id: 'phase-1', code: PHASE.code } } },
      },
    ])

    await openDialogAndConfirm()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        message: 'text_17925045582370oiauno9u9a',
        severity: 'success',
      }),
    )
  })

  it('GIVEN a contract phase WHEN the reset is confirmed THEN calls updateContractRatePhase with rateOverride null', async () => {
    renderDialog('contract', [
      {
        request: {
          query: UpdateContractRatePhaseDocument,
          variables: {
            input: {
              contractAppliedRateCardId: APPLIED_RATE_CARD_ID,
              code: PHASE.code,
              rateOverride: null,
            },
          },
        },
        result: { data: { updateContractRatePhase: { id: 'phase-1', code: PHASE.code } } },
      },
    ])

    await openDialogAndConfirm()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        message: 'text_17925045582370oiauno9u9a',
        severity: 'success',
      }),
    )
  })

  it('GIVEN the mutation returns no payload THEN no success toast is shown', async () => {
    renderDialog('plan', [
      {
        request: {
          query: UpdateRatePhaseDocument,
          variables: {
            input: {
              planAppliedRateCardId: APPLIED_RATE_CARD_ID,
              code: PHASE.code,
              rateOverride: null,
            },
          },
        },
        result: {
          data: null,
          errors: [new GraphQLError('Cannot reset', { extensions: { code: 'forbidden' } })],
        },
      },
    ])

    await openDialogAndConfirm()

    await waitFor(() => {
      expect(
        screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()
    })

    expect(addToast).not.toHaveBeenCalled()
  })
})
