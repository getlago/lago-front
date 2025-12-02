import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useGetCustomerAppliedInvoiceCustomSectionsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

import { createInvoiceCustomSection } from './factories/invoiceCustomSectionFactory'

import {
  ADD_BUTTON,
  CANCEL_BUTTON,
  DELETE_SECTION_CHIP,
  InvoceCustomFooter,
} from '../InvoceCustomFooter'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: jest.fn(),
}))

jest.mock('~/components/invoceCustomFooter/InvoiceCustomerFooterSelection', () => ({
  InvoiceCustomerFooterSelection: jest.fn(({ onChange }) => (
    <div data-test="invoice-customer-footer-selection">
      <button
        data-test="mock-select-section"
        onClick={() => onChange?.({ id: 'section-1', name: 'Section 1' })}
      >
        Select Section
      </button>
    </div>
  )),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerAppliedInvoiceCustomSectionsQuery: jest.fn(),
}))

const mockUseInternationalization = jest.mocked(useInternationalization)
const mockUseGetCustomerAppliedInvoiceCustomSectionsQuery = jest.mocked(
  useGetCustomerAppliedInvoiceCustomSectionsQuery,
)

describe('InvoceCustomFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseInternationalization.mockReturnValue({
      translate: (key: string) => key,
      locale: 'en',
    } as ReturnType<typeof useInternationalization>)

    mockUseGetCustomerAppliedInvoiceCustomSectionsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetCustomerAppliedInvoiceCustomSectionsQuery>)
  })

  describe('WHEN customer has configurableInvoiceCustomSections', () => {
    it('THEN initializes state with customer sections and displays chips', async () => {
      const customerSections = [
        createInvoiceCustomSection({ id: 'section-1', name: 'Section 1' }),
        createInvoiceCustomSection({ id: 'section-2', name: 'Section 2' }),
      ]

      mockUseGetCustomerAppliedInvoiceCustomSectionsQuery.mockReturnValue({
        data: {
          customer: {
            __typename: 'Customer',
            id: 'customer-1',
            configurableInvoiceCustomSections: customerSections,
            skipInvoiceCustomSections: false,
          },
        },
        loading: false,
        error: undefined,
      } as ReturnType<typeof useGetCustomerAppliedInvoiceCustomSectionsQuery>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.getByText('Section 2')).toBeInTheDocument()
      })
    })

    it('THEN does not initialize state when skipInvoiceCustomSections is true', async () => {
      const customerSections = [createInvoiceCustomSection({ id: 'section-1', name: 'Section 1' })]

      mockUseGetCustomerAppliedInvoiceCustomSectionsQuery.mockReturnValue({
        data: {
          customer: {
            __typename: 'Customer',
            id: 'customer-1',
            configurableInvoiceCustomSections: customerSections,
            skipInvoiceCustomSections: true,
          },
        },
        loading: false,
        error: undefined,
      } as ReturnType<typeof useGetCustomerAppliedInvoiceCustomSectionsQuery>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      await waitFor(() => {
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN toggling combobox visibility', () => {
    it('THEN shows combobox when add button is clicked', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      const addButton = screen.getByTestId(ADD_BUTTON)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('invoice-customer-footer-selection')).toBeInTheDocument()
      })
    })

    it('THEN hides combobox when cancel button is clicked', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      const addButton = screen.getByTestId(ADD_BUTTON)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('invoice-customer-footer-selection')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId(CANCEL_BUTTON)

      await userEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('invoice-customer-footer-selection')).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN selecting a section', () => {
    it('THEN adds section to selected list and hides combobox', async () => {
      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      const addButton = screen.getByTestId(ADD_BUTTON)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('invoice-customer-footer-selection')).toBeInTheDocument()
      })

      const selectButton = screen.getByTestId('mock-select-section')

      await userEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.queryByTestId('invoice-customer-footer-selection')).not.toBeInTheDocument()
      })
    })

    it('THEN does not add duplicate section if already selected', async () => {
      const customerSections = [createInvoiceCustomSection({ id: 'section-1', name: 'Section 1' })]

      mockUseGetCustomerAppliedInvoiceCustomSectionsQuery.mockReturnValue({
        data: {
          customer: {
            __typename: 'Customer',
            id: 'customer-1',
            configurableInvoiceCustomSections: customerSections,
            skipInvoiceCustomSections: false,
          },
        },
        loading: false,
        error: undefined,
      } as ReturnType<typeof useGetCustomerAppliedInvoiceCustomSectionsQuery>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
      })

      const addButton = screen.getByTestId(ADD_BUTTON)

      await userEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('invoice-customer-footer-selection')).toBeInTheDocument()
      })

      const selectButton = screen.getByTestId('mock-select-section')

      await userEvent.click(selectButton)

      // Should still have only one Section 1 chip
      const section1Chips = screen.getAllByText('Section 1')

      expect(section1Chips).toHaveLength(1)
    })
  })

  describe('WHEN deleting a section', () => {
    it('THEN removes section from selected list', async () => {
      const customerSections = [
        createInvoiceCustomSection({ id: 'section-1', name: 'Section 1' }),
        createInvoiceCustomSection({ id: 'section-2', name: 'Section 2' }),
      ]

      mockUseGetCustomerAppliedInvoiceCustomSectionsQuery.mockReturnValue({
        data: {
          customer: {
            __typename: 'Customer',
            id: 'customer-1',
            configurableInvoiceCustomSections: customerSections,
            skipInvoiceCustomSections: false,
          },
        },
        loading: false,
        error: undefined,
      } as ReturnType<typeof useGetCustomerAppliedInvoiceCustomSectionsQuery>)

      render(
        <InvoceCustomFooter
          customerId="customer-1"
          title="Test Title"
          description="Test Description"
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.getByText('Section 2')).toBeInTheDocument()
      })

      const deleteButton = screen
        .getByTestId(DELETE_SECTION_CHIP('section-1'))
        .querySelector('button[data-test="button"]')

      expect(deleteButton).toBeTruthy()

      if (deleteButton) {
        await userEvent.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
        expect(screen.getByText('Section 2')).toBeInTheDocument()
      })
    })
  })
})
