import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'
import { render } from '~/test-utils'

import { EDIT_BUTTON, InvoceCustomFooter, SECTION_CHIP } from '../InvoceCustomFooter'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: jest.fn(),
}))

jest.mock('~/hooks/useInvoiceCustomSections', () => ({
  useInvoiceCustomSections: jest.fn(),
}))

jest.mock('~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog', () => ({
  EditInvoiceCustomSectionDialog: jest.fn(({ open, onClose, onSave }) =>
    open ? (
      <div data-test="edit-invoice-custom-section-dialog">
        <button data-test="dialog-close" onClick={onClose}>
          Close
        </button>
        <button
          data-test="dialog-save-fallback"
          onClick={() => onSave({ behavior: 'fallback', selectedSections: [] })}
        >
          Save Fallback
        </button>
        <button
          data-test="dialog-save-apply"
          onClick={() =>
            onSave({
              behavior: 'apply',
              selectedSections: [{ id: 'section-1', name: 'Section 1' }],
            })
          }
        >
          Save Apply
        </button>
        <button
          data-test="dialog-save-none"
          onClick={() => onSave({ behavior: 'none', selectedSections: [] })}
        >
          Save None
        </button>
      </div>
    ) : null,
  ),
  InvoiceCustomSectionBehavior: {
    FALLBACK: 'fallback',
    APPLY: 'apply',
    NONE: 'none',
  },
}))

const mockUseInternationalization = jest.mocked(useInternationalization)
const mockUseInvoiceCustomSections = jest.mocked(useInvoiceCustomSections)

describe('InvoceCustomFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseInternationalization.mockReturnValue({
      translate: (key: string) => key,
      locale: 'en',
    } as ReturnType<typeof useInternationalization>)

    mockUseInvoiceCustomSections.mockReturnValue({
      data: [
        { id: 'section-1', name: 'Section 1', code: 'section-1' },
        { id: 'section-2', name: 'Section 2', code: 'section-2' },
      ],
      loading: false,
    } as ReturnType<typeof useInvoiceCustomSections>)
  })

  describe('WHEN invoiceCustomSection has selected sections', () => {
    it('THEN displays chips for selected sections', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1', 'section-2'],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.getByText('Section 2')).toBeInTheDocument()
      })
    })

    it('THEN does not display chips when skipInvoiceCustomSections is true', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1'],
            skipInvoiceCustomSections: true,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
      })
    })

    it('THEN does not display chips when invoiceCustomSectionIds is null', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: null,
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.queryByTestId(SECTION_CHIP('section-1'))).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN opening the edit dialog', () => {
    it('THEN shows dialog when edit button is clicked', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('edit-invoice-custom-section-dialog')).toBeInTheDocument()
      })
    })

    it('THEN closes dialog when close button is clicked', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('edit-invoice-custom-section-dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByTestId('dialog-close')

      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('edit-invoice-custom-section-dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN saving from dialog', () => {
    it('THEN calls setInvoiceCustomSection with apply behavior', async () => {
      const setInvoiceCustomSection = jest.fn()

      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          setInvoiceCustomSection={setInvoiceCustomSection}
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      const saveApplyButton = screen.getByTestId('dialog-save-apply')

      await userEvent.click(saveApplyButton)

      await waitFor(() => {
        expect(setInvoiceCustomSection).toHaveBeenCalledWith({
          invoiceCustomSectionIds: ['section-1'],
          skipInvoiceCustomSections: false,
        })
      })
    })

    it('THEN calls setInvoiceCustomSection with fallback behavior', async () => {
      const setInvoiceCustomSection = jest.fn()

      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1'],
            skipInvoiceCustomSections: false,
          }}
          setInvoiceCustomSection={setInvoiceCustomSection}
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      const saveFallbackButton = screen.getByTestId('dialog-save-fallback')

      await userEvent.click(saveFallbackButton)

      await waitFor(() => {
        expect(setInvoiceCustomSection).toHaveBeenCalledWith({
          invoiceCustomSectionIds: null,
          skipInvoiceCustomSections: false,
        })
      })
    })

    it('THEN calls setInvoiceCustomSection with none behavior', async () => {
      const setInvoiceCustomSection = jest.fn()

      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          setInvoiceCustomSection={setInvoiceCustomSection}
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      const saveNoneButton = screen.getByTestId('dialog-save-none')

      await userEvent.click(saveNoneButton)

      await waitFor(() => {
        expect(setInvoiceCustomSection).toHaveBeenCalledWith({
          invoiceCustomSectionIds: null,
          skipInvoiceCustomSections: true,
        })
      })
    })
  })

  describe('WHEN displaying section chips', () => {
    it('THEN shows chips with correct test ids', async () => {
      render(
        <InvoceCustomFooter
          title="Test Title"
          description="Test Description"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1', 'section-2'],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId(SECTION_CHIP('section-1'))).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-2'))).toBeInTheDocument()
      })
    })
  })
})
