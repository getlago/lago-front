import NiceModal from '@ebay/nice-modal-react'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode, useEffect } from 'react'

import { render } from '~/test-utils'

import WarningDialog, {
  useWarningDialog,
  WARNING_DIALOG_CANCEL_BUTTON_TEST_ID,
  WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID,
  WARNING_DIALOG_NAME,
  WarningDialogProps,
} from '../WarningDialog'

// Register the dialog
NiceModal.register(WARNING_DIALOG_NAME, WarningDialog)

// Test component that opens the dialog with given props
const TestComponent = ({
  dialogProps,
  autoOpen = true,
}: {
  dialogProps: WarningDialogProps
  autoOpen?: boolean
}) => {
  const warningDialog = useWarningDialog()

  useEffect(() => {
    if (autoOpen) {
      warningDialog.open(dialogProps).catch(() => {
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

const defaultProps: WarningDialogProps = {
  title: 'Warning Title',
  description: 'Warning Description',
  onContinue: jest.fn(),
  continueText: 'Continue',
}

describe('WarningDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with title and description', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.getByText('Warning Title')).toBeInTheDocument()
        expect(screen.getByText('Warning Description')).toBeInTheDocument()
      })
    })

    it('renders with custom continue text', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              continueText: 'Custom Continue',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toHaveTextContent(
          'Custom Continue',
        )
      })
    })

    it('renders cancel button with translated text', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const cancelButton = screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID)

        expect(cancelButton).toBeInTheDocument()
        expect(cancelButton).toHaveTextContent(/cancel/i)
      })
    })

    it('renders ReactNode as description', async () => {
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
              headerContent: <div data-test="header-content">Header Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('header-content')).toBeInTheDocument()
      })
    })

    it('renders children when provided', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              children: <div data-test="dialog-children">Children Content</div>,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('dialog-children')).toBeInTheDocument()
      })
    })
  })

  describe('Modes', () => {
    it('renders in danger mode by default', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).toHaveClass('button-danger')
      })
    })

    it('renders in danger mode when explicitly set', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              mode: 'danger',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).toHaveClass('button-danger')
      })
    })

    it('renders in info mode when set', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              mode: 'info',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).not.toHaveClass('button-danger')
      })
    })
  })

  describe('Callbacks', () => {
    it('calls onContinue when confirm button is clicked', async () => {
      const onContinue = jest.fn()
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              onContinue,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(onContinue).toHaveBeenCalledTimes(1)
      })
    })

    it('closes dialog after onContinue callback', async () => {
      const onContinue = jest.fn()
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              onContinue,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeVisible()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('handles async onContinue callback', async () => {
      const onContinue = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              onContinue,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(onContinue).toHaveBeenCalled()
      })
    })

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeVisible()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Disable State', () => {
    it('disables confirm button when disableOnContinue is true', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              disableOnContinue: true,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).toBeDisabled()
      })
    })

    it('enables confirm button when disableOnContinue is false', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              disableOnContinue: false,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).not.toBeDisabled()
      })
    })

    it('enables confirm button by default', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent dialogProps={defaultProps} />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        const confirmButton = screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)

        expect(confirmButton).not.toBeDisabled()
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
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot in danger mode', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              mode: 'danger',
              continueText: 'Delete',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot in info mode', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              mode: 'info',
              continueText: 'Confirm',
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with disabled confirm button', async () => {
      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              disableOnContinue: true,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })
  })

  describe('Complex Scenarios', () => {
    it('handles async onContinue with delay', async () => {
      const onContinue = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }),
      )
      const user = userEvent.setup()

      render(
        <NiceModalWrapper>
          <TestComponent
            dialogProps={{
              ...defaultProps,
              onContinue,
            }}
          />
        </NiceModalWrapper>,
      )

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(
        () => {
          expect(onContinue).toHaveBeenCalled()
        },
        { timeout: 2000 },
      )
    })
  })
})
