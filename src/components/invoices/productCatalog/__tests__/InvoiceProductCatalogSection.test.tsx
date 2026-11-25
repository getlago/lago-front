import { ApolloError } from '@apollo/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  InvoiceProductCatalogContractFragment,
  TimezoneEnum,
} from '~/generated/graphql'
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
const mockTable = jest.fn()
const mockOpenFeeDetails = jest.fn()
const mockRefetch = jest.fn()
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

jest.mock('../InvoiceProductCatalogFeesTable', () => ({
  InvoiceProductCatalogFeesTable: (props: Record<string, unknown>) => {
    mockTable(props)
    return null
  },
}))

jest.mock('~/components/invoices/details/ViewFeeDetailsDrawer', () => ({
  useViewFeeDetailsDrawer: () => ({ open: mockOpenFeeDetails, close: jest.fn() }),
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
      variables: {},
      refetch: mockRefetch,
      goToPage: jest.fn(),
      selectSection: mockSelectSection,
      onSearchChange: jest.fn(),
    })
  })

  afterEach(() => jest.restoreAllMocks())

  it('THEN renders the fees table with the page of fees, the active section and display props', () => {
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Eur}
        customerTimezone={TimezoneEnum.TzEuropeParis}
        hasTaxProviderError
      />,
    )
    expect(mockTable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fees: [expect.objectContaining({ id: 'fee-1' })],
        section: expect.objectContaining({ key: 'contract-1:category-1' }),
        currency: CurrencyEnum.Eur,
        customerTimezone: TimezoneEnum.TzEuropeParis,
        hasTaxProviderError: true,
        isLoading: false,
        hasError: false,
        hasActiveSearchOrFilters: false,
        onFeeClick: mockOpenFeeDetails,
      }),
    )
  })

  it('THEN passes matching metadata and page size to the pager', () => {
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockPager).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pageSize: 100,
        metadata: { currentPage: 2, totalPages: 3, totalCount: 250 },
      }),
    )
  })

  it('THEN does not request fees for an empty catalog', () => {
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={[]}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID)).toBeInTheDocument()
    expect(mockFees).not.toHaveBeenCalled()
  })

  it.each([
    ['loading', { loading: true }, { isLoading: true, hasError: false }],
    [
      'error',
      { error: new ApolloError({ errorMessage: 'Unavailable' }) },
      { isLoading: false, hasError: true },
    ],
  ])('THEN forwards the %s state to the table', (_, state, expected) => {
    mockFees.mockReturnValue({ ...mockFees(), ...state })
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining(expected))
    expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID)).toBeInTheDocument()
  })

  it('THEN refetches the fees when the table asks for a retry', () => {
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    const { onRetry } = mockTable.mock.lastCall[0] as { onRetry: () => void }

    onRetry()
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a search term', new URLSearchParams(), { searchTerm: 'salad' }],
    ['a fees filter in the URL', new URLSearchParams('ipf_appliedRateCardProductType=fixed'), {}],
  ])('THEN flags active search or filters with %s', (_, searchParams, variables) => {
    mockSearchParams = searchParams
    mockFees.mockReturnValue({ ...mockFees(), variables })
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockTable).toHaveBeenLastCalledWith(
      expect.objectContaining({ hasActiveSearchOrFilters: true }),
    )
  })

  it('THEN does not flag search or filters for an unrelated URL param', () => {
    mockSearchParams = new URLSearchParams('page=2')
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockTable).toHaveBeenLastCalledWith(
      expect.objectContaining({ hasActiveSearchOrFilters: false }),
    )
  })

  it('THEN passes the fees filters of the URL to the hook', () => {
    mockSearchParams = new URLSearchParams(
      'ipf_dynamic.product=product-1|-_-|salad&ipf_appliedRateCardProductType=fixed',
    )
    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockFees).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { productIds: ['product-1'], productType: 'fixed' },
      }),
    )
  })

  it('THEN selects the section of the clicked tab through the hook', async () => {
    const user = userEvent.setup()

    render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    await user.click(
      screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_TABS_TEST_ID}-contract-1:standalone`),
    )
    expect(mockSelectSection).toHaveBeenCalledWith('contract-1:standalone')
  })

  it('THEN remounts the hook owner only when the resolved section changes', () => {
    mockSearchParams = new URLSearchParams('section=unknown')
    const { rerender } = render(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    const mounts = mockMount.mock.calls.length

    mockSearchParams = new URLSearchParams('section=contract-1%3Acategory-1&page=2')
    rerender(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockMount).toHaveBeenCalledTimes(mounts)
    mockSearchParams = new URLSearchParams('section=contract-1%3Astandalone')
    rerender(
      <InvoiceProductCatalogSection
        invoiceId="invoice-1"
        contracts={contracts}
        currency={CurrencyEnum.Usd}
      />,
    )
    expect(mockMount.mock.calls.length).toBeGreaterThan(mounts)
    expect(mockFees).toHaveBeenLastCalledWith(
      expect.objectContaining({
        section: expect.objectContaining({ key: 'contract-1:standalone' }),
      }),
    )
  })
})
