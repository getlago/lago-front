import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import BaseDialog, { BaseDialogProps, DIALOG_TITLE_TEST_ID } from '../BaseDialog'

// Test IDs for test-specific elements
const DIALOG_CONTENT_TEST_ID = 'dialog-content'
const DIALOG_ACTION_TEST_ID = 'dialog-action'
const HEADER_CONTENT_TEST_ID = 'header-content'

const defaultProps: BaseDialogProps = {
  title: 'Test Dialog',
  actions: <button data-test={DIALOG_ACTION_TEST_ID}>OK</button>,
  isOpen: true,
  closeDialog: jest.fn().mockResolvedValue(undefined),
  removeDialog: jest.fn(),
}

describe('BaseDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders the dialog with title', () => {
      render(<BaseDialog {...defaultProps} />)

      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toHaveTextContent('Test Dialog')
    })

    it('renders title as ReactNode when provided', () => {
      render(
        <BaseDialog
          {...defaultProps}
          title={<div data-test="custom-title">Custom Title Component</div>}
        />,
      )

      expect(screen.getByTestId('custom-title')).toBeInTheDocument()
      expect(screen.getByText('Custom Title Component')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(<BaseDialog {...defaultProps} description="This is a test description" />)

      expect(screen.getByText('This is a test description')).toBeInTheDocument()
    })

    it('renders description as ReactNode when provided', () => {
      render(
        <BaseDialog
          {...defaultProps}
          description={<div data-test="custom-description">Custom Description</div>}
        />,
      )

      expect(screen.getByTestId('custom-description')).toBeInTheDocument()
      expect(screen.getByText('Custom Description')).toBeInTheDocument()
    })

    it('renders headerContent when provided', () => {
      render(
        <BaseDialog
          {...defaultProps}
          headerContent={<div data-test={HEADER_CONTENT_TEST_ID}>Header Content</div>}
        />,
      )

      expect(screen.getByTestId(HEADER_CONTENT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByText('Header Content')).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(
        <BaseDialog {...defaultProps}>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Test Content</div>
        </BaseDialog>,
      )

      expect(screen.getByTestId(DIALOG_CONTENT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders string children with padding wrapper', () => {
      render(<BaseDialog {...defaultProps}>Simple string content</BaseDialog>)

      expect(screen.getByText('Simple string content')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      render(<BaseDialog {...defaultProps} />)

      // Only title should be rendered
      expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
    })

    it('does not render children when not provided', () => {
      render(<BaseDialog {...defaultProps} />)

      expect(screen.queryByTestId(DIALOG_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('renders actions', () => {
      render(<BaseDialog {...defaultProps} />)

      expect(screen.getByTestId(DIALOG_ACTION_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Open/Close State', () => {
    it('does not show dialog when isOpen is false', () => {
      render(
        <BaseDialog {...defaultProps} isOpen={false}>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      expect(screen.queryByTestId(DIALOG_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('shows dialog when isOpen is true', () => {
      render(
        <BaseDialog {...defaultProps} isOpen>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      expect(screen.getByTestId(DIALOG_CONTENT_TEST_ID)).toBeVisible()
    })
  })

  describe('Callbacks', () => {
    it('calls closeDialog when backdrop is clicked', async () => {
      const closeDialog = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(
        <BaseDialog {...defaultProps} closeDialog={closeDialog}>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      const backdrop = document.querySelector('.MuiBackdrop-root')

      expect(backdrop).toBeInTheDocument()

      if (backdrop) {
        await user.click(backdrop)
      }

      await waitFor(() => {
        expect(closeDialog).toHaveBeenCalledTimes(1)
      })
    })

    it('calls closeDialog when Escape key is pressed', async () => {
      const closeDialog = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(
        <BaseDialog {...defaultProps} closeDialog={closeDialog}>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(closeDialog).toHaveBeenCalled()
      })
    })

    it('calls removeDialog when dialog transition exits', async () => {
      const removeDialog = jest.fn()
      const closeDialog = jest.fn().mockResolvedValue(undefined)

      const { rerender } = render(
        <BaseDialog {...defaultProps} closeDialog={closeDialog} removeDialog={removeDialog} isOpen>
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      // Trigger close by setting isOpen to false
      rerender(
        <BaseDialog
          {...defaultProps}
          closeDialog={closeDialog}
          removeDialog={removeDialog}
          isOpen={false}
        >
          <div data-test={DIALOG_CONTENT_TEST_ID}>Content</div>
        </BaseDialog>,
      )

      // Wait for transition to complete and removeDialog to be called
      await waitFor(
        () => {
          expect(removeDialog).toHaveBeenCalled()
        },
        { timeout: 500 },
      )
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with basic props', () => {
      render(
        <BaseDialog {...defaultProps}>
          <div>Dialog Content</div>
        </BaseDialog>,
      )

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with title and description', () => {
      render(
        <BaseDialog {...defaultProps} description="This is a description">
          <div>Dialog Content</div>
        </BaseDialog>,
      )

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with headerContent', () => {
      render(
        <BaseDialog
          {...defaultProps}
          headerContent={<div data-test={HEADER_CONTENT_TEST_ID}>Header Content</div>}
        >
          <div>Dialog Content</div>
        </BaseDialog>,
      )

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with all props', () => {
      render(
        <BaseDialog
          {...defaultProps}
          description="This is a description"
          headerContent={<div>Header Content</div>}
        >
          <div>Dialog Content</div>
        </BaseDialog>,
      )

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot without children', () => {
      render(<BaseDialog {...defaultProps} description="Test Description" />)

      const dialogPaper = document.querySelector('.MuiDialog-paper')

      expect(dialogPaper).toMatchSnapshot()
    })

    it('matches snapshot with closed dialog', () => {
      render(
        <BaseDialog {...defaultProps} isOpen={false}>
          <div>Dialog Content</div>
        </BaseDialog>,
      )

      const dialogRoot = document.querySelector('.MuiDialog-root')

      expect(dialogRoot).toMatchSnapshot()
    })
  })
})
