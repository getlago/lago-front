import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode, useEffect } from 'react'

import { render } from '~/test-utils'

import { DIALOG_TITLE_TEST_ID } from '../BaseDialog'
import CentralizedDialog, {
  CENTRALIZED_DIALOG_NAME,
  CentralizedDialogProps,
  useCentralizedDialog,
} from '../CentralizedDialog'

// Test IDs for test-specific elements
const DIALOG_CONTENT_TEST_ID = 'dialog-content'
const DIALOG_ACTION_TEST_ID = 'dialog-action'
const HEADER_CONTENT_TEST_ID = 'header-content'

// Register the dialog
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

// Test component that opens the dialog with given props
const TestComponent = ({
  dialogProps,
  autoOpen = true,
}: {
  dialogProps: CentralizedDialogProps
  autoOpen?: boolean
}) => {
  const centralizedDialog = useCentralizedDialog()

  useEffect(() => {
    if (autoOpen) {
      centralizedDialog.open(dialogProps).catch(() => {
        // Ignore rejection - dialog was cancelled
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen])

  return null
}

// Wrapper that includes NiceModal.Provider
const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const defaultProps: CentralizedDialogProps = {
  title: 'Centralized Dialog Title',
  actions: <button data-test={DIALOG_ACTION_TEST_ID}>OK</button>,
}

describe('CentralizedDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with title', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent(
          'Centralized Dialog Title',
        )
      })
    })

    it('renders title as ReactNode when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              title: <div data-test="custom-title">Custom Title Component</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('custom-title')).toBeInTheDocument()
        expect(screen.getByText('Custom Title Component')).toBeInTheDocument()
      })
    })

    it('renders description when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              description: 'This is a test description',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByText('This is a test description')).toBeInTheDocument()
      })
    })

    it('renders description as ReactNode when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              description: <div data-test="custom-description">Custom Description</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('custom-description')).toBeInTheDocument()
      })
    })

    it('renders headerContent when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              headerContent: <div data-test={HEADER_CONTENT_TEST_ID}>Header Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(HEADER_CONTENT_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders children content', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              children: <div data-test={DIALOG_CONTENT_TEST_ID}>Test Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_CONTENT_TEST_ID)).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
      })
    })

    it('renders actions', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_ACTION_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders multiple action buttons', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              actions: (
                <>
                  <button data-test="cancel-button">Cancel</button>
                  <button data-test="confirm-button">Confirm</button>
                </>
              ),
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
        expect(screen.getByTestId('confirm-button')).toBeInTheDocument()
      })
    })
  })

  describe('Callbacks', () => {
    it('closes dialog when backdrop is clicked', async () => {
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              children: <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_CONTENT_TEST_ID)).toBeInTheDocument()
      })

      const backdrop = document.querySelector('.MuiBackdrop-root')

      expect(backdrop).toBeInTheDocument()

      if (backdrop) {
        await user.click(backdrop)
      }

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_CONTENT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              children: <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_CONTENT_TEST_ID)).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_CONTENT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with basic props', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with title and description', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              description: 'This is a description',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with headerContent', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              headerContent: <div>Header Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with children', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              children: <div>Dialog Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with all props', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              description: 'This is a description',
              headerContent: <div>Header Content</div>,
              children: <div>Dialog Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })
  })
})
