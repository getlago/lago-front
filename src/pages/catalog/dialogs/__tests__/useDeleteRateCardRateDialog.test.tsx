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
  DestroyRateCardRateDocument,
  RateCardRateForDeleteRateCardRateDialogFragment,
  RateCardRatesDocument,
} from '~/generated/graphql'

import {
  RATE_CARD_RATE_DELETE_SUCCESS_TOAST_KEY,
  useDeleteRateCardRateDialog,
} from '../useDeleteRateCardRateDialog'

configure({ testIdAttribute: 'data-test' })

// The confirm button never renders unless the modal is registered against its real NiceModal
// name, so mocking the hook would skip the dialog rendering entirely.
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

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-delete-rate-dialog'

const rateFixture: RateCardRateForDeleteRateCardRateDialogFragment = {
  id: 'rate-1',
  code: 'rate_01_24_2026',
}

const destroyMock = (
  result: Record<string, unknown> = { data: { destroyRateCardRate: { id: 'rate-1' } } },
): MockedResponse => ({
  request: { query: DestroyRateCardRateDocument, variables: { input: { id: 'rate-1' } } },
  result,
})

const TestComponent = ({ callback }: { callback?: () => void }) => {
  const { openDeleteRateCardRateDialog } = useDeleteRateCardRateDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() => openDeleteRateCardRateDialog({ rate: rateFixture, callback })}
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

const openAndConfirm = async () => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
  await userEvent.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
}

describe('useDeleteRateCardRateDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('GIVEN a pending rate', () => {
    describe('WHEN the delete dialog is opened', () => {
      it('THEN shows a confirm button', async () => {
        renderDialog([destroyMock()])

        await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))

        expect(
          await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the deletion is confirmed and succeeds', () => {
      it('THEN evicts the rate from the cached rates list', async () => {
        renderDialog([destroyMock()])

        await openAndConfirm()

        await waitFor(() =>
          expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
            id: 'rate-1',
            __typename: 'RateCardRate',
            listFieldName: 'rateCardRates',
            listQueryDocument: RateCardRatesDocument,
          }),
        )
      })

      it('THEN toasts a success', async () => {
        renderDialog([destroyMock()])

        await openAndConfirm()

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith({
            message: RATE_CARD_RATE_DELETE_SUCCESS_TOAST_KEY,
            severity: 'success',
          }),
        )
      })

      it('THEN runs the caller callback, so a details page can navigate away', async () => {
        const callback = jest.fn()

        renderDialog([destroyMock()], callback)

        await openAndConfirm()

        await waitFor(() => expect(callback).toHaveBeenCalledTimes(1))
      })
    })

    describe('WHEN the backend rejects the deletion', () => {
      it('THEN neither evicts, toasts nor runs the callback', async () => {
        const callback = jest.fn()

        renderDialog(
          [
            destroyMock({
              data: null,
              errors: [new GraphQLError('only_pending_rates_can_be_deleted')],
            }),
          ],
          callback,
        )

        await openAndConfirm()

        await waitFor(() => expect(evictFromCache).not.toHaveBeenCalled())
        expect(addToast).not.toHaveBeenCalled()
        expect(callback).not.toHaveBeenCalled()
      })
    })
  })
})
