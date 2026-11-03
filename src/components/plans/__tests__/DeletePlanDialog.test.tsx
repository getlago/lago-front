import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
  DIALOG_TITLE_TEST_ID,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import { render } from '~/test-utils'

import { useDeletePlanDialog } from '../DeletePlanDialog'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockUseDeletePlanDialogCountsQuery = jest.fn()
const mockDeletePlan = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDeletePlanDialogCountsQuery: () => mockUseDeletePlanDialogCountsQuery(),
  useDeletePlanMutation: () => [mockDeletePlan],
}))

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const TestWrapper = ({ callback }: { callback?: () => void }) => {
  const { openDeletePlanDialog } = useDeletePlanDialog()

  return (
    <button
      data-test="open-dialog-btn"
      onClick={() =>
        openDeletePlanDialog({ plan: { id: 'plan-123', name: 'Test Plan' }, callback })
      }
    >
      Open Dialog
    </button>
  )
}

const openDialog = async (): Promise<void> => {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestWrapper />
      </NiceModalWrapper>,
    ),
  )

  await act(async () => {
    await userEvent.click(screen.getByTestId('open-dialog-btn'))
  })
}

describe('DeletePlanDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN counts are still loading', () => {
    beforeEach(() => {
      mockUseDeletePlanDialogCountsQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      })
    })

    it('THEN renders the dialog title without the counts', async () => {
      await openDialog()

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })

    it('THEN confirming does not call the delete mutation', async () => {
      await openDialog()

      await waitFor(() => {
        expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(mockDeletePlan).not.toHaveBeenCalled()
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the counts query errors', () => {
    beforeEach(() => {
      mockUseDeletePlanDialogCountsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: new Error('network error'),
      })
    })

    it('THEN renders an error message instead of the counts copy', async () => {
      await openDialog()

      await waitFor(() => {
        expect(screen.getByText('text_62b31e1f6a5b8b1b745ece48')).toBeInTheDocument()
      })
    })

    it('THEN confirming does not call the delete mutation', async () => {
      await openDialog()

      await waitFor(() => {
        expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(mockDeletePlan).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN counts resolved successfully', () => {
    beforeEach(() => {
      mockUseDeletePlanDialogCountsQuery.mockReturnValue({
        data: { plan: { id: 'plan-123', draftInvoicesCount: 2, activeSubscriptionsCount: 3 } },
        loading: false,
        error: undefined,
      })
    })

    it('THEN confirming calls the delete mutation with the plan id', async () => {
      mockDeletePlan.mockResolvedValue({ data: { destroyPlan: { id: 'plan-123' } } })

      await openDialog()

      await waitFor(() => {
        expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(mockDeletePlan).toHaveBeenCalledWith({ variables: { input: { id: 'plan-123' } } })
      })
    })

    it('THEN shows a success toast and calls the callback', async () => {
      const mockCallback = jest.fn()

      mockDeletePlan.mockResolvedValue({ data: { destroyPlan: { id: 'plan-123' } } })

      await act(() =>
        render(
          <NiceModalWrapper>
            <TestWrapper callback={mockCallback} />
          </NiceModalWrapper>,
        ),
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('open-dialog-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(mockCallback).toHaveBeenCalled()
      })
    })

    it('THEN a rejected mutation keeps the dialog open, skips the callback and shows a danger toast', async () => {
      const mockCallback = jest.fn()

      mockDeletePlan.mockRejectedValue(new Error('network error'))

      await act(() =>
        render(
          <NiceModalWrapper>
            <TestWrapper callback={mockCallback} />
          </NiceModalWrapper>,
        ),
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('open-dialog-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'danger',
            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
          }),
        )
      })

      expect(mockCallback).not.toHaveBeenCalled()
      expect(screen.getByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })
})
