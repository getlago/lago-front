import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode, useEffect } from 'react'

import { render } from '~/test-utils'

import {
  DIALOG_OPENING_WARNING_DIALOG_NAME,
  DIALOG_TITLE_TEST_ID,
  WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID,
  WARNING_DIALOG_NAME,
} from '../const'
import DialogOpeningWarningDialog, {
  DialogOpeningWarningDialogProps,
  useDialogOpeningWarningDialog,
} from '../DialogOpeningWarningDialog'
import WarningDialog from '../WarningDialog'

// Test IDs for test-specific elements
const DIALOG_CONTENT_TEST_ID = 'dialog-content'
const DIALOG_ACTION_TEST_ID = 'dialog-action'

// Register both dialogs
NiceModal.register(DIALOG_OPENING_WARNING_DIALOG_NAME, DialogOpeningWarningDialog)
NiceModal.register(WARNING_DIALOG_NAME, WarningDialog)

// Test component that opens the dialog with given props
const TestComponent = ({
  dialogProps,
  autoOpen = true,
}: {
  dialogProps: DialogOpeningWarningDialogProps
  autoOpen?: boolean
}) => {
  const dialogOpeningWarningDialog = useDialogOpeningWarningDialog()

  useEffect(() => {
    if (autoOpen) {
      dialogOpeningWarningDialog.open(dialogProps).catch(() => {
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

const defaultWarningDialogProps = {
  title: 'Warning Title',
  description: 'Warning Description',
  onContinue: jest.fn(),
  continueText: 'Confirm Warning',
}

const defaultProps: DialogOpeningWarningDialogProps = {
  title: 'Dialog Opening Title',
  actions: <button data-test={DIALOG_ACTION_TEST_ID}>OK</button>,
  warningDialogProps: defaultWarningDialogProps,
}

describe('DialogOpeningWarningDialog', () => {
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
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent('Dialog Opening Title')
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

    it('renders headerContent when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              headerContent: <div data-test="header-content">Header Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('header-content')).toBeInTheDocument()
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
  })

  describe('Warning Dialog Button', () => {
    it('does not render warning button when canOpenWarningDialog is false', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: false,
              openWarningDialogText: 'Open Warning',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.queryByText('Open Warning')).not.toBeInTheDocument()
    })

    it('does not render warning button by default (undefined canOpenWarningDialog)', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              openWarningDialogText: 'Open Warning',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.queryByText('Open Warning')).not.toBeInTheDocument()
    })

    it('renders warning button when canOpenWarningDialog is true', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: true,
              openWarningDialogText: 'Open Warning',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByText('Open Warning')).toBeInTheDocument()
      })
    })

    it('opens warning dialog when warning button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: true,
              openWarningDialogText: 'Open Warning',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByText('Open Warning')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Open Warning'))

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.getByText('Warning Title')).toBeInTheDocument()
      })
    })

    it('closes parent dialog before opening warning dialog', async () => {
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: true,
              openWarningDialogText: 'Open Warning',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByText('Dialog Opening Title')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Open Warning'))

      await waitFor(() => {
        expect(screen.queryByText('Dialog Opening Title')).not.toBeInTheDocument()
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
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

    it('matches snapshot with warning button', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: true,
              openWarningDialogText: 'Delete Item',
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
              canOpenWarningDialog: true,
              openWarningDialogText: 'Delete Item',
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

  describe('Complex Scenarios', () => {
    it('warning dialog receives correct props when opened', async () => {
      const onContinue = jest.fn()
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              canOpenWarningDialog: true,
              openWarningDialogText: 'Open Warning',
              warningDialogProps: {
                title: 'Custom Warning Title',
                description: 'Custom Warning Description',
                onContinue,
                continueText: 'Custom Continue Text',
              },
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByText('Open Warning')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Open Warning'))

      await waitFor(() => {
        expect(screen.getByText('Custom Warning Title')).toBeInTheDocument()
        expect(screen.getByText('Custom Warning Description')).toBeInTheDocument()
        expect(screen.getByText('Custom Continue Text')).toBeInTheDocument()
      })
    })
  })
})
