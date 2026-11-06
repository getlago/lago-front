import { ApolloError } from '@apollo/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { InvoiceProductCatalogContractFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID,
  INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID,
  InvoiceProductCatalogSection,
} from '../InvoiceProductCatalogSection'
import { INVOICE_PRODUCT_CATALOG_TABS_TEST_ID } from '../InvoiceProductCatalogToolbar'

const mockFees = jest.fn()
const mockPager = jest.fn()
const mockMount = jest.fn()
const mockSelectSection = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => [mockSearchParams, jest.fn()],
}))

jest.mock('../useInvoiceProductFees', () => ({
  ...jest.requireActual('../useInvoiceProductFees'),
  useInvoiceProductFees: (options: unknown) => {
    const { useState } = jest.requireActual<typeof import('react')>('react')

    useState(() => mockMount())
    return mockFees(options)
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  ...jest.requireActual('~/components/designSystem/Pagination'),
  PaginatedContent: (props: { children: React.ReactNode }) => {
    mockPager(props)
    return <>{props.children}</>
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const contracts: InvoiceProductCatalogContractFragment[] = [
  {
    contract: { id: 'contract-1', externalId: 'contract-1-external' },
    productCatalogSections: [
      { productCategory: { id: 'category-1', name: 'Food', code: 'food' }, products: [] },
      { productCategory: null, products: [] },
    ],
  },
]

describe('GIVEN a catalog invoice section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockFees.mockReturnValue({
      data: {
        invoiceProductFees: {
          collection: [
            { id: 'fee-1', product: { name: 'Salad', invoiceDisplayName: 'Fresh salad' } },
          ],
          metadata: { currentPage: 2, totalPages: 3, totalCount: 250 },
        },
      },
      loading: false,
      goToPage: jest.fn(),
      selectSection: mockSelectSection,
      onSearchChange: jest.fn(),
    })
  })

  afterEach(() => jest.restoreAllMocks())

  it('THEN shows the raw fee list and passes matching metadata and page size to the pager', () => {
    render(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
    expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID)).toHaveTextContent(
      'Fresh salad',
    )
    expect(mockPager).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pageSize: 100,
        metadata: { currentPage: 2, totalPages: 3, totalCount: 250 },
        sticky: false,
      }),
    )
  })

  it('THEN does not request fees for an empty catalog', () => {
    render(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={[]} />)
    expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID)).toBeInTheDocument()
    expect(mockFees).not.toHaveBeenCalled()
  })

  it.each([{ loading: true }, { error: new ApolloError({ errorMessage: 'Unavailable' }) }])(
    'THEN hides stale rows when $loading or $error',
    (state) => {
      mockFees.mockReturnValue({ ...mockFees(), ...state })
      render(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
      expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID)).toBeInTheDocument()
    },
  )

  it('THEN passes the fees filters of the URL to the hook', () => {
    mockSearchParams = new URLSearchParams(
      'ipf_dynamic.product=product-1|-_-|salad&ipf_appliedRateCardProductType=fixed',
    )
    render(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
    expect(mockFees).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { productIds: ['product-1'], productType: 'fixed' },
      }),
    )
  })

  it('THEN selects the section of the clicked tab through the hook', async () => {
    const user = userEvent.setup()

    render(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
    await user.click(
      screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_TABS_TEST_ID}-contract-1:standalone`),
    )
    expect(mockSelectSection).toHaveBeenCalledWith('contract-1:standalone')
  })

  it('THEN remounts the hook owner only when the resolved section changes', () => {
    mockSearchParams = new URLSearchParams('section=unknown')
    const { rerender } = render(
      <InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />,
    )
    const mounts = mockMount.mock.calls.length

    mockSearchParams = new URLSearchParams('section=contract-1%3Acategory-1&page=2')
    rerender(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
    expect(mockMount).toHaveBeenCalledTimes(mounts)
    mockSearchParams = new URLSearchParams('section=contract-1%3Astandalone')
    rerender(<InvoiceProductCatalogSection invoiceId="invoice-1" contracts={contracts} />)
    expect(mockMount.mock.calls.length).toBeGreaterThan(mounts)
    expect(mockFees).toHaveBeenLastCalledWith(
      expect.objectContaining({
        section: expect.objectContaining({ key: 'contract-1:standalone' }),
      }),
    )
  })
})
