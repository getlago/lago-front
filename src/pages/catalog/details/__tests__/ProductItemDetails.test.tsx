import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { GetProductItemForDetailsDocument, ProductItemTypeEnum } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ProductItemDetails from '../ProductItemDetails'

const mockOpenEditProductItemDrawer = jest.fn()
const mockOpenDeleteProductItemDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/productItem/useProductItemDrawer', () => ({
  useProductItemDrawer: () => ({ openDrawer: mockOpenEditProductItemDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductItemDialog', () => ({
  useDeleteProductItemDialog: () => ({
    openDeleteProductItemDialog: mockOpenDeleteProductItemDialog,
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

const productItemFixture = {
  __typename: 'ProductItem',
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  description: 'Per seat billing',
  invoiceDisplayName: 'Seat charge',
  itemType: ProductItemTypeEnum.Fixed,
  attachedToPlanOrSubscription: false,
  product: null,
  billableMetric: null,
}

const detailsQueryMock = {
  request: { query: GetProductItemForDetailsDocument, variables: { id: 'pitem-1' } },
  result: { data: { productItem: productItemFixture } },
}

const ProductItemDetailsWithHeader = () => (
  <>
    <MainHeader />
    <ProductItemDetails />
  </>
)

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderPage = () =>
  rtlRender(<ProductItemDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ productItemId: 'pitem-1', tab: 'overview' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductItemDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
  })

  it('displays the product item name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent('Seats')
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent('seats')
  })

  it('renders the catalog breadcrumb link and the static grey product item crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/product-items')
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

    expect(mockOpenEditProductItemDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        productItem: expect.objectContaining({ id: 'pitem-1', code: 'seats' }),
      }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the product items list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-item-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-item-details-delete'))

    expect(mockOpenDeleteProductItemDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        productItem: expect.objectContaining({ id: 'pitem-1' }),
      }),
    )

    const { callback } = mockOpenDeleteProductItemDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/product-items')
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
