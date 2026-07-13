import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { GetProductForDetailsDocument } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ProductDetails from '../ProductDetails'

const mockOpenEditProductDrawer = jest.fn()
const mockOpenDeleteProductDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenEditProductDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductDialog', () => ({
  useDeleteProductDialog: () => ({ openDeleteProductDialog: mockOpenDeleteProductDialog }),
}))

// The product-items tab preview pulls the product-item drawer chain (drawerStack
// uses import.meta and crashes Jest); this suite only exercises the header/tabs.
jest.mock('../ProductDetailsProductItems', () => ({
  ProductDetailsProductItems: () => null,
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
  id: 'prod-1',
  name: 'Object storage',
  code: 'object_storage',
  description: 'Base storage product',
  invoiceDisplayName: 'Storage',
  attachedToPlanOrSubscription: false,
}

const detailsQueryMock = {
  request: { query: GetProductForDetailsDocument, variables: { id: 'prod-1' } },
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
const renderPage = () =>
  rtlRender(<ProductDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ productId: 'prod-1', tab: 'overview' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
  })

  it('displays the product name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Object storage',
      )
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
      'object_storage',
    )
  })

  it('renders the catalog breadcrumb link and the static grey product crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/products')
    expect(
      screen.queryByRole('link', { name: 'text_1783020794399ai60io2ufkg' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('text_1783020794399ai60io2ufkg')).toBeInTheDocument()
  })

  it('shows the overview, product items and plans tabs, plus activity logs for premium', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_17831042398250iwa2xp8pba')).toBeInTheDocument()
    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('opens the edit drawer with the loaded product from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-details-edit'))

    expect(mockOpenEditProductDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-1', code: 'object_storage' }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the products list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-details-delete'))

    expect(mockOpenDeleteProductDialog).toHaveBeenCalledWith(
      expect.objectContaining({ product: expect.objectContaining({ id: 'prod-1' }) }),
    )

    const { callback } = mockOpenDeleteProductDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/products')
  })

  it('hides the whole actions dropdown without the update and delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Object storage',
      )
    })
    expect(screen.queryByTestId('product-details-actions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('product-details-edit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('product-details-delete')).not.toBeInTheDocument()
  })
})
