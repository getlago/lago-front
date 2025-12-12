import { screen } from '@testing-library/react'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'
import { render } from '~/test-utils'

import {
  FALLBACK_BILLING_ENTITY_LABEL,
  FALLBACK_CUSTOMER_SECTIONS_LABEL,
  InvoiceCustomSectionDisplay,
  SKIP_LABEL,
} from '../InvoiceCustomSectionDisplay'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: jest.fn(),
}))

jest.mock('~/hooks/useInvoiceCustomSections', () => ({
  useInvoiceCustomSections: jest.fn(),
}))

jest.mock('~/hooks/useCustomerInvoiceCustomSections', () => ({
  useCustomerInvoiceCustomSections: jest.fn(),
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

describe('InvoiceCustomSectionDisplay', () => {
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

  describe('InvoiceCustomSectionDisplay', () => {
    it('renders chips for APPLY display state', () => {
      render(
        <InvoiceCustomSectionDisplay
          selectedSections={[
            { id: 'section-1', name: 'Applied Section 1' },
            { id: 'section-2', name: 'Applied Section 2' },
          ]}
          skipSections={false}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(screen.getByText('Applied Section 1')).toBeInTheDocument()
      expect(screen.getByText('Applied Section 2')).toBeInTheDocument()
    })

    it('renders skip message for NONE display state', () => {
      render(
        <InvoiceCustomSectionDisplay
          selectedSections={[]}
          skipSections={true}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(screen.getByTestId(SKIP_LABEL)).toBeInTheDocument()
    })

    it('renders fallback customer sections with message', () => {
      render(
        <InvoiceCustomSectionDisplay
          selectedSections={[{ id: 'customer-section-1', name: 'Customer Section' }]}
          skipSections={false}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(screen.getByTestId(FALLBACK_CUSTOMER_SECTIONS_LABEL)).toBeInTheDocument()
      expect(screen.getByText('Customer Section')).toBeInTheDocument()
    })

    it('renders skip message for fallback_customer_skip display state', () => {
      render(
        <InvoiceCustomSectionDisplay
          selectedSections={[]}
          skipSections={false}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(screen.getByTestId(SKIP_LABEL)).toBeInTheDocument()
    })

    it('renders fallback billing entity sections with message', () => {
      render(
        <InvoiceCustomSectionDisplay
          selectedSections={[{ id: 'org-section-1', name: 'Org Section' }]}
          skipSections={false}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(screen.getByTestId(FALLBACK_BILLING_ENTITY_LABEL)).toBeInTheDocument()
      expect(screen.getByText('Org Section')).toBeInTheDocument()
    })

    it('renders null for fallback_empty display state', () => {
      const { container } = render(
        <InvoiceCustomSectionDisplay
          selectedSections={[]}
          skipSections={false}
          customerId="customer-1"
          viewType="subscription"
        />,
      )

      expect(container.firstChild).toBeNull()
    })
  })
})
