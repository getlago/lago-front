import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { ProductDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { GetProductForDetailsDocument, ProductTypeEnum } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ProductDetails from '../ProductDetails'

const mockOpenEditProductDrawer = jest.fn()
const mockOpenDeleteProductDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

// The real preview pulls in the drawer/delete hooks via the shared columns and
// actions, which reach import.meta and crash Jest; stub it out.
jest.mock('../ProductFilterPreview', () => ({
  __esModule: true,
  default: () => null,
}))

const mockRateCardPreviewProps = jest.fn()

// RateCardPreview imports useRateCardDrawer, which reaches drawerStack's
// import.meta and crashes Jest; stub it out (capture the props so the scope
// wiring can still be asserted, mirroring the drift test pattern).
jest.mock('../RateCardPreview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockRateCardPreviewProps(props)
    return null
  },
}))

const mockProductActivityLogsProps = jest.fn()

jest.mock('../ProductActivityLogs', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockProductActivityLogsProps(props)
    return null
  },
}))

jest.mock('~/pages/catalog/drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenEditProductDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductDialog', () => ({
  useDeleteProductDialog: () => ({
    openDeleteProductDialog: mockOpenDeleteProductDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const productFixture = {
  __typename: 'Product',
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  description: 'Per seat billing',
  invoiceDisplayName: 'Seat charge',
  productType: ProductTypeEnum.Fixed,
  attachedToPlanOrSubscription: false,
  productCategory: null,
  billableMetric: null,
}

const detailsQueryMock = {
  request: { query: GetProductForDetailsDocument, variables: { id: 'pitem-1' } },
  result: { data: { product: productFixture } },
}

const ProductDetailsWithHeader = () => (
  <>
    <MainHeader />
    <ProductDetails />
  </>
)

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderPage = (
  tab: ProductDetailsTabsOptionsEnum = ProductDetailsTabsOptionsEnum.overview,
) => {
  window.history.pushState({}, '', `/product-catalog/products/pitem-1/${tab}`)

  return rtlRender(<ProductDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ productId: 'pitem-1', tab }}
      >
        {children}
      </AllTheProviders>
    ),
  })
}

describe('ProductDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
  })

  it('displays the product name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent('Seats')
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent('seats')
  })

  it('renders the catalog breadcrumb link and the static grey product crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/products')
    expect(screen.getByText('text_1783980718114nwd34e3ji77')).toBeInTheDocument()
  })

  it('shows overview, rate cards, item filters and plans tabs, plus activity logs for premium', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_1783104239825nxqno33u945')).toBeInTheDocument()
    expect(screen.getByText('text_1783980718114wkor6aysepe')).toBeInTheDocument()
    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('renders the RateCardPreview scoped to this product on the rate cards tab', async () => {
    await act(() => renderPage(ProductDetailsTabsOptionsEnum.rateCards))

    await waitFor(() => {
      expect(mockRateCardPreviewProps).toHaveBeenCalledWith({
        scope: { product: expect.objectContaining({ id: 'pitem-1', name: 'Seats' }) },
      })
    })
  })

  it('renders the activity logs tab content scoped to the product', async () => {
    await act(() => renderPage(ProductDetailsTabsOptionsEnum.activityLogs))

    await waitFor(() => {
      expect(mockProductActivityLogsProps).toHaveBeenCalledWith({ productId: 'pitem-1' })
    })
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('opens the edit drawer with the loaded item from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-item-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-item-details-edit'))

    expect(mockOpenEditProductDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ id: 'pitem-1', code: 'seats' }),
      }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the products list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-item-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-item-details-delete'))

    expect(mockOpenDeleteProductDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ id: 'pitem-1' }),
      }),
    )

    const { callback } = mockOpenDeleteProductDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/products')
  })

  it('hides the whole actions dropdown without the update and delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent('Seats')
    })
    expect(screen.queryByTestId('product-item-details-actions')).not.toBeInTheDocument()
  })
})
