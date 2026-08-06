import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { render } from '~/test-utils'

import ProductCatalog, {
  CREATE_PRODUCT_ITEM_FILTER_TEST_ID,
  CREATE_PRODUCT_ITEM_TEST_ID,
  CREATE_PRODUCT_TEST_ID,
  PRODUCT_CATALOG_CREATE_TEST_ID,
} from '../ProductCatalog'

const renderPage = () =>
  render(
    <>
      <MainHeader />
      <ProductCatalog />
    </>,
  )

const mockHasPermissions = jest.fn()
const mockOpenCreateProductDrawer = jest.fn()
const mockOpenCreateProductItemDrawer = jest.fn()
const mockOpenCreateProductItemFilterDrawer = jest.fn()

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

// Mock the drawer hooks: the real ones load the NiceModal drawer stack
// (drawerStack.ts uses import.meta and crashes Jest).
jest.mock('../drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenCreateProductDrawer }),
}))

jest.mock('../drawers/productItem/useProductItemDrawer', () => ({
  useProductItemDrawer: () => ({ openDrawer: mockOpenCreateProductItemDrawer }),
}))

jest.mock('../drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenCreateProductItemFilterDrawer }),
}))

// The real ProductsList fires its products query on mount; this suite only
// covers tab and header wiring.
jest.mock('../ProductsList', () => ({
  __esModule: true,
  default: () => <div>products-list-stub</div>,
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
    expect(screen.getByText(PRODUCTS_TAB)).toBeInTheDocument()
    // Products is the default active tab, so its content renders
    expect(screen.getByText('products-list-stub')).toBeInTheDocument()
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

  describe('create dropdown', () => {
    it('lists the three create entries when all create permissions are granted', async () => {
      const user = userEvent.setup()

      renderPage()

      await user.click(screen.getByTestId(PRODUCT_CATALOG_CREATE_TEST_ID))

      expect(screen.getByTestId(CREATE_PRODUCT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(CREATE_PRODUCT_ITEM_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(CREATE_PRODUCT_ITEM_FILTER_TEST_ID)).toBeInTheDocument()
    })

    it.each([
      [CREATE_PRODUCT_TEST_ID, () => mockOpenCreateProductDrawer],
      [CREATE_PRODUCT_ITEM_TEST_ID, () => mockOpenCreateProductItemDrawer],
      [CREATE_PRODUCT_ITEM_FILTER_TEST_ID, () => mockOpenCreateProductItemFilterDrawer],
    ])('opens the matching drawer from the %s entry', async (itemTestId, getOpenDrawerMock) => {
      const user = userEvent.setup()

      renderPage()

      await user.click(screen.getByTestId(PRODUCT_CATALOG_CREATE_TEST_ID))
      await user.click(screen.getByTestId(itemTestId))

      expect(getOpenDrawerMock()).toHaveBeenCalledTimes(1)
    })

    it('hides an entry when its create permission is missing', async () => {
      mockHasPermissions.mockImplementation(
        (permissions: string[]) => !permissions.includes('productItemsCreate'),
      )
      const user = userEvent.setup()

      renderPage()

      await user.click(screen.getByTestId(PRODUCT_CATALOG_CREATE_TEST_ID))

      expect(screen.queryByTestId(CREATE_PRODUCT_ITEM_TEST_ID)).not.toBeInTheDocument()
      expect(screen.getByTestId(CREATE_PRODUCT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(CREATE_PRODUCT_ITEM_FILTER_TEST_ID)).toBeInTheDocument()
    })

    it('hides the whole dropdown when no create permission is granted', () => {
      const createPermissions = ['productsCreate', 'productItemsCreate', 'productItemFiltersCreate']

      mockHasPermissions.mockImplementation(
        (permissions: string[]) =>
          !permissions.some((permission) => createPermissions.includes(permission)),
      )

      renderPage()

      expect(screen.queryByTestId(PRODUCT_CATALOG_CREATE_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
