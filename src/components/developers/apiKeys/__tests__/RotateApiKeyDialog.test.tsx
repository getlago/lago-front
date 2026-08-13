import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { ROTATE_API_KEY_DIALOG_SUBMIT_BUTTON_TEST_ID } from '~/components/developers/apiKeys/dataTestConstants'
import { useRotateApiKeyDialog } from '~/components/developers/apiKeys/RotateApiKeyDialog'
import { DIALOG_TITLE_TEST_ID, FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { ApiKeyForRotateApiKeyDialogFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const mockRotate = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useRotateApiKeyMutation: () => [mockRotate],
}))

const apiKey: ApiKeyForRotateApiKeyDialogFragment = {
  __typename: 'SanitizedApiKey',
  id: 'api-key-1',
  name: 'My API Key',
  lastUsedAt: null,
}

const OPEN_BUTTON_TEST_ID = 'open-rotate-api-key-dialog'

const NiceModalWrapper = ({ children }: { children: ReactNode }) => (
  <NiceModal.Provider>{children}</NiceModal.Provider>
)

const Harness = () => {
  const { openRotateApiKeyDialog } = useRotateApiKeyDialog()

  return (
    <button
      data-test={OPEN_BUTTON_TEST_ID}
      onClick={() =>
        openRotateApiKeyDialog({
          apiKey,
          callBack: jest.fn(),
          openPremiumDialog: jest.fn(),
        })
      }
    >
      open
    </button>
  )
}

async function prepare() {
  await act(() =>
    render(
      <NiceModalWrapper>
        <Harness />
      </NiceModalWrapper>,
    ),
  )

  await act(async () => {
    screen.getByTestId(OPEN_BUTTON_TEST_ID).click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('RotateApiKeyDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the "Now" (immediate) expiration option', () => {
    describe('WHEN the user submits the form', () => {
      it('THEN it rotates the key with a null expiresAt', async () => {
        const user = userEvent.setup()

        mockRotate.mockResolvedValue({
          data: {
            rotateApiKey: {
              id: 'api-key-1',
              value: 'new-value',
            },
          },
        })

        await prepare()

        // "Now" is the default selected option, no need to click any radio.
        await act(async () => {
          await user.click(screen.getByTestId(ROTATE_API_KEY_DIALOG_SUBMIT_BUTTON_TEST_ID))
        })

        await waitFor(() => {
          expect(mockRotate).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'api-key-1',
                expiresAt: null,
                name: 'My API Key',
              },
            },
          })
        })
      })
    })
  })

  describe('GIVEN a future expiration option (One week)', () => {
    describe('WHEN the user submits the form', () => {
      it('THEN it rotates the key with a non-null ISO expiresAt', async () => {
        const user = userEvent.setup()

        mockRotate.mockResolvedValue({
          data: {
            rotateApiKey: {
              id: 'api-key-1',
              value: 'new-value',
            },
          },
        })

        await prepare()

        const oneWeekRadio = screen
          .getAllByRole('radio')
          .find((radio) => radio.getAttribute('value') === 'OneWeek')

        expect(oneWeekRadio).toBeDefined()

        await act(async () => {
          await user.click(oneWeekRadio as HTMLElement)
        })

        await act(async () => {
          await user.click(screen.getByTestId(ROTATE_API_KEY_DIALOG_SUBMIT_BUTTON_TEST_ID))
        })

        await waitFor(() => {
          expect(mockRotate).toHaveBeenCalledTimes(1)
        })

        const submittedExpiresAt = mockRotate.mock.calls[0][0].variables.input.expiresAt

        expect(submittedExpiresAt).not.toBeNull()
        expect(typeof submittedExpiresAt).toBe('string')
      })
    })
  })
})
