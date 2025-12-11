import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'
import { render } from '~/test-utils'

import {
  EDIT_BUTTON,
  FALLBACK_BILLING_ENTITY_LABEL,
  InvoceCustomFooter,
  SECTION_CHIP,
} from '../InvoceCustomFooter'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: jest.fn(),
}))

jest.mock('~/hooks/useInvoiceCustomSections', () => ({
  useInvoiceCustomSections: jest.fn(),
}))

jest.mock('~/hooks/useCustomerInvoiceCustomSections', () => ({
  useCustomerInvoiceCustomSections: jest.fn(),
}))

jest.mock('~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog', () => ({
  EditInvoiceCustomSectionDialog: jest.fn(() => null),
  InvoiceCustomSectionBehavior: {
    FALLBACK: 'fallback',
    APPLY: 'apply',
    NONE: 'none',
  },
}))

const mockUseInternationalization = jest.mocked(useInternationalization)
const mockUseInvoiceCustomSections = jest.mocked(useInvoiceCustomSections)
const mockUseCustomerInvoiceCustomSections = jest.mocked(useCustomerInvoiceCustomSections)

const defaultOrgSections = [
  { id: 'section-1', name: 'Section 1', code: 'section-1' },
  { id: 'section-2', name: 'Section 2', code: 'section-2' },
  { id: 'section-3', name: 'Section 3', code: 'section-3' },
]

const defaultCustomerData = {
  customerId: 'customer-1',
  externalId: 'ext-customer-1',
  configurableInvoiceCustomSections: [
    { id: 'section-1', name: 'Section 1' },
    { id: 'section-2', name: 'Section 2' },
  ],
  hasOverwrittenInvoiceCustomSectionsSelection: false,
  skipInvoiceCustomSections: false,
}

describe('InvoceCustomFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseInternationalization.mockReturnValue({
      translate: (key: string) => key,
      locale: 'en',
    } as ReturnType<typeof useInternationalization>)

    mockUseInvoiceCustomSections.mockReturnValue({
      data: defaultOrgSections,
      loading: false,
      error: false,
    } as ReturnType<typeof useInvoiceCustomSections>)

    mockUseCustomerInvoiceCustomSections.mockReturnValue({
      data: defaultCustomerData,
      loading: false,
      error: false,
      customer: null,
    } as ReturnType<typeof useCustomerInvoiceCustomSections>)
  })

  describe('Test 1: APPLY behavior - displays selected sections from form', () => {
    it('should display chips for explicitly selected sections when invoiceCustomSectionIds is provided', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1', 'section-3'],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.getByText('Section 3')).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-1'))).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-3'))).toBeInTheDocument()
      })

      // Should not display section-2 as it's not in the selected list
      expect(screen.queryByText('Section 2')).not.toBeInTheDocument()
    })

    it('should pass correct selected sections to dialog when opening edit dialog', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1', 'section-2'],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      // Verify dialog receives the selected sections
      const { EditInvoiceCustomSectionDialog } = jest.requireMock(
        '~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog',
      )

      const dialogCall = EditInvoiceCustomSectionDialog.mock.calls[0]?.[0]

      expect(dialogCall?.selectedSections).toEqual([
        { id: 'section-1', name: 'Section 1' },
        { id: 'section-2', name: 'Section 2' },
      ])
    })
  })

  describe('Test 2: NONE behavior - skips invoice custom sections', () => {
    it('should not display sections when skipInvoiceCustomSections is true', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1'],
            skipInvoiceCustomSections: true,
          }}
        />,
      )

      await waitFor(() => {
        // Should not display any chips
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
        expect(screen.queryByTestId(SECTION_CHIP('section-1'))).not.toBeInTheDocument()
      })
    })
  })

  describe('Test 3: FALLBACK behavior - inherits from customer custom sections', () => {
    it('should display customer sections when hasOverwrittenInvoiceCustomSectionsSelection is true', async () => {
      mockUseCustomerInvoiceCustomSections.mockReturnValue({
        data: {
          ...defaultCustomerData,
          hasOverwrittenInvoiceCustomSectionsSelection: true,
          skipInvoiceCustomSections: false,
          configurableInvoiceCustomSections: [
            { id: 'section-1', name: 'Customer Section 1' },
            { id: 'section-2', name: 'Customer Section 2' },
          ],
        },
        loading: false,
        error: false,
        customer: null,
      } as ReturnType<typeof useCustomerInvoiceCustomSections>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: [],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Customer Section 1')).toBeInTheDocument()
        expect(screen.getByText('Customer Section 2')).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-1'))).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-2'))).toBeInTheDocument()
      })
    })

    it('should display customer skip message when customer has skipInvoiceCustomSections=true and hasOverwrittenInvoiceCustomSectionsSelection=false', async () => {
      mockUseCustomerInvoiceCustomSections.mockReturnValue({
        data: {
          ...defaultCustomerData,
          hasOverwrittenInvoiceCustomSectionsSelection: false,
          skipInvoiceCustomSections: true,
        },
        loading: false,
        error: false,
        customer: null,
      } as ReturnType<typeof useCustomerInvoiceCustomSections>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: [],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        // Should not display any chips
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
        expect(screen.queryByTestId(SECTION_CHIP('section-1'))).not.toBeInTheDocument()
      })
    })
  })

  describe('Test 4: FALLBACK behavior - inherits from billing entity', () => {
    it('should display billing entity sections when customer has not overwritten selection', async () => {
      mockUseCustomerInvoiceCustomSections.mockReturnValue({
        data: {
          ...defaultCustomerData,
          hasOverwrittenInvoiceCustomSectionsSelection: false,
          skipInvoiceCustomSections: false,
          configurableInvoiceCustomSections: [
            { id: 'section-1', name: 'Billing Entity Section 1' },
            { id: 'section-2', name: 'Billing Entity Section 2' },
          ],
        },
        loading: false,
        error: false,
        customer: null,
      } as ReturnType<typeof useCustomerInvoiceCustomSections>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: [],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId(FALLBACK_BILLING_ENTITY_LABEL)).toBeInTheDocument()
        expect(screen.getByText('Billing Entity Section 1')).toBeInTheDocument()
        expect(screen.getByText('Billing Entity Section 2')).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-1'))).toBeInTheDocument()
        expect(screen.getByTestId(SECTION_CHIP('section-2'))).toBeInTheDocument()
      })
    })

    it('should display empty state when no sections are available from billing entity', async () => {
      mockUseCustomerInvoiceCustomSections.mockReturnValue({
        data: {
          ...defaultCustomerData,
          hasOverwrittenInvoiceCustomSectionsSelection: false,
          skipInvoiceCustomSections: false,
          configurableInvoiceCustomSections: [],
        },
        loading: false,
        error: false,
        customer: null,
      } as ReturnType<typeof useCustomerInvoiceCustomSections>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: [],
            skipInvoiceCustomSections: false,
          }}
        />,
      )

      await waitFor(() => {
        // Should not display any sections or labels
        expect(screen.queryByTestId(FALLBACK_BILLING_ENTITY_LABEL)).not.toBeInTheDocument()
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
      })

      // Edit button should still be visible
      expect(screen.getByTestId(EDIT_BUTTON)).toBeInTheDocument()
    })
  })

  describe('Test 5: Dialog interaction and state management', () => {
    it('should open dialog when edit button is clicked', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
        />,
      )

      const editButton = screen.getByTestId(EDIT_BUTTON)

      await userEvent.click(editButton)

      // Verify dialog is called with open=true
      const { EditInvoiceCustomSectionDialog } = jest.requireMock(
        '~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog',
      )

      expect(EditInvoiceCustomSectionDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
        }),
        expect.anything(),
      )
    })

    it('should pass correct props to dialog based on current behavior', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Invoice Custom Sections"
          description="Select custom sections"
          viewType="subscription"
          invoiceCustomSection={{
            invoiceCustomSectionIds: ['section-1'],
            skipInvoiceCustomSections: true,
          }}
        />,
      )

      const { EditInvoiceCustomSectionDialog } = jest.requireMock(
        '~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog',
      )

      const dialogCall = EditInvoiceCustomSectionDialog.mock.calls[0]?.[0]

      expect(dialogCall?.skipInvoiceCustomSections).toBe(true)
      expect(dialogCall?.selectedSections).toEqual([])
    })

    it('should display title and description when provided', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Custom Title"
          description="Custom Description"
          viewType="subscription"
        />,
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom Description')).toBeInTheDocument()
    })
  })
})
