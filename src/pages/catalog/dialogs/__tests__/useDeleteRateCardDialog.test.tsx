import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DestroyRateCardDocument,
  GetRateCardsForProductDetailsDocument,
  GetRateCardsForProductFilterDetailsDocument,
  RateCardForDeleteRateCardDialogFragment,
  RateCardsDocument,
} from '~/generated/graphql'

import {
  RATE_CARD_DELETE_DIALOG_DESCRIPTION_KEY,
  RATE_CARD_DELETE_DIALOG_TITLE_KEY,
  RATE_CARD_DELETE_SUCCESS_TOAST_KEY,
  useDeleteRateCardDialog,
} from '../useDeleteRateCardDialog'

configure({ testIdAttribute: 'data-test' })

// Register the dialog against the real NiceModal name: a CentralizedDialog's
// confirm button never renders unless the modal is registered, so mocking
// useCentralizedDialog would only exercise the hook callback, not the actual
// dialog rendering + confirm wiring.
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-delete-rate-card-dialog'

const rateCardFixture: RateCardForDeleteRateCardDialogFragment = {
  id: 'rate-card-1',
  name: 'Enterprise plan',
}

const TestComponent = ({ callback }: { callback?: () => void }) => {
  const { openDeleteRateCardDialog } = useDeleteRateCardDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openDeleteRateCardDialog({
          rateCard: rateCardFixture,
          callback,
        })
      }
    >
      open
    </button>
  )
}

const renderDialog = (mocks: MockedResponse[] = [], callback?: () => void) =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent callback={callback} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

const destroyRateCardMock = (
  result: MockedResponse['result'],
  onVariables?: (vars: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: DestroyRateCardDocument },
  variableMatcher: (vars) => {
    onVariables?.(vars)
    return vars?.input?.id === 'rate-card-1'
  },
  result,
})

const openDialogAndConfirm = async () => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
  await userEvent.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
}

describe('useDeleteRateCardDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('opens a danger dialog naming the rate card with a real confirm button', async () => {
    renderDialog()

    await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))

    const confirmButton = await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)

    expect(
      screen.getByText(`${RATE_CARD_DELETE_DIALOG_TITLE_KEY}|Enterprise plan`),
    ).toBeInTheDocument()
    expect(screen.getByText(RATE_CARD_DELETE_DIALOG_DESCRIPTION_KEY)).toBeInTheDocument()
    expect(confirmButton).toHaveClass('button-danger')
    expect(confirmButton).toHaveTextContent('text_63ea0f84f400488553caa786')
  })

  it('destroys the rate card, runs the callback and toasts', async () => {
    const callback = jest.fn()
    const capturedVariables = jest.fn()

    renderDialog(
      [
        destroyRateCardMock(
          { data: { destroyRateCard: { id: 'rate-card-1' } } },
          capturedVariables,
        ),
      ],
      callback,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1))

    expect(capturedVariables).toHaveBeenCalledWith({ input: { id: 'rate-card-1' } })
    expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
      id: 'rate-card-1',
      __typename: 'RateCard',
      listFieldName: 'rateCards',
      listQueryDocument: [
        RateCardsDocument,
        GetRateCardsForProductDetailsDocument,
        GetRateCardsForProductFilterDetailsDocument,
      ],
    })
    expect(addToast).toHaveBeenCalledWith({
      message: RATE_CARD_DELETE_SUCCESS_TOAST_KEY,
      severity: 'success',
    })
  })

  it('does nothing beyond the mutation when the backend rejects the delete', async () => {
    const callback = jest.fn()

    renderDialog(
      [
        destroyRateCardMock({
          data: null,
          errors: [new GraphQLError('Cannot delete', { extensions: { code: 'forbidden' } })],
        }),
      ],
      callback,
    )

    await openDialogAndConfirm()

    await waitFor(() => {
      expect(
        screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()
    })

    expect(evictFromCache).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
