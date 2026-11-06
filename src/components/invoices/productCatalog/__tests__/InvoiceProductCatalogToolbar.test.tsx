import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { InvoiceProductCatalogTab } from '../invoiceProductCatalogTabs'
import {
  INVOICE_PRODUCT_CATALOG_SEARCH_INPUT_TEST_ID,
  INVOICE_PRODUCT_CATALOG_TABS_TEST_ID,
  InvoiceProductCatalogToolbar,
} from '../InvoiceProductCatalogToolbar'
import { buildInvoiceProductCatalogSections } from '../useInvoiceProductFees'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const sections = buildInvoiceProductCatalogSections([
  {
    contract: { id: 'c1', name: 'Acme' },
    productCatalogSections: [
      { productCategory: { id: 'catA', code: 'a', name: 'Category A' }, products: [] },
      { productCategory: null, products: [] },
    ],
  },
])

const tabs: InvoiceProductCatalogTab[] = [
  { key: 'c1:catA', label: 'Category A' },
  { key: 'c1:standalone', label: 'Standalone products' },
]

const onSelectSection = jest.fn()
const onSearchChange = jest.fn()

const renderToolbar = (toolbarTabs: InvoiceProductCatalogTab[], sectionIndex = 0) =>
  render(
    <InvoiceProductCatalogToolbar
      tabs={toolbarTabs}
      section={sections[sectionIndex]}
      onSelectSection={onSelectSection}
      onSearchChange={onSearchChange}
    />,
  )

const getTab = (key: string): HTMLElement =>
  screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_TABS_TEST_ID}-${key}`)

describe('InvoiceProductCatalogToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a single tab', () => {
    it('THEN should not render the tabs', () => {
      renderToolbar([tabs[0]])

      expect(screen.queryByTestId(INVOICE_PRODUCT_CATALOG_TABS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN several tabs', () => {
    it('THEN should select the tab of the active section', () => {
      renderToolbar(tabs, 1)

      expect(getTab('c1:standalone')).toHaveAttribute('aria-selected', 'true')
      expect(getTab('c1:catA')).toHaveAttribute('aria-selected', 'false')
    })

    describe('WHEN clicking another tab', () => {
      it('THEN should select its section', async () => {
        const user = userEvent.setup()

        renderToolbar(tabs, 0)
        await user.click(getTab('c1:standalone'))

        expect(onSelectSection).toHaveBeenCalledTimes(1)
        expect(onSelectSection).toHaveBeenCalledWith('c1:standalone')
      })
    })
  })

  describe('GIVEN the search input', () => {
    describe('WHEN typing a term', () => {
      it('THEN should forward the typed value', async () => {
        const user = userEvent.setup()

        renderToolbar(tabs)
        const input = screen
          .getByTestId(INVOICE_PRODUCT_CATALOG_SEARCH_INPUT_TEST_ID)
          .querySelector('input') as HTMLInputElement

        await user.type(input, 'abc')

        expect(onSearchChange).toHaveBeenLastCalledWith('abc')
      })
    })
  })
})
