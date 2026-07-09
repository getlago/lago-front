import { screen } from '@testing-library/react'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { render } from '~/test-utils'

import ProductCatalog from '../ProductCatalog'

const renderPage = () =>
  render(
    <>
      <MainHeader />
      <ProductCatalog />
    </>,
  )

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const PRODUCTS_TAB = 'text_17831042398244jk9iv71lra'
const PRODUCT_ITEMS_TAB = 'text_17831042398250iwa2xp8pba'
const PRODUCT_ITEM_FILTERS_TAB = 'text_1783104239825gamldgumtq0'
const RATE_CARDS_TAB = 'text_1783104239825nxqno33u945'

describe('ProductCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('renders a tab for each catalog resource when all permissions are granted', () => {
    renderPage()

    expect(screen.getByText(PRODUCT_ITEMS_TAB)).toBeInTheDocument()
    expect(screen.getByText(PRODUCT_ITEM_FILTERS_TAB)).toBeInTheDocument()
    expect(screen.getByText(RATE_CARDS_TAB)).toBeInTheDocument()
    // Products appears in both the tab bar and as the default active content
    expect(screen.getAllByText(PRODUCTS_TAB).length).toBeGreaterThanOrEqual(1)
  })

  it('hides a tab when its view permission is missing', () => {
    mockHasPermissions.mockImplementation(
      (permissions: string[]) => !permissions.includes('productItemFiltersView'),
    )

    renderPage()

    expect(screen.queryByText(PRODUCT_ITEM_FILTERS_TAB)).not.toBeInTheDocument()
    expect(screen.getByText(PRODUCT_ITEMS_TAB)).toBeInTheDocument()
  })

  it('gates each tab on its own view permission', () => {
    renderPage()

    expect(mockHasPermissions).toHaveBeenCalledWith(['productsView'])
    expect(mockHasPermissions).toHaveBeenCalledWith(['productItemsView'])
    expect(mockHasPermissions).toHaveBeenCalledWith(['productItemFiltersView'])
    expect(mockHasPermissions).toHaveBeenCalledWith(['rateCardsView'])
  })
})
